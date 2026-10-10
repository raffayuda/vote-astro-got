import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "./prisma";

export type AppRole = "admin" | "judge" | "voter";

/**
 * Buat user Better Auth (email + password) langsung lewat database.
 * Pendaftaran publik dimatikan di lib/auth.ts, jadi semua akun dibuat lewat fungsi ini.
 */
export async function createCredentialUser(input: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
}) {
  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      id,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      emailVerified: true,
      role: input.role,
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: passwordHash },
      },
    },
  });
}
