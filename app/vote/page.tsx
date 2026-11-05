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
import { requireRole, signOutCurrent } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";
import { getActiveStage } from "@/lib/stages";

export const metadata = { title: "Voting — ASTRO Got Talent" };

export default async function VotePage() {
  const [session, votingSession, activeStage] = await Promise.all([
    requireRole("voter"),
    getVotingSession(),
    getActiveStage(),
  ]);

  let ballot = await prisma.ballot.findFirst({
    where: { userId: session.user.id, stage: votingSession.stage },
    include: { qr: { select: { label: true, tableName: true } } },
  });

  // Jika penonton sudah punya akun dari sesi sebelumnya, buatkan ballot untuk babak aktif ini
  if (!ballot) {
    const prevBallot = await prisma.ballot.findFirst({ where: { userId: session.user.id } });
    if (prevBallot) {
      const qrId = prevBallot.qrId;
      const qr = await prisma.qrCode.findUnique({ where: { id: qrId }, select: { maxUses: true } });
      const usedInStage = await prisma.ballot.count({
        where: { qrId, stage: votingSession.stage, votedAt: { not: null } },
      });
      if (qr && usedInStage < qr.maxUses) {
        ballot = await prisma.ballot.create({
          data: { qrId, stage: votingSession.stage, userId: session.user.id },
          include: { qr: { select: { label: true, tableName: true } } },
        });
      }
    }
  }

  if (!ballot) {
    await signOutCurrent();
    redirect("/?e=full");
  }
  if (ballot.votedAt) redirect("/vote/selesai");

  const enrolledTeamIds = activeStage?.teams.map((st) => st.teamId) ?? [];
  const teams = await prisma.team.findMany({
    where: enrolledTeamIds.length > 0 ? { id: { in: enrolledTeamIds } } : {},
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true, name: true, members: true, photoUrl: true, description: true },
  });

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-astro-navy">Pilih Penampilan Favoritmu</h1>
              <p className="text-sm text-muted">
                {ballot.qr.label ?? ballot.qr.tableName ?? "Halo, penonton"} · pilih satu penampilan
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Babak: {votingSession.stage}</Badge>
              <Badge tone={votingSession.isOpen ? "success" : "danger"}>
                {votingSession.isOpen ? "Voting dibuka" : "Voting ditutup"}
              </Badge>
            </div>
          </div>
          {!votingSession.isOpen && (
            <Alert tone="info">
              Sesi voting belum dibuka atau sudah ditutup. Tombol vote aktif otomatis saat MC membuka sesi.
            </Alert>
          )}
          {teams.length === 0 ? (
            <Alert tone="info">Belum ada penampilan yang terdaftar di babak ini.</Alert>
          ) : (
            <VoteBoard teams={teams} isOpen={votingSession.isOpen} />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
