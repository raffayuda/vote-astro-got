/**
 * URL publik aplikasi (tanpa slash di akhir).
 * Dipakai untuk isi QR, jadi harus domain yang bisa dibuka HP penonton.
 */
export function getAppUrl() {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return base;
}

/** URL yang disimpan di QR: {APP_URL}/{code}. */
export function voterUrl(code: string) {
  return `${getAppUrl()}/${code}`;
}

/**
 * Path internal aplikasi untuk redirect.
 */
export function appPath(path: string) {
  return path;
}
