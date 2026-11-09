import { prisma } from "@/lib/prisma";
import { getVotingSession } from "@/lib/voting-session";
import {
  finalScore,
  votingScore,
  weightedJudgeScore,
  overallAccumulatedScore,
  SHOWCASE_STAGE_WEIGHT,
  FINAL_STAGE_WEIGHT,
} from "@/lib/scoring";

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
  // Rincian Akumulasi Babak Showcase & Final:
  showcaseScore?: number;
  finalRoundScore?: number;
  finalJudgeScore?: number;
  finalVotes?: number;
  finalVotingScore?: number;
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
  const isShowcase = selectedStage?.toLowerCase() === "showcase";
  const isFinal = selectedStage?.toLowerCase() === "final";
  const isAllStages = !selectedStage || stageFilter === "Semua";

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
    const stageRecord = await prisma.stage.findFirst({
      where: { name: { equals: selectedStage, mode: "insensitive" } },
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
      by: ["teamId", "stage"],
      where: {
        teamId: { not: null },
        ...(selectedStage ? { stage: { equals: selectedStage, mode: "insensitive" } } : {}),
      },
      _count: { _all: true },
    }),
    prisma.judgeScore.findMany({
      where: selectedStage ? { stage: { equals: selectedStage, mode: "insensitive" } } : {},
    }),
    prisma.qrCode.aggregate({ _sum: { maxUses: true } }),
    prisma.user.findMany({
      where: { role: "judge" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const judgeNameById = new Map(judges.map((j) => [j.id, j.name]));

  // Hitung suara per tim di babak terpilih atau babak Final
  const votesByTeam = new Map<number, number>();
  const finalVotesByTeam = new Map<number, number>();

  for (const g of grouped) {
    if (g.teamId !== null) {
      const prev = votesByTeam.get(g.teamId) ?? 0;
      votesByTeam.set(g.teamId, prev + g._count._all);

      if (g.stage?.toLowerCase() === "final") {
        finalVotesByTeam.set(g.teamId, g._count._all);
      }
    }
  }

  const totalVotes = [...votesByTeam.values()].reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(0, ...votesByTeam.values());
  const maxFinalVotes = Math.max(0, ...finalVotesByTeam.values());

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

    // Nilai juri untuk babak yang sedang difilter
    const judgeScore = breakdown.length
      ? breakdown.reduce((sum, s) => sum + s.weighted, 0) / breakdown.length
      : 0;

    if (isShowcase) {
      // 1. BABAK SHOWCASE: Murni 100% penilaian juri (tanpa voting penonton)
      return {
        id: team.id,
        name: team.name,
        members: team.members ?? "",
        photoUrl: team.photoUrl,
        votes: 0,
        votePercent: 0,
        judgeCount: breakdown.length,
        judgeScore: Math.round(judgeScore * 100) / 100,
        votingScore: 0,
        finalScore: Math.round(judgeScore * 100) / 100,
        judges: breakdown,
        showcaseScore: Math.round(judgeScore * 100) / 100,
      };
    }

    if (isFinal) {
      // 2. BABAK FINAL: Gabungan 50% juri Final + 50% voting Final
      const votes = votesByTeam.get(team.id) ?? 0;
      const voting = votingScore(votes, maxVotes);
      const roundScore = finalScore(judgeScore, voting);

      return {
        id: team.id,
        name: team.name,
        members: team.members ?? "",
        photoUrl: team.photoUrl,
        votes,
        votePercent: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
        judgeCount: breakdown.length,
        judgeScore: Math.round(judgeScore * 100) / 100,
        votingScore: Math.round(voting * 100) / 100,
        finalScore: Math.round(roundScore * 100) / 100,
        judges: breakdown,
        finalRoundScore: Math.round(roundScore * 100) / 100,
      };
    }

    if (isAllStages) {
      // 3. SEMUA BABAK (AKUMULASI JUARA): Showcase 30% + Final 70%
      const showcaseScores = teamScores.filter((s) => s.stage?.toLowerCase() === "showcase");
      const finalScores = teamScores.filter((s) => s.stage?.toLowerCase() === "final");

      const showcaseJudgeScore = showcaseScores.length
        ? showcaseScores.reduce((sum, s) => sum + weightedJudgeScore(s), 0) / showcaseScores.length
        : 0;

      const finalJudgeScore = finalScores.length
        ? finalScores.reduce((sum, s) => sum + weightedJudgeScore(s), 0) / finalScores.length
        : 0;

      const finalVotes = finalVotesByTeam.get(team.id) ?? 0;
      const finalVoting = votingScore(finalVotes, maxFinalVotes);
      const roundFinalScore = finalScore(finalJudgeScore, finalVoting);

      // Formula Akumulasi: (Showcase × 30%) + (Final × 70%)
      const accumulated = overallAccumulatedScore(showcaseJudgeScore, roundFinalScore);

      return {
        id: team.id,
        name: team.name,
        members: team.members ?? "",
        photoUrl: team.photoUrl,
        votes: finalVotes,
        votePercent: totalVotes > 0 ? (finalVotes / totalVotes) * 100 : 0,
        judgeCount: breakdown.length,
        judgeScore: Math.round(finalJudgeScore * 100) / 100,
        votingScore: Math.round(finalVoting * 100) / 100,
        finalScore: Math.round(accumulated * 100) / 100,
        judges: breakdown,
        showcaseScore: Math.round(showcaseJudgeScore * 100) / 100,
        finalRoundScore: Math.round(roundFinalScore * 100) / 100,
        finalJudgeScore: Math.round(finalJudgeScore * 100) / 100,
        finalVotes,
        finalVotingScore: Math.round(finalVoting * 100) / 100,
      };
    }

    // Default / Sesi Lainnya
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
      judgeScore: Math.round(judgeScore * 100) / 100,
      votingScore: Math.round(voting * 100) / 100,
      finalScore: Math.round(finalScore(judgeScore, voting) * 100) / 100,
      judges: breakdown,
    };
  });

  // Urutkan peringkat tertinggi
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
