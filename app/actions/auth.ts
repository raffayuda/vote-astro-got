"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { signOutCurrent } from "@/lib/session";
import type { AppRole } from "@/lib/users";

const TOO_MANY = "Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.";

async function staffLogin(role: Exclude<AppRole, "voter">, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.email("Email tidak valid."), password: z.string().min(1, "Password wajib diisi.") })
    .safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase(), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await isBlocked(role)) return { error: TOO_MANY };

  const { email, password } = parsed.data;
  // Cek role dulu agar akun penonton tidak bisa membuka sesi lewat halaman staf.
  const account = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  let ok = account?.role === role;
  if (ok) {
    try {
      await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    await registerFailure(role);
    return { error: "Email atau password salah." };
  }
  redirect(role === "admin" ? "/admin" : "/juri");
}

export async function adminLogin(_prev: FormState, formData: FormData) {
  return staffLogin("admin", formData);
}

export async function judgeLogin(_prev: FormState, formData: FormData) {
  return staffLogin("judge", formData);
}

export async function logoutVoter() {
  await signOutCurrent();
  redirect("/");
}

export async function logoutAdmin() {
  await signOutCurrent();
  redirect("/admin/login");
}

export async function logoutJudge() {
  await signOutCurrent();
  redirect("/juri/login");
}
