import { logoutJudge } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { JudgeScoring } from "@/components/judge-scoring";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { prisma } from "@/lib/prisma";
import { CRITERIA } from "@/lib/scoring";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Penilaian Juri — ASTRO Got Talent" };

export default async function JudgePage() {
  const session = await requireRole("judge");
  const [teams, scores] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    prisma.judgeScore.findMany({ where: { judgeId: session.user.id } }),
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
          <div>
            <h1 className="font-display text-2xl font-extrabold text-astro-navy">Penilaian Juri</h1>
            <p className="text-sm text-muted">Nilai bisa diubah kapan saja.</p>
          </div>
          <JudgeScoring teams={teams} initialScores={initialScores} judgeName={session.user.name} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
