"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { appPath } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getSessionFor, requireRole } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

class QuotaFullError extends Error {}
class AlreadyVotedError extends Error {}

export async function castVote(teamId: number): Promise<{ error: string } | undefined> {
  const session = await getSessionFor("voter");
  if (!session) redirect(appPath("/"));

  const ballot = await prisma.ballot.findUnique({ where: { userId: session.user.id } });
  if (!ballot) return { error: "Data penonton tidak ditemukan. Scan ulang QR di mejamu." };

  let outcome: "ok" | "closed" | "no-team";
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const votingSession = await tx.votingSession.findUnique({ where: { id: 1 } });
      if (!votingSession?.isOpen) return "closed" as const;

      const team = await tx.team.findUnique({ where: { id: teamId }, select: { id: true } });
      if (!team) return "no-team" as const;

      // Satu ballot hanya boleh vote sekali.
      const { count } = await tx.ballot.updateMany({
        where: { id: ballot.id, votedAt: null },
        data: { votedAt: new Date(), teamId },
      });
      if (count === 0) throw new AlreadyVotedError();

      // Naikkan pemakaian kuota secara atomik; gagal jika kuota sudah habis.
      const updated = await tx.$executeRaw`
        UPDATE "Voter"
        SET "usedCount" = "usedCount" + 1
        WHERE "id" = ${ballot.qrId} AND "usedCount" < "maxUses"
      `;
      if (updated === 0) throw new QuotaFullError();

      return "ok" as const;
    });
  } catch (e) {
    if (e instanceof QuotaFullError) {
      return { error: "Kuota suara QR ini sudah habis. Minta panitia menambah kuota." };
    }
    if (e instanceof AlreadyVotedError) {
      return { error: "Suara kamu sudah pernah dipakai." };
    }
    throw e;
  }

  if (outcome === "closed") return { error: "Sesi voting sedang ditutup. Tunggu pengumuman dari MC." };
  if (outcome === "no-team") return { error: "Tim tidak ditemukan." };

  redirect(appPath("/vote/selesai"));
}

export async function toggleVoting() {
  await requireRole("admin");
  const current = await getVotingSession();
  const now = new Date();
  await prisma.votingSession.update({
    where: { id: 1 },
    data: current.isOpen ? { isOpen: false, closedAt: now } : { isOpen: true, openedAt: now },
  });
  revalidatePath("/admin");
  revalidatePath("/vote");
}
