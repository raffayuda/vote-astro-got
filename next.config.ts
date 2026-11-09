import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: "/vote",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Semua halaman di app ini per-pengguna (sesi + database), jadi validasi "instant"
    // hanya dijalankan untuk segmen yang memintanya secara eksplisit.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Redirects untuk rute tanpa basePath /vote
  async redirects() {
    return [
      {
        source: "/daftar",
        destination: "/vote/daftar",
        permanent: false,
        basePath: false,
      },
      {
        source: "/registrasi",
        destination: "/vote/daftar",
        permanent: false,
        basePath: false,
      },
      {
        source: "/admin/:path*",
        destination: "/vote/admin/:path*",
        permanent: false,
        basePath: false,
      },
      {
        source: "/juri/:path*",
        destination: "/vote/juri/:path*",
        permanent: false,
        basePath: false,
      },
      {
        source: "/:code([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})",
        destination: "/vote/:code",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
