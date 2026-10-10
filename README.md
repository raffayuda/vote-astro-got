# Voting Astro Got Talent — ASTRO 2026

Next.js 16 + Prisma 6 (PostgreSQL) + Better Auth.

## Setup

1. Salin `.env.example` ke `.env`, isi `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. `npm install`
3. `npx prisma db push`
4. `npm run db:seed` (membuat akun admin + baris sesi voting; `SEED_SAMPLE=1` untuk data contoh)
5. `npm run dev`

## Alur

- Penonton: `/` → verifikasi NIM/Email → `/vote` → konfirmasi → terkunci.
- Panitia: `/admin/login` → buka/tutup voting, kelola tim, import penonton (Excel/CSV), kelola juri, unduh hasil CSV/Excel.
- Juri: `/juri/login` → menilai tiap tim (Kreativitas 30%, Teknis 30%, Panggung 25%, Kostum 15%).
- Skor Akhir = (Nilai Juri × 50%) + (Nilai Voting × 50%).
