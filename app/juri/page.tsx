import { logoutJudge } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ScoreForm } from "@/components/score-form";
import { TeamCard } from "@/components/team-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  const scoreByTeam = new Map(scores.map((s) => [s.teamId, s]));

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
        <Container size="md" className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-astro-navy">Penilaian Juri</h1>
            <p className="text-sm text-muted">
              {session.user.name} · {scores.length}/{teams.length} tim dinilai
            </p>
          </div>
          <Alert tone="info">
            Nilai 0–100 per kriteria. Bobot:{" "}
            {CRITERIA.map((c) => `${c.label} ${c.weight * 100}%`).join(", ")}. Nilai bisa diubah kapan saja.
          </Alert>
          {teams.length === 0 && <Alert tone="info">Belum ada tim.</Alert>}
          {teams.map((team, i) => {
            const existing = scoreByTeam.get(team.id);
            return (
              <TeamCard
                key={team.id}
                number={i + 1}
                name={team.name}
                photoUrl={team.photoUrl}
                description={team.description}
                highlighted={!!existing}
                action={
                  <>
                    {existing && <Badge tone="success" className="self-start">Sudah dinilai</Badge>}
                    <ScoreForm teamId={team.id} initial={existing} />
                  </>
                }
              />
            );
          })}
        </Container>
      </main>
      <Footer />
    </>
  );
}
