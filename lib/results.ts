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

export type JudgeSummary = {
  id: string;
  name: string;
  email: string;
  scoredCount: number;
};

export type ResultsData = {
  teams: TeamResult[];
  totalVotes: number;
  totalQuota: number;
  maxVotes: number;
  isOpen: boolean;
  stage: string;
  activeStage: string;
  availableStages: string[];
  judges: JudgeSummary[];
};

export async function getResults(stageFilter?: string): Promise<ResultsData> {
  const session = await getVotingSession();
  const activeStage = session.stage ?? "Penyisihan";
  const selectedStage = stageFilter === "Semua" ? undefined : (stageFilter || activeStage);

  const [dbStages, distinctBallotStages, distinctScoreStages] = await Promise.all([
    prisma.stage.findMany({ select: { name: true }, orderBy: { id: "asc" } }),
    prisma.ballot.findMany({ distinct: ["stage"], select: { stage: true } }),
    prisma.judgeScore.findMany({ distinct: ["stage"], select: { stage: true } }),
  ]);

  const availableStages = [
    ...new Set([
      ...dbStages.map((s) => s.name),
      activeStage,
      ...distinctBallotStages.map((b) => b.stage),
      ...distinctScoreStages.map((s) => s.stage),
    ]),
  ].filter(Boolean);

  let teamWhere = {};
  if (selectedStage) {
    const stageRecord = await prisma.stage.findUnique({
      where: { name: selectedStage },
      include: { teams: true },
    });
    if (stageRecord && stageRecord.teams.length > 0) {
      teamWhere = { id: { in: stageRecord.teams.map((st) => st.teamId) } };
    }
  }

  const [teams, grouped, scores, quota, judges] = await Promise.all([
    prisma.team.findMany({
      where: teamWhere,
      orderBy: [{ order: "asc" }, { id: "asc" }],
    }),
    prisma.ballot.groupBy({
      by: ["teamId"],
      where: {
        teamId: { not: null },
        ...(selectedStage ? { stage: selectedStage } : {}),
      },
      _count: { _all: true },
    }),
    prisma.judgeScore.findMany({
      where: selectedStage ? { stage: selectedStage } : {},
    }),
    prisma.qrCode.aggregate({ _sum: { maxUses: true } }),
    prisma.user.findMany({ where: { role: "judge" }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
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

  const judgeList: JudgeSummary[] = judges.map((j) => {
    const scoredCount = scores.filter((s) => s.judgeId === j.id).length;
    return {
      id: j.id,
      name: j.name,
      email: j.email ?? "",
      scoredCount,
    };
  });

  return {
    teams: rows,
    totalVotes,
    totalQuota: quota._sum.maxUses ?? 0,
    maxVotes,
    isOpen: session.isOpen,
    stage: selectedStage ?? "Semua",
    activeStage,
    availableStages,
    judges: judgeList,
  };
}
