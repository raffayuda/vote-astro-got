-- Migrasi data QR lama (satu QR per kursi) ke model QR meja + ballot.
-- Jalankan HANYA pada database yang sudah memiliki tabel "Voter" versi lama:
--   npx prisma db execute --file scripts/migrate-qr-quota.sql --schema prisma/schema.prisma
-- lalu:
--   npx prisma db push
--
-- Database baru tidak perlu script ini; cukup `npx prisma db push`.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Voter' AND column_name = 'userId'
  ) THEN
    RAISE EXCEPTION 'Script ini hanya untuk database lama (kolom Voter.userId tidak ditemukan).';
  END IF;
END $$;

ALTER TABLE "Voter" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Voter" ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Ballot" (
  "id" SERIAL NOT NULL,
  "qrId" INTEGER NOT NULL,
  "deviceToken" TEXT NOT NULL,
  "userId" TEXT,
  "teamId" INTEGER,
  "votedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ballot_qrId_fkey" FOREIGN KEY ("qrId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Ballot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Ballot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Ballot_deviceToken_key" ON "Ballot"("deviceToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Ballot_userId_key" ON "Ballot"("userId");
CREATE INDEX IF NOT EXISTS "Ballot_qrId_idx" ON "Ballot"("qrId");
CREATE INDEX IF NOT EXISTS "Ballot_teamId_idx" ON "Ballot"("teamId");

-- Setiap QR lama yang sudah punya akun penonton menjadi satu ballot.
INSERT INTO "Ballot" ("qrId", "deviceToken", "userId", "teamId", "votedAt", "createdAt")
SELECT
  v."id",
  gen_random_uuid()::text,
  v."userId",
  v."teamId",
  v."votedAt",
  COALESCE(v."votedAt", v."createdAt")
FROM "Voter" v
WHERE v."userId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Ballot" b WHERE b."userId" = v."userId");

-- Hitung suara yang sudah masuk sebagai pemakaian kuota.
UPDATE "Voter" v
SET "usedCount" = (
  SELECT COUNT(*)::int
  FROM "Ballot" b
  WHERE b."qrId" = v."id" AND b."votedAt" IS NOT NULL
);

-- Kolom vote lama sudah dipindahkan ke Ballot.
ALTER TABLE "Voter" DROP COLUMN IF EXISTS "votedAt";
ALTER TABLE "Voter" DROP COLUMN IF EXISTS "teamId";
ALTER TABLE "Voter" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "Voter" DROP COLUMN IF EXISTS "seat";

COMMIT;
