import { setVotingStage, toggleVoting } from "@/app/actions/vote";
import { LiveResults } from "@/components/live-results";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getResults } from "@/lib/results";

export const metadata = { title: "Panel Panitia — ASTRO Got Talent" };

export default async function AdminHomePage() {
  const [results, stages] = await Promise.all([
    getResults(),
    prisma.stage.findMany({
      include: { _count: { select: { teams: true } } },
      orderBy: { id: "asc" },
    }),
  ]);

  const activeStageObj = stages.find((s) => s.name === results.activeStage);
  const activeTeamsCount = activeStageObj?._count.teams ?? 0;

  return (
    <>
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Sesi Voting</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Buka saat MC mengumumkan voting resmi dimulai. Jika ditutup, tombol vote penonton tidak bisa ditekan.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent" className="text-sm font-bold">
                Babak Aktif: {results.activeStage}
              </Badge>
              {activeTeamsCount > 0 && (
                <Badge tone="neutral" className="text-xs">
                  {activeTeamsCount} Penampilan Bertanding
                </Badge>
              )}
              <Badge tone={results.isOpen ? "success" : "danger"}>
                {results.isOpen ? "Sedang dibuka" : "Sedang ditutup"}
              </Badge>
            </div>
          </div>
          <form action={toggleVoting}>
            <Button type="submit" size="lg" variant={results.isOpen ? "danger" : "primary"} full>
              {results.isOpen ? "Tutup Voting" : "Buka Voting"}
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-3 border-t border-line/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Ganti Sesi Cepat:</span>
            {stages.map((stage) => {
              const isActive = stage.name === results.activeStage;
              return (
                <form
                  key={stage.id}
                  action={async () => {
                    "use server";
                    await setVotingStage(stage.name);
                  }}
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className={isActive ? "ring-2 ring-astro-blue/50" : ""}
                  >
                    {isActive ? `✓ ${stage.name}` : stage.name}
                  </Button>
                </form>
              );
            })}
          </div>

          <ButtonLink href="/admin/sesi" variant="secondary" size="sm" className="self-start sm:self-auto">
            Kelola Sesi &amp; Penampilan Peserta →
          </ButtonLink>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <LiveResults initial={results} />
      </section>
    </>
  );
}
