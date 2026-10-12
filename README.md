# Voting Astro Got Talent — ASTRO 2026

Next.js 16 + Prisma 6 (PostgreSQL) + Better Auth.

## Setup

1. Salin `.env.example` ke `.env`, isi `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. `npm install`
3. `npx prisma db push`
4. `npm run db:seed` (membuat akun admin + baris sesi voting; `SEED_SAMPLE=1` untuk tim dan QR contoh)
5. `npm run dev`

## Alur

1. Panitia login di `/admin/login`, buka **QR Penonton** (`/admin/qr`), isi nama meja + jumlah kursi, lalu **Generate**. Bisa generate tambahan kapan saja.
2. Cetak lewat `/admin/qr/cetak` (Ctrl+P / Save as PDF). Satu kartu = satu QR = satu penonton.
3. Penonton scan QR di mejanya (kamera / Google Lens) → URL `{BETTER_AUTH_URL}/{uuid}` → otomatis masuk → pilih tim → konfirmasi → suara terkunci.
4. Panitia buka/tutup sesi voting, pantau hasil real-time, dan unduh CSV/Excel di `/admin`.
5. Juri login di `/juri/login` (akun dibuat panitia di `/admin/juri`) dan menilai tiap tim (Kreativitas 30%, Teknis 30%, Panggung 25%, Kostum 15%).

Skor Akhir = (Nilai Juri × 50%) + (Nilai Voting × 50%).

> Isi `BETTER_AUTH_URL` dengan domain publik sebelum mencetak QR.
