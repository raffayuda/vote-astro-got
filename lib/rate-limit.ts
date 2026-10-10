import { headers } from "next/headers";

// Pembatas sederhana in-memory: hitung percobaan GAGAL per IP.
// Batas dibuat longgar karena banyak penonton bisa berbagi satu IP WiFi venue.
const failures = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 40;
const WINDOW_MS = 5 * 60 * 1000;

async function keyFor(scope: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${scope}:${ip}`;
}

export async function isBlocked(scope: string) {
  const entry = failures.get(await keyFor(scope));
  return !!entry && entry.resetAt > Date.now() && entry.count >= MAX_FAILURES;
}

export async function registerFailure(scope: string) {
  const key = await keyFor(scope);
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}
