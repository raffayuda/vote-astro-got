"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionFor, requireRole } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

export async function castVote(teamId: number): Promise<{ error: string } | undefined> {
  const session = await getSessionFor("voter");
  if (!session) redirect("/");

  const voter = await prisma.voter.findUnique({ where: { userId: session.user.id } });
  if (!voter) return { error: "Data penonton tidak ditemukan. Silakan verifikasi ulang." };

  const outcome = await prisma.$transaction(async (tx) => {
    const votingSession = await tx.votingSession.findUnique({ where: { id: 1 } });
    if (!votingSession?.isOpen) return "closed" as const;

    const team = await tx.team.findUnique({ where: { id: teamId }, select: { id: true } });
    if (!team) return "no-team" as const;

    // Update atomik: hanya berhasil jika voter ini belum pernah vote (mencegah double vote).
    const { count } = await tx.voter.updateMany({
      where: { id: voter.id, votedAt: null },
      data: { votedAt: new Date(), teamId },
    });
    return count === 1 ? ("ok" as const) : ("already" as const);
  });

  if (outcome === "closed") return { error: "Sesi voting sedang ditutup. Tunggu pengumuman dari MC." };
  if (outcome === "no-team") return { error: "Tim tidak ditemukan." };
  if (outcome === "already") return { error: "Suara kamu sudah pernah dipakai." };

  redirect("/vote/selesai");
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
