import { prisma } from "@/lib/prisma";
import { getVotingSession } from "@/lib/voting-session";
import { finalScore, votingScore, weightedJudgeScore } from "@/lib/scoring";

export type JudgeBreakdown = {
  judgeId: string;
  judgeName: string;
  kreativitas: number;
  teknis: number;
  panggung: number;
  kostum: number;
  weighted: number;
};

export type TeamResult = {
  id: number;
  name: string;
  members: string;
  photoUrl: string;
  votes: number;
  votePercent: number;
  judgeCount: number;
  judgeScore: number;
  votingScore: number;
  finalScore: number;
  judges: JudgeBreakdown[];
};

export type ResultsData = {
  teams: TeamResult[];
  totalVotes: number;
  totalVoters: number;
  maxVotes: number;
  isOpen: boolean;
};

export async function getResults(): Promise<ResultsData> {
  const [teams, grouped, scores, totalVoters, session, judges] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    prisma.voter.groupBy({
      by: ["teamId"],
      where: { teamId: { not: null } },
      _count: { _all: true },
    }),
    prisma.judgeScore.findMany(),
    prisma.voter.count(),
    getVotingSession(),
    prisma.user.findMany({ where: { role: "judge" }, select: { id: true, name: true } }),
  ]);

  const judgeNameById = new Map(judges.map((j) => [j.id, j.name]));
  const votesByTeam = new Map<number, number>();
  for (const g of grouped) {
    if (g.teamId !== null) votesByTeam.set(g.teamId, g._count._all);
  }
  const totalVotes = [...votesByTeam.values()].reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(0, ...votesByTeam.values());

  const rows: TeamResult[] = teams.map((team) => {
    const teamScores = scores.filter((s) => s.teamId === team.id);
    const breakdown: JudgeBreakdown[] = teamScores.map((s) => ({
      judgeId: s.judgeId,
      judgeName: judgeNameById.get(s.judgeId) ?? "Juri",
      kreativitas: s.kreativitas,
      teknis: s.teknis,
      panggung: s.panggung,
      kostum: s.kostum,
      weighted: weightedJudgeScore(s),
    }));
    const judgeScore = breakdown.length
      ? breakdown.reduce((sum, s) => sum + s.weighted, 0) / breakdown.length
      : 0;
    const votes = votesByTeam.get(team.id) ?? 0;
    const voting = votingScore(votes, maxVotes);
    return {
      id: team.id,
      name: team.name,
      members: team.members ?? "",
      photoUrl: team.photoUrl,
      votes,
      votePercent: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
      judgeCount: breakdown.length,
      judgeScore,
      votingScore: voting,
      finalScore: finalScore(judgeScore, voting),
      judges: breakdown,
    };
  });

  rows.sort((a, b) => b.finalScore - a.finalScore || b.votes - a.votes);
  return { teams: rows, totalVotes, totalVoters, maxVotes, isOpen: session.isOpen };
}
