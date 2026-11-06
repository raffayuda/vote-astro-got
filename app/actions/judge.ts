"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

const score = z.coerce.number().int("Nilai harus bilangan bulat.").min(0, "Nilai minimal 0.").max(100, "Nilai maksimal 100.");

const scoreSchema = z.object({
  teamId: z.coerce.number().int(),
  kreativitas: score,
  teknis: score,
  panggung: score,
  kostum: score,
});

export async function saveScore(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("judge");
  const parsed = scoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { teamId, ...scores } = parsed.data;
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) return { error: "Penampilan tidak ditemukan." };

  const votingSession = await getVotingSession();
  const stage = votingSession.stage ?? "Penyisihan";

  await prisma.judgeScore.upsert({
    where: { judgeId_teamId_stage: { judgeId: session.user.id, teamId, stage } },
    update: scores,
    create: { judgeId: session.user.id, teamId, stage, ...scores },
  });
  revalidatePath("/juri");
  revalidatePath("/admin");
  return { ok: true, message: `Nilai untuk babak ${stage} tersimpan.` };
}

export async function updateJudgePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("judge");
  const parsed = z
    .object({
      currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
      newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
      confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "Konfirmasi password baru tidak cocok." };
  }

  // Verifikasi password lama
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
  });

  if (account?.password) {
    const valid = await verifyPassword({ password: parsed.data.currentPassword, hash: account.password });
    if (!valid) return { error: "Password saat ini salah." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const { count } = await prisma.account.updateMany({
    where: { userId: session.user.id, providerId: "credential" },
    data: { password: passwordHash },
  });

  if (count === 0) {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        accountId: session.user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }

  revalidatePath("/juri");
  return { ok: true, message: "Password berhasil diperbarui." };
}
