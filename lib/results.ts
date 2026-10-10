import { prisma } from "@/lib/prisma";
import { getVotingSession } from "@/lib/voting-session";
import { finalScore, votingScore, weightedJudgeScore } from "@/lib/scoring";

export type TeamResult = {
  id: number;
  name: string;
  photoUrl: string;
  votes: number;
  votePercent: number;
  judgeCount: number;
  judgeScore: number;
  votingScore: number;
  finalScore: number;
};

export type ResultsData = {
  teams: TeamResult[];
  totalVotes: number;
  totalVoters: number;
  isOpen: boolean;
};

export async function getResults(): Promise<ResultsData> {
  const [teams, grouped, scores, totalVoters, session] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    prisma.voter.groupBy({
      by: ["teamId"],
      where: { teamId: { not: null } },
      _count: { _all: true },
    }),
    prisma.judgeScore.findMany(),
    prisma.voter.count(),
    getVotingSession(),
  ]);

  const votesByTeam = new Map<number, number>();
  for (const g of grouped) {
    if (g.teamId !== null) votesByTeam.set(g.teamId, g._count._all);
  }
  const totalVotes = [...votesByTeam.values()].reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(0, ...votesByTeam.values());

  const rows: TeamResult[] = teams.map((team) => {
    const teamScores = scores.filter((s) => s.teamId === team.id);
    const judgeScore = teamScores.length
      ? teamScores.reduce((sum, s) => sum + weightedJudgeScore(s), 0) / teamScores.length
      : 0;
    const votes = votesByTeam.get(team.id) ?? 0;
    const voting = votingScore(votes, maxVotes);
    return {
      id: team.id,
      name: team.name,
      photoUrl: team.photoUrl,
      votes,
      votePercent: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
      judgeCount: teamScores.length,
      judgeScore,
      votingScore: voting,
      finalScore: finalScore(judgeScore, voting),
    };
  });

  rows.sort((a, b) => b.finalScore - a.finalScore || b.votes - a.votes);
  return { teams: rows, totalVotes, totalVoters, isOpen: session.isOpen };
}
