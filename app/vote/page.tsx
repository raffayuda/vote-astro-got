import { redirect } from "next/navigation";
import { logoutVoter } from "@/app/actions/auth";
import { AutoRefresh } from "@/components/auto-refresh";
import { Footer } from "@/components/footer";
import { BrandLogo } from "@/components/brand-logo";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { VoteBoard } from "@/components/vote-board";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

export const metadata = { title: "Voting — ASTRO Got Talent" };

export default async function VotePage() {
  const session = await requireRole("voter");
  const voter = await prisma.voter.findUnique({ where: { userId: session.user.id } });
  if (!voter) redirect("/");
  if (voter.votedAt) redirect("/vote/selesai");

  const [teams, votingSession] = await Promise.all([
    prisma.team.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, photoUrl: true, description: true },
    }),
    getVotingSession(),
  ]);

  return (
    <>
      <AutoRefresh seconds={5} />
      <main className="flex-1 py-6">
        <Container size="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <BrandLogo height={48} />
            <form action={logoutVoter}>
              <Button type="submit" variant="secondary" size="sm">Keluar</Button>
            </form>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-astro-navy">Pilih Tim Favoritmu</h1>
              <p className="text-sm text-muted">{voter.label ?? "Halo, penonton"} · pilih satu tim</p>
            </div>
            <Badge tone={votingSession.isOpen ? "success" : "danger"}>
              {votingSession.isOpen ? "Voting dibuka" : "Voting ditutup"}
            </Badge>
          </div>
          {!votingSession.isOpen && (
            <Alert tone="info">
              Sesi voting belum dibuka atau sudah ditutup. Tombol vote aktif otomatis saat MC membuka sesi.
            </Alert>
          )}
          {teams.length === 0 ? (
            <Alert tone="info">Belum ada tim finalis.</Alert>
          ) : (
            <VoteBoard teams={teams} isOpen={votingSession.isOpen} />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
