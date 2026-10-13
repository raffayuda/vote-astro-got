"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { deleteTeamPhoto, saveTeamPhoto } from "@/lib/team-photo";
import { createCredentialUser } from "@/lib/users";

const optionalText = z.string().trim().optional().transform((v) => v || null);
const membersText = z
  .string()
  .trim()
  .max(2000, "Daftar anggota maksimal 2000 karakter.")
  .optional()
  .transform((v) => v || "");

const teamSchema = z.object({
  name: z.string().trim().min(1, "Nama tim wajib diisi."),
  members: membersText,
  description: optionalText,
  order: z.coerce.number().int().default(0),
});

function photoError(e: unknown): FormState {
  return { error: e instanceof Error ? e.message : "Gagal menyimpan foto." };
}

export async function createTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let photoUrl = "";
  try {
    photoUrl = (await saveTeamPhoto(formData.get("photo"))) ?? "";
  } catch (e) {
    return photoError(e);
  }
  await prisma.team.create({ data: { ...parsed.data, photoUrl } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Tim ditambahkan." };
}

export async function updateTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return { error: parsed.success ? "ID tidak valid." : parsed.error.issues[0].message };

  const existing = await prisma.team.findUnique({ where: { id: id.data }, select: { photoUrl: true } });
  if (!existing) return { error: "Tim tidak ditemukan." };

  let photoUrl = existing.photoUrl;
  try {
    const uploaded = await saveTeamPhoto(formData.get("photo"));
    if (uploaded) {
      photoUrl = uploaded;
      await deleteTeamPhoto(existing.photoUrl);
    } else if (formData.get("removePhoto") === "1" && photoUrl) {
      photoUrl = "";
      await deleteTeamPhoto(existing.photoUrl);
    }
  } catch (e) {
    return photoError(e);
  }

  await prisma.team.update({ where: { id: id.data }, data: { ...parsed.data, photoUrl } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Tim diperbarui." };
}

export async function deleteTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  const existing = await prisma.team.findUnique({ where: { id: id.data }, select: { photoUrl: true } });
  await prisma.team.delete({ where: { id: id.data } });
  await deleteTeamPhoto(existing?.photoUrl);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Tim dihapus." };
}

export async function createJudge(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Nama juri wajib diisi."),
      email: z.email("Email tidak valid."),
      password: z.string().min(8, "Password minimal 8 karakter."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await createCredentialUser({ ...parsed.data, role: "judge" });
  } catch {
    return { error: "Email sudah dipakai akun lain." };
  }
  revalidatePath("/admin/juri");
  return { ok: true, message: "Juri ditambahkan." };
}

export async function deleteJudge(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  await prisma.user.deleteMany({ where: { id: id.data, role: "judge" } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Juri dihapus." };
}

const generateSchema = z.object({
  tableName: z.string().trim().min(1, "Nama meja wajib diisi.").max(40, "Nama meja maksimal 40 karakter."),
  seats: z.coerce.number().int("Jumlah kursi harus bilangan bulat.").min(1, "Minimal 1 kursi.").max(100, "Maksimal 100 kursi sekali generate."),
});

/** Buat QR baru untuk satu meja. Generate ulang untuk meja yang sama melanjutkan nomor kursi. */
export async function generateCodes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { tableName, seats } = parsed.data;
  const { _max } = await prisma.voter.aggregate({ where: { tableName }, _max: { seat: true } });
  const start = (_max.seat ?? 0) + 1;

  await prisma.voter.createMany({
    data: Array.from({ length: seats }, (_, i) => ({
      tableName,
      seat: start + i,
      label: `${tableName} - Kursi ${start + i}`,
    })),
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${seats} QR dibuat untuk ${tableName} (kursi ${start}–${start + seats - 1}).` };
}

/** Hapus QR yang belum dipakai vote. QR yang sudah dipakai dipertahankan agar hitungan suara tidak berubah. */
export async function deleteCode(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  const { count } = await prisma.voter.deleteMany({ where: { id: id.data, votedAt: null } });
  if (count === 0) return { error: "QR ini sudah dipakai vote, tidak bisa dihapus." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "QR dihapus." };
}

/** Admin mengganti nama & email-nya sendiri. */
export async function updateAdminAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("admin");
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Nama wajib diisi."),
      email: z.email("Email tidak valid."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.trim().toLowerCase();
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken && taken.id !== session.user.id) return { error: "Email sudah dipakai akun lain." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name.trim(), email, emailVerified: true },
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Akun diperbarui." };
}

/** Admin mengganti password-nya sendiri. Semua sesi lain ikut dicabut sehingga perlu login ulang. */
export async function updateAdminPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("admin");
  const parsed = z
    .object({
      newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
      confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "Konfirmasi password tidak sama." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const { count } = await prisma.account.updateMany({
    where: { userId: session.user.id, providerId: "credential" },
    data: { password: passwordHash },
  });
  if (count === 0) return { error: "Akun kredensial tidak ditemukan." };

  // Cabut semua sesi agar perangkat lain yang masih login ikut keluar.
  await prisma.session.deleteMany({ where: { userId: session.user.id } });
  return { ok: true, message: "Password diganti. Silakan login ulang." };
}
