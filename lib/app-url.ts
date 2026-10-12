/** URL publik aplikasi (tanpa slash di akhir). Dipakai untuk isi QR, jadi harus domain yang bisa dibuka HP penonton. */
export function getAppUrl() {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** URL yang disimpan di QR: {APP_URL}/{uuid}. */
export function voterUrl(code: string) {
  return `${getAppUrl()}/${code}`;
}
