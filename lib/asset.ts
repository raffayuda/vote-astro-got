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
