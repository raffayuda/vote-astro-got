"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/ui/action-form";
import { auth } from "@/lib/auth";
import { normalizeIdentity } from "@/lib/import-voters";
import { prisma } from "@/lib/prisma";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { signOutCurrent } from "@/lib/session";
import { createCredentialUser, type AppRole } from "@/lib/users";

const TOO_MANY = "Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.";

/** Password akun penonton diturunkan dari secret server; penonton tidak pernah mengetik password. */
function voterPassword(voterId: number) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET belum diisi di .env");
  return createHmac("sha256", secret).update(`voter:${voterId}`).digest("base64url");
}

export async function verifyVoter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().min(3, "Masukkan NIM atau Email kamu.").safeParse(formData.get("identity"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await isBlocked("voter")) return { error: TOO_MANY };

  const identity = normalizeIdentity(parsed.data);
  let voter = await prisma.voter.findFirst({
    where: { OR: [{ nim: identity }, { email: identity }] },
  });

  if (!voter) {
    await registerFailure("voter");
    return { error: "Data kamu tidak ditemukan. Pastikan NIM/Email sama dengan yang didaftarkan di formulir kehadiran." };
  }
  if (voter.votedAt) {
    return { error: "Suara kamu sudah pernah dipakai. Satu identitas hanya bisa memilih satu kali." };
  }

  // Buat akun Better Auth untuk penonton saat pertama kali verifikasi.
  if (!voter.userId) {
    try {
      const user = await createCredentialUser({
        name: voter.name ?? identity,
        email: voter.email ?? `${voter.nim}@voter.astro.local`,
        password: voterPassword(voter.id),
        role: "voter",
      });
      await prisma.voter.update({ where: { id: voter.id }, data: { userId: user.id } });
      voter = { ...voter, userId: user.id };
    } catch {
      // Kemungkinan request bersamaan sudah membuat akunnya; ambil ulang.
      voter = await prisma.voter.findUnique({ where: { id: voter.id } });
      if (!voter?.userId) return { error: "Gagal memverifikasi akun. Coba lagi." };
    }
  }

  const user = await prisma.user.findUnique({ where: { id: voter.userId! } });
  if (!user || user.role !== "voter") return { error: "Akun tidak valid untuk voting." };

  try {
    await auth.api.signInEmail({
      body: { email: user.email, password: voterPassword(voter.id) },
      headers: await headers(),
    });
  } catch {
    return { error: "Gagal masuk. Coba lagi." };
  }
  redirect("/vote");
}

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
