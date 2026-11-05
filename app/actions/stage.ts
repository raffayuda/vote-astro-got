"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function createStage(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const name = z
    .string()
    .trim()
    .min(1, "Nama sesi wajib diisi.")
    .max(40, "Nama sesi maksimal 40 karakter.")
    .safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const existing = await prisma.stage.findUnique({ where: { name: name.data } });
  if (existing) return { error: `Sesi "${name.data}" sudah ada.` };

  const teamIds = [
    ...new Set(
      formData
        .getAll("teamIds")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ];

  const makeActive = formData.get("makeActive") === "1";

  if (makeActive) {
    await prisma.stage.updateMany({ data: { isActive: false } });
  }

  const stage = await prisma.stage.create({
    data: {
      name: name.data,
      isActive: makeActive,
      teams: {
        create: teamIds.map((teamId) => ({ teamId })),
      },
    },
  });

  if (makeActive) {
    await prisma.votingSession.update({
      where: { id: 1 },
      data: { stage: name.data },
    });
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/vote");
  revalidatePath("/juri");
  return { ok: true, message: `Sesi "${stage.name}" berhasil dibuat dengan ${teamIds.length} penampilan peserta.` };
}

export async function activateStage(stageId: number): Promise<FormState> {
  await requireRole("admin");
  const stage = await prisma.stage.findUnique({ where: { id: stageId }, include: { teams: true } });
  if (!stage) return { error: "Sesi tidak ditemukan." };

  await prisma.stage.updateMany({ data: { isActive: false } });
  await prisma.stage.update({ where: { id: stageId }, data: { isActive: true } });

  await prisma.votingSession.update({
    where: { id: 1 },
    data: { stage: stage.name },
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/vote");
  revalidatePath("/juri");
  return { ok: true, message: `Sesi "${stage.name}" sekarang AKTIF (${stage.teams.length} penampilan peserta).` };
}

export async function activateStageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const stageId = z.coerce.number().int().positive().safeParse(formData.get("stageId"));
  if (!stageId.success) return { error: "ID Sesi tidak valid." };
  return activateStage(stageId.data);
}

export async function updateStageTeams(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const stageId = z.coerce.number().int().positive().safeParse(formData.get("stageId"));
  if (!stageId.success) return { error: "ID Sesi tidak valid." };

  const stage = await prisma.stage.findUnique({ where: { id: stageId.data } });
  if (!stage) return { error: "Sesi tidak ditemukan." };

  const teamIds = [
    ...new Set(
      formData
        .getAll("teamIds")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ];

  await prisma.stageTeam.deleteMany({ where: { stageId: stageId.data } });
  if (teamIds.length > 0) {
    await prisma.stageTeam.createMany({
      data: teamIds.map((teamId) => ({ stageId: stageId.data, teamId })),
    });
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/vote");
  revalidatePath("/juri");
  return { ok: true, message: `Daftar penampilan untuk sesi "${stage.name}" diperbarui (${teamIds.length} penampilan terpilih).` };
}

export async function deleteStage(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const stageId = z.coerce.number().int().positive().safeParse(formData.get("stageId"));
  if (!stageId.success) return { error: "ID Sesi tidak valid." };

  const stage = await prisma.stage.findUnique({ where: { id: stageId.data } });
  if (!stage) return { error: "Sesi tidak ditemukan." };

  const totalStages = await prisma.stage.count();
  if (totalStages <= 1) return { error: "Harus ada minimal satu sesi." };

  if (stage.isActive) {
    const other = await prisma.stage.findFirst({ where: { id: { not: stageId.data } } });
    if (other) {
      await prisma.stage.update({ where: { id: other.id }, data: { isActive: true } });
      await prisma.votingSession.update({ where: { id: 1 }, data: { stage: other.name } });
    }
  }

  await prisma.stage.delete({ where: { id: stageId.data } });

  revalidatePath("/admin", "layout");
  revalidatePath("/vote");
  revalidatePath("/juri");
  return { ok: true, message: `Sesi "${stage.name}" dihapus.` };
}
