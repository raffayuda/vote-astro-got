"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  nim: z
    .string()
    .trim()
    .min(3, "NIM minimal 3 karakter.")
    .max(30, "NIM maksimal 30 karakter."),
});

export type RegistrationResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  name?: string;
  nim?: string;
};

/** Form submit registrasi penonton / peserta dari halaman publik /daftar */
export async function submitRegistration(
  _prev: RegistrationResult | null,
  formData: FormData,
): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    nim: formData.get("nim"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, nim } = parsed.data;

  try {
    await prisma.registration.create({
      data: {
        name,
        nim,
      },
    });

    revalidatePath("/admin/registrasi");

    return {
      ok: true,
      name,
      nim,
      message: "Pendaftaran Anda berhasil dicatat!",
    };
  } catch (err) {
    console.error("Error creating registration:", err);
    return {
      error: "Terjadi gangguan saat menyimpan data. Silakan coba beberapa saat lagi.",
    };
  }
}

/** Hapus 1 pendaftar dari panel admin */
export async function deleteRegistration(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { error: "ID tidak valid." };

  await prisma.registration.delete({
    where: { id: id.data },
  });

  revalidatePath("/admin/registrasi");
  return { ok: true, message: "Data pendaftar dihapus." };
}

/** Hapus seluruh data pendaftar dari panel admin */
export async function deleteAllRegistrations(): Promise<FormState> {
  await requireRole("admin");
  const { count } = await prisma.registration.deleteMany();
  revalidatePath("/admin/registrasi");
  return { ok: true, message: `Semua ${count} data pendaftar berhasil dihapus.` };
}

