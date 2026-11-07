import { logoutJudge } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { JudgeScoring, type TeamJudgesSummary, type JudgeDetailScore } from "@/components/judge-scoring";
import { type ScoreRecord } from "@/components/score-form";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/alert";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";
import { getActiveStage } from "@/lib/stages";
import { weightedJudgeScore } from "@/lib/scoring";

export const metadata = { title: "Penilaian Juri — ASTRO Got Talent" };

export default async function JudgePage() {
  const [session, votingSession, activeStage] = await Promise.all([
    requireRole("judge"),
    getVotingSession(),
    getActiveStage(),
  ]);

  const enrolledTeamIds = activeStage?.teams.map((st) => st.teamId) ?? [];

  const [teams, scores, allStageScores, judges] = await Promise.all([
    prisma.team.findMany({
      where: enrolledTeamIds.length > 0 ? { id: { in: enrolledTeamIds } } : {},
      orderBy: [{ order: "asc" }, { id: "asc" }],
    }),
    prisma.judgeScore.findMany({ where: { judgeId: session.user.id, stage: votingSession.stage } }),
    prisma.judgeScore.findMany({
      where: { stage: votingSession.stage },
      include: { judge: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { role: "judge" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialScores: Record<number, ScoreRecord> = Object.fromEntries(
    scores.map((s) => [
      s.teamId,
      {
        kreativitas: s.kreativitas,
        teknis: s.teknis,
        panggung: s.panggung,
        kostum: s.kostum,
        notes: s.notes ?? "",
      },
    ]),
  );

  // Rekapitulasi nilai seluruh juri per penampilan pada babak aktif
  const teamJudgesSummaries: Record<number, TeamJudgesSummary> = Object.fromEntries(
    teams.map((t) => {
      const teamScores = allStageScores.filter((s) => s.teamId === t.id);
      const judgeBreakdown: JudgeDetailScore[] = judges.map((j) => {
        const found = teamScores.find((s) => s.judgeId === j.id);
        if (found) {
          const weighted = weightedJudgeScore(found);
          return {
            judgeId: j.id,
            judgeName: j.name,
            judgeEmail: j.email,
            isMe: j.id === session.user.id,
            hasScored: true,
            kreativitas: found.kreativitas,
            teknis: found.teknis,
            panggung: found.panggung,
            kostum: found.kostum,
            weightedScore: Math.round(weighted * 100) / 100,
            notes: found.notes || "",
          };
        }
        return {
          judgeId: j.id,
          judgeName: j.name,
          judgeEmail: j.email,
          isMe: j.id === session.user.id,
          hasScored: false,
        };
      });

      const scoredOnly = judgeBreakdown.filter((j) => j.hasScored && j.weightedScore != null);
      const averageWeightedScore =
        scoredOnly.length > 0
          ? Math.round(
              (scoredOnly.reduce((sum, j) => sum + (j.weightedScore || 0), 0) / scoredOnly.length) * 100,
            ) / 100
          : null;

      return [
        t.id,
        {
          teamId: t.id,
          averageWeightedScore,
          judgesScoredCount: scoredOnly.length,
          totalJudgesCount: judges.length,
          judgeScores: judgeBreakdown,
        },
      ];
    }),
  );

  return (
    <>
      <Navbar
        size="lg"
        links={[
          { href: "/juri", label: "Penilaian" },
          { href: "/juri/akun", label: "Ganti Password" },
        ]}
        action={
          <form action={logoutJudge}>
            <Button type="submit" variant="ghost" size="sm">
              Keluar
            </Button>
          </form>
        }
      />
      <main className="flex-1 pb-12 pt-6">
        <Container size="lg" className="flex flex-col gap-5">
          {/* Header Juri */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-astro-navy">
                Penilaian Juri
              </h1>
              <p className="text-sm text-muted">
                Lembar penilaian resmi untuk babak <strong className="text-astro-navy">{votingSession.stage}</strong>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={votingSession.isOpen ? "success" : "danger"} className="text-sm">
                {votingSession.isOpen ? "Voting Dibuka" : "Voting Ditutup"}
              </Badge>
              <Badge tone="accent" className="text-sm">
                Babak: {votingSession.stage}
              </Badge>
              <ButtonLink href="/juri/akun" variant="secondary" size="sm">
                Ganti Password
              </ButtonLink>
            </div>
          </div>

          {/* Status Alert Voting */}
          {!votingSession.isOpen ? (
            <Alert tone="error" className="text-sm">
              <strong>Voting Sedang Ditutup:</strong> Panitia saat ini menutup voting untuk babak{" "}
              {votingSession.stage}. Anda tidak dapat mengirim atau mengubah nilai juri sampai panitia membuka kembali voting.
            </Alert>
          ) : (
            <Alert tone="info" className="text-sm">
              <strong>Voting Sedang Berlangsung:</strong> Babak {votingSession.stage} sedang aktif. Silakan pilih nilai preset (50, 65, 75, 85, 95) dan masukkan catatan komentar untuk setiap penampilan peserta.
            </Alert>
          )}

          {teams.length === 0 ? (
            <Alert tone="info">
              Belum ada penampilan yang didaftarkan ke babak {votingSession.stage} oleh panitia.
            </Alert>
          ) : (
            <JudgeScoring
              key={`${session.user.id}-${votingSession.stage}`}
              judgeId={session.user.id}
              teams={teams}
              initialScores={initialScores}
              judgeName={session.user.name}
              stage={votingSession.stage}
              isOpen={votingSession.isOpen}
              teamJudgesSummaries={teamJudgesSummaries}
            />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
