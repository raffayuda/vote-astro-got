import { logoutJudge } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { JudgeScoring } from "@/components/judge-scoring";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/alert";
import { prisma } from "@/lib/prisma";
import { CRITERIA } from "@/lib/scoring";
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
  const initialScores: Record<number, Record<string, number>> = Object.fromEntries(
    scores.map((s) => [s.teamId, Object.fromEntries(CRITERIA.map((c) => [c.key, s[c.key]]))]),
  );

  return (
    <>
      <Navbar
        size="md"
        action={
          <form action={logoutJudge}>
            <Button type="submit" variant="ghost" size="sm">Keluar</Button>
          </form>
        }
      />
      <main className="flex-1 pb-10 pt-6">
        <Container size="lg" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-astro-navy">Penilaian Juri</h1>
              <p className="text-sm text-muted">Nilai untuk babak {votingSession.stage}. Nilai bisa diubah kapan saja.</p>
            </div>
            <Badge tone="accent" className="text-sm">Babak: {votingSession.stage}</Badge>
          </div>
          {teams.length === 0 ? (
            <Alert tone="info">Belum ada penampilan yang terdaftar di babak ini.</Alert>
          ) : (
            <JudgeScoring teams={teams} initialScores={initialScores} judgeName={session.user.name} />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
