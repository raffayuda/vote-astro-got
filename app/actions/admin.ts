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

const quota = z.coerce
  .number()
  .int("Kuota harus bilangan bulat.")
  .min(1, "Kuota minimal 1 suara.")
  .max(1000, "Kuota maksimal 1000 suara.");

const generateSchema = z.object({
  tableName: z.string().trim().min(1, "Nama meja wajib diisi.").max(40, "Nama meja maksimal 40 karakter."),
  quota,
});

function selectedIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("ids")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ];
}

/** Buat QR meja, atau perbarui kuota QR utama meja yang sudah ada. QR yang sudah dicetak tetap berlaku. */
export async function generateTableQr(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { tableName, quota: maxUses } = parsed.data;
  const existing = await prisma.qrCode.findFirst({
    where: { tableName },
    orderBy: { id: "asc" },
    select: { id: true, usedCount: true },
  });

  if (existing) {
    await prisma.qrCode.update({ where: { id: existing.id }, data: { label: tableName, maxUses } });
    revalidatePath("/admin", "layout");
    const warning =
      existing.usedCount > maxUses
        ? ` Saat ini sudah ${existing.usedCount} suara, jadi vote baru tertahan sampai kuota dinaikkan.`
        : "";
    return {
      ok: true,
      message: `Kuota ${tableName} disetel ke ${maxUses}. QR yang sudah dicetak tetap berlaku.${warning}`,
    };
  }

  await prisma.qrCode.create({ data: { tableName, label: tableName, maxUses } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `QR ${tableName} dibuat dengan kuota ${maxUses} suara.` };
}

/** Ubah kuota satu QR. Bisa dilakukan kapan saja, termasuk setelah QR dicetak. */
export async function updateQrQuota(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({ id: z.coerce.number().int().positive(), maxUses: quota })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const qr = await prisma.qrCode.findUnique({
    where: { id: parsed.data.id },
    select: { tableName: true, label: true, usedCount: true },
  });
  if (!qr) return { error: "QR tidak ditemukan." };
  await prisma.qrCode.update({ where: { id: parsed.data.id }, data: { maxUses: parsed.data.maxUses } });
  revalidatePath("/admin", "layout");
  const name = qr.label ?? qr.tableName ?? "QR";
  return { ok: true, message: `Kuota ${name} disetel ke ${parsed.data.maxUses} suara.` };
}

/** Buka satu slot tambahan untuk satu QR. */
export async function reopenQr(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  const qr = await prisma.qrCode.findUnique({
    where: { id: id.data },
    select: { usedCount: true, label: true, tableName: true },
  });
  if (!qr) return { error: "QR tidak ditemukan." };
  await prisma.qrCode.update({ where: { id: id.data }, data: { maxUses: qr.usedCount + 1 } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${qr.label ?? qr.tableName ?? "QR"} dibuka. Kuota sekarang ${qr.usedCount + 1}.` };
}

/** Buka slot untuk QR yang dicentang, atau set kuota yang sama untuk semuanya. */
export async function bulkUpdateQrCodes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const ids = selectedIds(formData);
  if (ids.length === 0) return { error: "Centang minimal satu QR." };
  const mode = formData.get("mode");

  if (mode === "reopen") {
    const rows = await prisma.qrCode.findMany({
      where: { id: { in: ids } },
      select: { id: true, usedCount: true },
    });
    if (rows.length === 0) return { error: "QR tidak ditemukan." };
    await prisma.$transaction(
      rows.map((row) => prisma.qrCode.update({ where: { id: row.id }, data: { maxUses: row.usedCount + 1 } })),
    );
    revalidatePath("/admin", "layout");
    return { ok: true, message: `${rows.length} QR dibuka (masing-masing +1 slot).` };
  }

  if (mode === "set") {
    const parsed = quota.safeParse(formData.get("quota"));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    await prisma.qrCode.updateMany({ where: { id: { in: ids } }, data: { maxUses: parsed.data } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Kuota ${ids.length} QR disetel ke ${parsed.data} suara.` };
  }

  return { error: "Aksi tidak dikenali." };
}

/** Buka satu slot tambahan untuk SEMUA QR. */
export async function reopenAllQrCodes(): Promise<FormState> {
  await requireRole("admin");
  const { count } = await prisma.qrCode.updateMany({ data: { maxUses: { increment: 1 } } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${count} QR dibuka (masing-masing +1 slot).` };
}

/** Hapus QR yang belum pernah menerima suara. Suara lama tidak boleh hilang. */
export async function deleteCode(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  const qr = await prisma.qrCode.findUnique({ where: { id: id.data }, select: { usedCount: true } });
  if (!qr) return { error: "QR tidak ditemukan." };
  if (qr.usedCount > 0) return { error: "QR ini sudah menerima suara, tidak bisa dihapus." };
  const ballots = await prisma.ballot.findMany({ where: { qrId: id.data }, select: { userId: true } });
  const userIds = ballots.map((b) => b.userId).filter((id): id is string => Boolean(id));
  await prisma.qrCode.delete({ where: { id: id.data } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
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
