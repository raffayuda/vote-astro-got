import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  // Redirects untuk backward compatibility rute lama yang memakai /vote
  async redirects() {
    return [
      {
        source: "/registrasi",
        destination: "/daftar",
        permanent: false,
      },
      {
        source: "/vote/daftar",
        destination: "/daftar",
        permanent: false,
      },
      {
        source: "/vote/registrasi",
        destination: "/daftar",
        permanent: false,
      },
      {
        source: "/vote/admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/vote/juri/:path*",
        destination: "/juri/:path*",
        permanent: false,
      },
      {
        source: "/vote/:code([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})",
        destination: "/:code",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
