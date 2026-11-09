"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionFor, requireRole } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

class QuotaFullError extends Error {}
class AlreadyVotedError extends Error {}

export async function castVote(teamId: number): Promise<{ error: string } | undefined> {
  const session = await getSessionFor("voter");
  if (!session) redirect("/");

  const votingSession = await getVotingSession();
  if (!votingSession.isOpen) return { error: "Sesi voting sedang ditutup. Tunggu pengumuman dari MC." };

  const currentStage = votingSession.stage ?? "Penyisihan";
  if (currentStage.toLowerCase() === "showcase") {
    return { error: "Babak Showcase murni dinilai oleh Dewan Juri (bobot 30%). Voting penonton akan dibuka pada Babak Final." };
  }

  let outcome: "ok" | "closed" | "no-team";
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const vs = await tx.votingSession.findUnique({ where: { id: 1 } });
      if (!vs?.isOpen) return "closed" as const;

      const team = await tx.team.findUnique({ where: { id: teamId }, select: { id: true } });
      if (!team) return "no-team" as const;

      const ballot = await tx.ballot.findFirst({
        where: { userId: session.user.id, stage: currentStage },
      });
      if (!ballot) throw new Error("Data penonton tidak ditemukan. Scan ulang QR di barismu.");
      if (ballot.votedAt) throw new AlreadyVotedError();

      // Periksa kuota QR untuk babak aktif ini
      const qr = await tx.qrCode.findUnique({ where: { id: ballot.qrId }, select: { maxUses: true } });
      const usedInStage = await tx.ballot.count({
        where: { qrId: ballot.qrId, stage: currentStage, votedAt: { not: null } },
      });
      if (qr && usedInStage >= qr.maxUses) throw new QuotaFullError();

      // Satu ballot hanya boleh vote sekali per babak.
      const { count } = await tx.ballot.updateMany({
        where: { id: ballot.id, votedAt: null },
        data: { votedAt: new Date(), teamId },
      });
      if (count === 0) throw new AlreadyVotedError();

      // Update usedCount pada QrCode
      await tx.qrCode.update({
        where: { id: ballot.qrId },
        data: { usedCount: { increment: 1 } },
      });

      return "ok" as const;
    });
  } catch (e) {
    if (e instanceof QuotaFullError) {
      return { error: `Kuota suara QR ini sudah habis untuk babak ${currentStage}. Minta panitia menambah kuota.` };
    }
    if (e instanceof AlreadyVotedError) {
      return { error: `Suara kamu untuk babak ${currentStage} sudah pernah dipakai.` };
    }
    if (e instanceof Error) return { error: e.message };
    throw e;
  }

  if (outcome === "closed") return { error: "Sesi voting sedang ditutup. Tunggu pengumuman dari MC." };
  if (outcome === "no-team") return { error: "Penampilan tidak ditemukan." };

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
  revalidatePath("/admin", "layout");
  revalidatePath("/vote");
  revalidatePath("/juri");
}

export async function setVotingStage(stage: string) {
  await requireRole("admin");
  const cleanStage = stage.trim();
  if (!cleanStage) return { error: "Nama babak/sesi wajib diisi." };

  await prisma.stage.updateMany({ data: { isActive: false } });
  const existing = await prisma.stage.findUnique({ where: { name: cleanStage } });
  if (existing) {
    await prisma.stage.update({ where: { id: existing.id }, data: { isActive: true } });
  } else {
    await prisma.stage.create({ data: { name: cleanStage, isActive: true } });
  }

  await prisma.votingSession.update({
    where: { id: 1 },
    data: { stage: cleanStage },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/vote");
  revalidatePath("/juri");
  return { ok: true, message: `Babak aktif diubah ke "${cleanStage}".` };
}
