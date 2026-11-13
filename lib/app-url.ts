import { BASE_PATH } from "@/lib/asset";

/**
 * Origin publik aplikasi (tanpa path, tanpa slash di akhir), mis.
 * https://astro.nurulfikri.ac.id. Dibaca dari BETTER_AUTH_URL; kalau env masih
 * menulis "/vote" di belakangnya, bagian itu dibuang karena basePath sudah
 * ditambahkan sendiri.
 */
export function getAppOrigin() {
  const raw = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return raw.endsWith(BASE_PATH) ? raw.slice(0, -BASE_PATH.length) : raw;
}

/**
 * URL publik aplikasi termasuk basePath, mis. https://astro.nurulfikri.ac.id/vote.
 * Dipakai untuk isi QR, jadi harus domain yang bisa dibuka HP penonton.
 */
export function getAppUrl() {
  return `${getAppOrigin()}${BASE_PATH}`;
}

/** URL yang disimpan di QR: {APP_URL}/{code}. */
export function voterUrl(code: string) {
  return `${getAppUrl()}/${code}`;
}

/**
 * Path internal aplikasi untuk redirect(). Next menambahkan basePath sendiri
 * pada redirect(), <Link>, dan router, jadi path ditulis tanpa "/vote".
 */
export function appPath(path: string) {
  return path;
}
