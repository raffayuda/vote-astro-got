import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // BETTER_AUTH_SECRET dan BETTER_AUTH_URL dibaca otomatis dari environment.
  emailAndPassword: {
    enabled: true,
    // Akun hanya dibuat oleh seed / admin / verifikasi penonton, bukan pendaftaran publik.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "voter", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 12,
  },
  plugins: [nextCookies()], // harus plugin terakhir
});
