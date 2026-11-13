/**
 * Prefix cookie sesi Better Auth. Situs ASTRO di domain yang sama juga memakai
 * Better Auth dengan prefix default "better-auth", jadi app ini memakai prefix
 * sendiri supaya sesi kedua app tidak saling menimpa. Dipisah dari lib/auth.ts
 * agar proxy.ts tidak ikut membundel Prisma.
 */
export const AUTH_COOKIE_PREFIX = "agt-vote";
