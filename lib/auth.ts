import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getAppOrigin } from "@/lib/app-url";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth-cookie";
import { BASE_PATH } from "@/lib/asset";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // BETTER_AUTH_SECRET dibaca otomatis dari environment. Origin dari
  // BETTER_AUTH_URL, endpoint di bawah basePath app (/vote/api/auth).
  baseURL: getAppOrigin(),
  basePath: `${BASE_PATH}/api/auth`,
  // Akses langsung ke deployment Vercel tetap bisa login selain lewat proxy.
  trustedOrigins: [
    "https://astro.nurulfikri.ac.id",
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  },
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
