import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import type { Voter } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCredentialUser } from "@/lib/users";

/** Password akun penonton diturunkan dari secret server; penonton tidak pernah mengetik password. */
function voterPassword(voterId: number) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET belum diisi di .env");
  return createHmac("sha256", secret).update(`voter:${voterId}`).digest("base64url");
}

/**
 * Buka sesi Better Auth untuk penonton pemilik QR ini.
 * Akun dibuat otomatis saat QR pertama kali dibuka. Mengembalikan false jika gagal.
 */
export async function startVoterSession(voter: Voter): Promise<boolean> {
  let userId = voter.userId;

  if (!userId) {
    try {
      const user = await createCredentialUser({
        name: voter.label ?? voter.code,
        email: `${voter.code}@voter.astro.local`,
        password: voterPassword(voter.id),
        role: "voter",
      });
      await prisma.voter.update({ where: { id: voter.id }, data: { userId: user.id } });
      userId = user.id;
    } catch {
      // Kemungkinan QR yang sama dibuka bersamaan dan akunnya sudah dibuat; ambil ulang.
      userId = (await prisma.voter.findUnique({ where: { id: voter.id } }))?.userId ?? null;
    }
  }
  if (!userId) return false;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "voter") return false;

  try {
    await auth.api.signInEmail({
      body: { email: user.email, password: voterPassword(voter.id) },
      headers: await headers(),
    });
    return true;
  } catch {
    return false;
  }
}
