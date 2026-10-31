import { BASE_PATH } from "@/lib/asset";

/**
 * URL publik aplikasi (tanpa slash di akhir), termasuk basePath.
 * Dipakai untuk isi QR, jadi harus domain yang bisa dibuka HP penonton.
 * `BETTER_AUTH_URL` boleh diisi domain saja atau sudah lengkap dengan `/vote`.
 */
export function getAppUrl() {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return base.endsWith(BASE_PATH) ? base : `${base}${BASE_PATH}`;
}

/** URL yang disimpan di QR: {APP_URL}/vote/{uuid}. */
export function voterUrl(code: string) {
  return `${getAppUrl()}/${code}`;
}

/**
 * Path internal aplikasi + basePath untuk `redirect()` server.
 * next/link sudah otomatis menambah basePath, tetapi redirect() tidak.
 */
export function appPath(path: string) {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
