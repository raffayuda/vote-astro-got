"use server";

import { randomUUID } from "node:crypto";
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
  name: z.string().trim().min(1, "Nama penampilan wajib diisi."),
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
  return { ok: true, message: "Penampilan ditambahkan." };
}

export async function updateTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return { error: parsed.success ? "ID tidak valid." : parsed.error.issues[0].message };

  const existing = await prisma.team.findUnique({ where: { id: id.data }, select: { photoUrl: true } });
  if (!existing) return { error: "Penampilan tidak ditemukan." };

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
  return { ok: true, message: "Penampilan diperbarui." };
}

export async function deleteTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  const existing = await prisma.team.findUnique({ where: { id: id.data }, select: { photoUrl: true } });
  await prisma.team.delete({ where: { id: id.data } });
  await deleteTeamPhoto(existing?.photoUrl);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Penampilan dihapus." };
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

export async function updateJudgePasswordByAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({
      judgeId: z.string().min(1, "ID Juri wajib ada."),
      password: z.string().min(8, "Password baru minimal 8 karakter."),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const judge = await prisma.user.findFirst({
    where: { id: parsed.data.judgeId, role: "judge" },
  });
  if (!judge) return { error: "Juri tidak ditemukan." };

  const passwordHash = await hashPassword(parsed.data.password);
  const { count } = await prisma.account.updateMany({
    where: { userId: judge.id, providerId: "credential" },
    data: { password: passwordHash },
  });

  if (count === 0) {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: judge.id,
        accountId: judge.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }

  // Cabut sesi aktif juri tersebut agar login ulang dengan password baru
  await prisma.session.deleteMany({ where: { userId: judge.id } });
  revalidatePath("/admin/juri");
  return { ok: true, message: `Password juri "${judge.name}" berhasil diubah menjadi: ${parsed.data.password}` };
}

const quota = z.coerce
  .number()
  .int("Kuota harus bilangan bulat.")
  .min(1, "Kuota minimal 1 suara.")
  .max(1000, "Kuota maksimal 1000 suara.");

const generateSchema = z.object({
  tableName: z.string().trim().min(1, "Nama baris wajib diisi.").max(40, "Nama baris maksimal 40 karakter."),
  count: z.coerce
    .number()
    .int("Jumlah QR harus bilangan bulat.")
    .min(1, "Minimal 1 QR.")
    .max(500, "Maksimal 500 QR sekali generate.")
    .default(1),
  quota: quota.default(1),
});

const simpleQrSchema = z.object({
  count: z.coerce
    .number()
    .int("Jumlah QR harus bilangan bulat.")
    .min(1, "Minimal 1 QR.")
    .max(500, "Maksimal 500 QR sekali generate.")
    .default(10),
  quota: quota.default(1),
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

/** Generate QR langsung tanpa meja / baris / kursi. Nomor otomatis melanjutkan nomor tertinggi (mis. QR #001). */
export async function generateSimpleQrCodes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = simpleQrSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { count, quota: maxUses } = parsed.data;

  // Cari nomor urut QR tertinggi yang sudah ada di database
  const allQrs = await prisma.qrCode.findMany({
    select: { id: true, label: true },
    orderBy: { id: "asc" },
  });

  let maxNum = 0;
  for (const q of allQrs) {
    if (q.label) {
      const match = q.label.match(/(\d+)\s*$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  }

  if (maxNum === 0 && allQrs.length > 0) {
    maxNum = allQrs.length;
  }

  const start = maxNum + 1;
  const padLength = Math.max(3, String(start + count).length);

  const data = Array.from({ length: count }, (_, i) => {
    const numStr = String(start + i).padStart(padLength, "0");
    return {
      code: randomUUID(),
      tableName: null,
      label: `QR #${numStr}`,
      maxUses,
      usedCount: 0,
    };
  });

  await prisma.qrCode.createMany({ data });
  revalidatePath("/admin", "layout");

  const startStr = `QR #${String(start).padStart(padLength, "0")}`;
  const endStr = `QR #${String(start + count - 1).padStart(padLength, "0")}`;
  const rangeStr = count === 1 ? startStr : `${startStr} – ${endStr}`;

  return {
    ok: true,
    message: `Berhasil membuat ${count} QR (${rangeStr}) dengan kuota ${maxUses} suara per QR.`,
  };
}

/** Generate beberapa QR sekaligus untuk satu baris. Nomor kursi otomatis melanjutkan yang sudah ada. */
export async function generateRowQrCodes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { tableName, count, quota: maxUses } = parsed.data;

  // Cari QR yang sudah ada di baris ini untuk mencari nomor kursi tertinggi
  const existing = await prisma.qrCode.findMany({
    where: { tableName },
    select: { id: true, label: true },
    orderBy: { id: "asc" },
  });

  let maxNumber = 0;
  for (const qr of existing) {
    if (qr.label) {
      const match = qr.label.match(/(\d+)\s*$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }

  if (maxNumber === 0 && existing.length > 0) {
    maxNumber = existing.length;
  }

  const start = maxNumber + 1;

  const data = Array.from({ length: count }, (_, i) => ({
    code: randomUUID(),
    tableName,
    label: `${tableName} - Kursi ${start + i}`,
    maxUses,
    usedCount: 0,
  }));

  await prisma.qrCode.createMany({ data });
  revalidatePath("/admin", "layout");

  const seatRange = count === 1 ? `Kursi ${start}` : `Kursi ${start}–${start + count - 1}`;
  return {
    ok: true,
    message: `${count} QR berhasil dibuat untuk ${tableName} (${seatRange}) dengan kuota ${maxUses} suara per QR.`,
  };
}

/** Alias untuk kompatibilitas */
export const generateTableQr = generateRowQrCodes;

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

  if (mode === "delete") {
    const rows = await prisma.qrCode.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (rows.length === 0) return { error: "QR tidak ditemukan." };
    const qrIds = rows.map((u) => u.id);
    const ballots = await prisma.ballot.findMany({ where: { qrId: { in: qrIds } }, select: { userId: true } });
    const userIds = ballots.map((b) => b.userId).filter((id): id is string => Boolean(id));
    await prisma.qrCode.deleteMany({ where: { id: { in: qrIds } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `${qrIds.length} QR berhasil dihapus.` };
  }

  return { error: "Aksi tidak dikenali." };
}

/** Hapus seluruh QR dalam satu baris sekaligus (termasuk yang sudah ada suara untuk dibersihkan). */
export async function deleteRowQrCodes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const tableName = z.string().trim().min(1).safeParse(formData.get("tableName"));
  if (!tableName.success) return { error: "Nama baris tidak valid." };

  const qrs = await prisma.qrCode.findMany({
    where: { tableName: tableName.data },
    select: { id: true },
  });
  if (qrs.length === 0) return { error: "Baris tidak ditemukan." };

  const ids = qrs.map((qr) => qr.id);
  const ballots = await prisma.ballot.findMany({ where: { qrId: { in: ids } }, select: { userId: true } });
  const userIds = ballots.map((b) => b.userId).filter((id): id is string => Boolean(id));
  await prisma.qrCode.deleteMany({ where: { id: { in: ids } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Baris ${tableName.data} (${qrs.length} QR) berhasil dihapus.` };
}

/** Buka satu slot tambahan untuk SEMUA QR. */
export async function reopenAllQrCodes(): Promise<FormState> {
  await requireRole("admin");
  const { count } = await prisma.qrCode.updateMany({ data: { maxUses: { increment: 1 } } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${count} QR dibuka (masing-masing +1 slot).` };
}

/** Hapus seluruh QR sekaligus (bersih total). */
export async function deleteAllQrCodes(): Promise<FormState> {
  await requireRole("admin");
  const ballots = await prisma.ballot.findMany({ select: { userId: true } });
  const userIds = ballots.map((b) => b.userId).filter((id): id is string => Boolean(id));
  const { count } = await prisma.qrCode.deleteMany();
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Semua ${count} QR berhasil dihapus.` };
}

/** Hapus satu QR (termasuk yang sudah ada suaranya jika ingin dibersihkan). */
export async function deleteCode(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  const qr = await prisma.qrCode.findUnique({ where: { id: id.data }, select: { label: true, tableName: true } });
  if (!qr) return { error: "QR tidak ditemukan." };
  const ballots = await prisma.ballot.findMany({ where: { qrId: id.data }, select: { userId: true } });
  const userIds = ballots.map((b) => b.userId).filter((id): id is string => Boolean(id));
  await prisma.qrCode.delete({ where: { id: id.data } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${qr.label ?? qr.tableName ?? "QR"} berhasil dihapus.` };
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
