"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

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
  if (!team) return { error: "Tim tidak ditemukan." };

  await prisma.judgeScore.upsert({
    where: { judgeId_teamId: { judgeId: session.user.id, teamId } },
    update: scores,
    create: { judgeId: session.user.id, teamId, ...scores },
  });
  revalidatePath("/juri");
  revalidatePath("/admin");
  return { ok: true, message: "Nilai tersimpan." };
}
