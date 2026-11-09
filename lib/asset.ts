/** BasePath aplikasi (kosong karena aplikasi diserve di root domain). */
export const BASE_PATH = "";

/**
 * Path aset publik (mis. "/assets/x.png", "/uploads/x.jpg").
 */
export function assetUrl(path: string): string {
  return path;
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
 * - Path lokal ("/uploads/...") → path langsung.
 */
export function photoSrc(photoUrl: string): string {
  if (isBlobUrl(photoUrl)) return assetUrl(`/api/photo?u=${encodeURIComponent(photoUrl)}`);
  return assetUrl(photoUrl);
}
