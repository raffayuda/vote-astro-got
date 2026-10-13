import { BLOB_HOST_SUFFIX } from "@/lib/asset";

/**
 * Proxy gambar Vercel Blob lewat domain sendiri.
 * Reverse proxy kampus memasang CSP `img-src 'self' ...` tanpa host blob,
 * sehingga <img src="https://....blob.vercel-storage.com/..."> diblokir browser.
 * Lewat route ini gambar diserve dari domain aplikasi sendiri ('self') → lolos CSP.
 * Hanya hostname *.blob.vercel-storage.com yang diizinkan (bukan open proxy).
 */
export async function GET(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get("u");
  if (!target) return new Response("Parameter u wajib diisi.", { status: 400 });

  let hostname: string;
  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "https:") throw new Error("protocol");
    hostname = parsed.hostname;
  } catch {
    return new Response("URL tidak valid.", { status: 400 });
  }
  if (!hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return new Response("Host tidak diizinkan.", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { next: { revalidate: 86400 } });
  } catch {
    return new Response("Gagal mengambil gambar.", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("Gambar tidak ditemukan.", { status: upstream.status === 404 ? 404 : 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return new Response("Bukan gambar.", { status: 400 });
  }

  // Satu URL Blob tidak pernah berubah isinya (ganti foto = URL baru), aman di-cache lama.
  return new Response(upstream.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
