/** Wajib sama dengan `basePath` di next.config.ts. */
export const BASE_PATH = "/vote";

/**
 * Prefix path aset publik (mis. "/assets/x.png", "/uploads/x.jpg") dengan basePath.
 * `next/image` dan `next/link` melakukannya otomatis, tapi `<img>` biasa tidak —
 * tanpa prefix, browser me-request "/assets/..." dan kena 404 karena file diserve di "/vote/assets/...".
 */
export function assetUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
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
 *   yang dipasang reverse proxy kampus (host blob.vercel-storage.com tidak ada di allowlist).
 * - Path lokal ("/uploads/...") → prefix basePath seperti biasa.
 */
export function photoSrc(photoUrl: string): string {
  if (isBlobUrl(photoUrl)) return assetUrl(`/api/photo?u=${encodeURIComponent(photoUrl)}`);
  return assetUrl(photoUrl);
}
