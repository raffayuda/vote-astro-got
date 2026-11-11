import { prisma } from "@/lib/prisma";
import { getVotingSession } from "@/lib/voting-session";
import {
  FINAL_STAGE_WEIGHT,
  SHOWCASE_STAGE_WEIGHT,
  finalScore,
  overallAccumulatedScore,
  votingScore as normalizeVoting,
  weightedJudgeScore,
} from "@/lib/scoring";

const round2 = (value: number) => Math.round(value * 100) / 100;

export type TransparencyJudgeScore = {
  judgeId: string;
  judgeName: string;
  hasScored: boolean;
  kreativitas?: number;
  teknis?: number;
  panggung?: number;
  kostum?: number;
  weightedScore?: number;
  notes: string;
};

export type TransparencyStageTeam = {
  teamId: number;
  name: string;
  members: string;
  photoUrl: string;
  order: number;
  votes: number;
  votingScore: number;
  judgeScore: number;
  judgeCount: number;
  score: number;
  judges: TransparencyJudgeScore[];
};

export type TransparencyStage = {
  name: string;
  isShowcase: boolean;
  isFinal: boolean;
  totalVotes: number;
  maxVotes: number;
  teams: TransparencyStageTeam[];
};

export type TransparencyOverallTeam = {
  teamId: number;
  name: string;
  members: string;
  photoUrl: string;
  order: number;
  showcaseScore: number;
  showcasePoints: number;
  finalJudgeScore: number;
  finalVotingScore: number;
  finalVotes: number;
  finalRoundScore: number;
  finalPoints: number;
  totalScore: number;
  rank: number;
};

export type TransparencyData = {
  stages: TransparencyStage[];
  overall: TransparencyOverallTeam[];
  activeStage: string;
  isOpen: boolean;
};

/**
 * Data transparansi penilaian:
 * - rincian nilai juri per babak + voting penonton
 * - akumulasi juara: Showcase 30% (100% juri) + Final 70% (50% juri + 50% voting)
 */
export async function getTransparencyData(): Promise<TransparencyData> {
  const [session, stages, judges, teams, scores, voteGroups] = await Promise.all([
    getVotingSession(),
    prisma.stage.findMany({
      orderBy: { id: "asc" },
      include: { teams: { select: { teamId: true } } },
    }),
    prisma.user.findMany({
      where: { role: "judge" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    prisma.judgeScore.findMany(),
    prisma.ballot.groupBy({
      by: ["stage", "teamId"],
      where: { teamId: { not: null }, votedAt: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const teamById = new Map(teams.map((team) => [team.id, team]));

  const stageNames: string[] = [];
  for (const name of [
    ...stages.map((stage) => stage.name),
    ...scores.map((score) => score.stage),
    ...voteGroups.map((group) => group.stage),
  ]) {
    if (!stageNames.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      stageNames.push(name);
    }
  }

  const votesByStage = new Map<string, Map<number, number>>();
  for (const group of voteGroups) {
    if (group.teamId === null) continue;
    const key = group.stage.toLowerCase();
    const teamVotes = votesByStage.get(key) ?? new Map<number, number>();
    teamVotes.set(group.teamId, (teamVotes.get(group.teamId) ?? 0) + group._count._all);
    votesByStage.set(key, teamVotes);
  }

  const stagesDetail = stageNames.map((name) => {
    const key = name.toLowerCase();
    const stageRecord = stages.find((stage) => stage.name.toLowerCase() === key);
    const stageScores = scores.filter((score) => score.stage.toLowerCase() === key);
    const votes = votesByStage.get(key) ?? new Map<number, number>();

    const teamIds = new Set<number>();
    for (const stageTeam of stageRecord?.teams ?? []) teamIds.add(stageTeam.teamId);
    for (const score of stageScores) teamIds.add(score.teamId);
    for (const teamId of votes.keys()) teamIds.add(teamId);

    const totalVotes = [...votes.values()].reduce((sum, count) => sum + count, 0);
    const maxVotes = Math.max(0, ...votes.values());
    const isShowcase = key === "showcase";
    const isFinal = key === "final";

    const stageTeams: TransparencyStageTeam[] = [...teamIds]
      .map((teamId) => {
        const team = teamById.get(teamId);
        if (!team) return null;

        const teamScores = stageScores.filter((score) => score.teamId === teamId);
        const judgeScores: TransparencyJudgeScore[] = judges.map((judge) => {
          const found = teamScores.find((score) => score.judgeId === judge.id);
          if (!found) {
            return {
              judgeId: judge.id,
              judgeName: judge.name,
              hasScored: false,
              notes: "",
            };
          }
          return {
            judgeId: judge.id,
            judgeName: judge.name,
            hasScored: true,
            kreativitas: found.kreativitas,
            teknis: found.teknis,
            panggung: found.panggung,
            kostum: found.kostum,
            weightedScore: round2(weightedJudgeScore(found)),
            notes: found.notes ?? "",
          };
        });

        const scoredJudges = judgeScores.filter(
          (judge) => judge.hasScored && judge.weightedScore != null,
        );
        const judgeScore = scoredJudges.length
          ? round2(
              scoredJudges.reduce((sum, judge) => sum + (judge.weightedScore ?? 0), 0) /
                scoredJudges.length,
            )
          : 0;

        const votesCount = votes.get(teamId) ?? 0;
        const voting = isShowcase ? 0 : round2(normalizeVoting(votesCount, maxVotes));
        const score =
          isShowcase || (totalVotes === 0 && !isFinal)
            ? judgeScore
            : round2(finalScore(judgeScore, voting));

        return {
          teamId,
          name: team.name,
          members: team.members ?? "",
          photoUrl: team.photoUrl,
          order: team.order,
          votes: votesCount,
          votingScore: voting,
          judgeScore,
          judgeCount: scoredJudges.length,
          score,
          judges: judgeScores,
        };
      })
      .filter((team): team is TransparencyStageTeam => team !== null)
      .sort((a, b) => b.score - a.score || b.votes - a.votes || a.order - b.order);

    return {
      name,
      isShowcase,
      isFinal,
      totalVotes,
      maxVotes,
      teams: stageTeams,
    };
  });

  const showcaseStage = stagesDetail.find((stage) => stage.isShowcase);
  const finalStage = stagesDetail.find((stage) => stage.isFinal);
  const finalistIds =
    finalStage && finalStage.teams.length > 0
      ? finalStage.teams.map((team) => team.teamId)
      : [
          ...new Set([
            ...(finalStage?.teams.map((team) => team.teamId) ?? []),
            ...(showcaseStage?.teams.map((team) => team.teamId) ?? []),
          ]),
        ];
  const overallIds = finalistIds.length > 0 ? finalistIds : teams.map((team) => team.id);

  const overall = overallIds
    .map((teamId) => {
      const team = teamById.get(teamId);
      if (!team) return null;

      const showcaseTeam = showcaseStage?.teams.find((entry) => entry.teamId === teamId);
      const finalTeam = finalStage?.teams.find((entry) => entry.teamId === teamId);
      const showcaseScore = showcaseTeam?.judgeScore ?? 0;
      const finalJudgeScore = finalTeam?.judgeScore ?? 0;
      const finalVotingScore = finalTeam?.votingScore ?? 0;
      const finalRoundScore =
        finalTeam?.score ?? round2(finalScore(finalJudgeScore, finalVotingScore));
      const totalScore = round2(
        overallAccumulatedScore(showcaseScore, finalRoundScore),
      );

      return {
        teamId,
        name: team.name,
        members: team.members ?? "",
        photoUrl: team.photoUrl,
        order: team.order,
        showcaseScore,
        showcasePoints: round2(showcaseScore * SHOWCASE_STAGE_WEIGHT),
        finalJudgeScore,
        finalVotingScore,
        finalVotes: finalTeam?.votes ?? 0,
        finalRoundScore,
        finalPoints: round2(finalRoundScore * FINAL_STAGE_WEIGHT),
        totalScore,
        rank: 0,
      };
    })
    .filter((team): team is TransparencyOverallTeam => team !== null)
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        b.finalVotes - a.finalVotes ||
        a.order - b.order,
    )
    .map((team, index) => ({ ...team, rank: index + 1 }));

  return {
    stages: stagesDetail,
    overall,
    activeStage: session.stage,
    isOpen: session.isOpen,
  };
}
