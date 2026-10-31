import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import type { Ballot } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCredentialUser } from "@/lib/users";

/** Cookie penanda perangkat. Tetap ada walau penonton menekan "Keluar". */
export const BALLOT_COOKIE = "astro_ballot";

/** Password akun ballot diturunkan dari secret server; penonton tidak pernah mengetik password. */
function ballotPassword(ballotId: number) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET belum diisi di .env");
  return createHmac("sha256", secret).update(`ballot:${ballotId}`).digest("base64url");
}

function ballotEmail(ballotId: number) {
  return `ballot-${ballotId}@voter.astro.local`;
}

async function signIn(email: string, password: string) {
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
    return true;
  } catch {
    return false;
  }
}

/** Pastikan ballot punya akun voter. Akun dibuat sekali saat QR pertama kali dipakai. */
export async function ensureBallotUser(ballot: Ballot): Promise<Ballot | null> {
  if (ballot.userId) return ballot;

  const email = ballotEmail(ballot.id);
  let userId = (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id;

  if (!userId) {
    const qr = await prisma.qrCode.findUnique({
      where: { id: ballot.qrId },
      select: { label: true, tableName: true },
    });
    try {
      const user = await createCredentialUser({
        name: qr?.label ?? qr?.tableName ?? `Penonton ${ballot.id}`,
        email,
        password: ballotPassword(ballot.id),
        role: "voter",
      });
      userId = user.id;
    } catch {
      userId = (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id;
    }
  }

  if (!userId) return null;
  try {
    return await prisma.ballot.update({ where: { id: ballot.id }, data: { userId } });
  } catch {
    return await prisma.ballot.findUnique({ where: { id: ballot.id } });
  }
}

/**
 * Buka sesi Better Auth untuk ballot ini.
 * Ballot lama (hasil migrasi) memakai password dari skema QR lama; kalau login gagal,
 * password direset sekali ke skema ballot baru lalu dicoba lagi.
 */
export async function startVoterSession(ballot: Ballot): Promise<boolean> {
  const withUser = await ensureBallotUser(ballot);
  if (!withUser?.userId) return false;

  const user = await prisma.user.findUnique({ where: { id: withUser.userId } });
  if (!user || user.role !== "voter") return false;

  const password = ballotPassword(withUser.id);
  if (await signIn(user.email, password)) return true;

  await prisma.account.updateMany({
    where: { userId: user.id, providerId: "credential" },
    data: { password: await hashPassword(password) },
  });
  return signIn(user.email, password);
}
