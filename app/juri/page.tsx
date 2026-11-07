import { logoutJudge } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { JudgeScoring } from "@/components/judge-scoring";
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

export const metadata = { title: "Penilaian Juri — ASTRO Got Talent" };

export default async function JudgePage() {
  const [session, votingSession, activeStage] = await Promise.all([
    requireRole("judge"),
    getVotingSession(),
    getActiveStage(),
  ]);

  const enrolledTeamIds = activeStage?.teams.map((st) => st.teamId) ?? [];

  const [teams, scores] = await Promise.all([
    prisma.team.findMany({
      where: enrolledTeamIds.length > 0 ? { id: { in: enrolledTeamIds } } : {},
      orderBy: [{ order: "asc" }, { id: "asc" }],
    }),
    prisma.judgeScore.findMany({ where: { judgeId: session.user.id, stage: votingSession.stage } }),
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
            />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
