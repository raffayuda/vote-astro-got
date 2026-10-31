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
  // QR lama dicetak sebelum basePath ditambahkan: {domain}/{uuid}.
  // Arahkan ke URL baru {domain}/vote/{uuid} supaya kartu yang sudah dicetak tetap bisa dipakai.
  async redirects() {
    return [
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
