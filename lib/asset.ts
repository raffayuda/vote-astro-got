/**
 * BasePath aplikasi. Harus sama dengan `basePath` di next.config.ts: app ini
 * diserve di https://astro.nurulfikri.ac.id/vote lewat proxy situs ASTRO.
 */
export const BASE_PATH = "/vote";

/**
 * Path aset publik (mis. "/assets/x.png", "/uploads/x.jpg") dengan basePath.
 * Next tidak menambahkan basePath pada `src` gambar, <a> biasa, atau HTML
 * mentah, jadi semua path publik lewat sini. URL absolut dikembalikan apa adanya.
 */
export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith(BASE_PATH + "/")) return path;
  return `${BASE_PATH}${path}`;
}

/** Suffix hostname Vercel Blob yang diizinkan untuk di-proxy lewat /api/photo. */
export const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";

/** Cek apakah URL adalah URL publik Vercel Blob (bukan URL asing sembarang). */
export function isBlobUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * URL <img> untuk foto tim.
 * - URL Vercel Blob → lewat proxy se-domain "/api/photo?u=..." agar lolos CSP `img-src 'self'`
 * - Path lokal ("/uploads/...") → path dengan basePath.
 */
export function photoSrc(photoUrl: string): string {
  if (isBlobUrl(photoUrl)) return assetUrl(`/api/photo?u=${encodeURIComponent(photoUrl)}`);
  return assetUrl(photoUrl);
}
