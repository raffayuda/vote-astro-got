import type { NextConfig } from "next";

/** Kode QR penonton (UUID v1-v8). */
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

const nextConfig: NextConfig = {
  // Diserve di https://astro.nurulfikri.ac.id/vote lewat proxy situs ASTRO
  // (Cloudflare Pages Function `functions/vote/[[path]].ts` di repo Astro-2026).
  // Harus sama dengan BASE_PATH di lib/asset.ts.
  basePath: "/vote",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Semua halaman di app ini per-pengguna (sesi + database), jadi validasi "instant"
    // hanya dijalankan untuk segmen yang memintanya secara eksplisit.
    instantInsights: { validationLevel: "manual-warning" },
    // Lewat proxy, Origin = astro.nurulfikri.ac.id sedangkan host = *.vercel.app.
    serverActions: { allowedOrigins: ["astro.nurulfikri.ac.id"] },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Rute lama di root domain (sebelum basePath, termasuk QR yang sudah
    // dicetak berisi {domain}/{uuid}) diarahkan ke padanannya di bawah /vote.
    const legacyRoot = [
      { source: "/", destination: "/vote" },
      { source: "/admin/:path*", destination: "/vote/admin/:path*" },
      { source: "/juri/:path*", destination: "/vote/juri/:path*" },
      { source: "/agt/:path*", destination: "/vote/agt/:path*" },
      { source: "/daftar", destination: "/vote/agt/penonton/daftar" },
      { source: "/registrasi", destination: "/vote/agt/penonton/daftar" },
      { source: `/:code(${UUID})`, destination: "/vote/:code" },
    ].map((rule) => ({ ...rule, permanent: false, basePath: false as const }));

    return [
      ...legacyRoot,
      { source: "/registrasi", destination: "/agt/penonton/daftar", permanent: false },
      { source: "/daftar", destination: "/agt/penonton/daftar", permanent: false },
    ];
  },
};

export default nextConfig;
