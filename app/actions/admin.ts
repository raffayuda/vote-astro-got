"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { normalizeIdentity, parseVoterFile } from "@/lib/import-voters";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { createCredentialUser } from "@/lib/users";

const optionalText = z.string().trim().optional().transform((v) => v || null);

const teamSchema = z.object({
  name: z.string().trim().min(1, "Nama tim wajib diisi."),
  photoUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Foto harus berupa URL http(s) atau path seperti /tim/a.jpg."),
  description: optionalText,
  order: z.coerce.number().int().default(0),
});

export async function createTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.team.create({ data: parsed.data });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Tim ditambahkan." };
}

export async function updateTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return { error: parsed.success ? "ID tidak valid." : parsed.error.issues[0].message };
  await prisma.team.update({ where: { id: id.data }, data: parsed.data });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Tim diperbarui." };
}

export async function deleteTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };
  await prisma.team.delete({ where: { id: id.data } });
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

export async function importVoters(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file Excel (.xlsx) atau CSV." };

  let rows;
  try {
    rows = parseVoterFile(await file.arrayBuffer());
  } catch {
    return { error: "File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv." };
  }
  if (rows.length === 0) return { error: "Tidak ada data. Pastikan baris pertama berisi header: NIM, Email, Nama." };

  const { count } = await prisma.voter.createMany({ data: rows, skipDuplicates: true });
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: `${count} penonton ditambahkan, ${rows.length - count} dilewati (sudah terdaftar).`,
  };
}

export async function addVoter(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const nim = normalizeIdentity(String(formData.get("nim") ?? ""));
  const email = normalizeIdentity(String(formData.get("email") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  if (!nim && !email) return { error: "Isi NIM atau Email." };
  if (email && !z.email().safeParse(email).success) return { error: "Email tidak valid." };

  try {
    await prisma.voter.create({ data: { nim: nim || null, email: email || null, name: name || null } });
  } catch {
    return { error: "NIM atau Email sudah terdaftar." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Penonton ditambahkan." };
}
