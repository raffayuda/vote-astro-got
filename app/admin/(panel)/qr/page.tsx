import {
  deleteAllQrCodes,
  generateSimpleQrCodes,
  reopenAllQrCodes,
} from "@/app/actions/admin";
import { QrTable } from "@/components/qr-table";
import { ActionForm } from "@/components/ui/action-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/ui/stat-tile";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "QR Penonton — ASTRO Got Talent" };

export default async function AdminQrPage() {
  const qrs = await prisma.qrCode.findMany({
    orderBy: [{ id: "asc" }],
    select: { id: true, tableName: true, label: true, maxUses: true, usedCount: true },
  });

  // Urutkan secara natural sesuai nomor QR
  qrs.sort((a, b) => {
    const labelA = a.label ?? "";
    const labelB = b.label ?? "";
    return labelA.localeCompare(labelB, undefined, { numeric: true }) || a.id - b.id;
  });

  const totalQuota = qrs.reduce((sum, qr) => sum + qr.maxUses, 0);
  const used = qrs.reduce((sum, qr) => sum + qr.usedCount, 0);
  const appUrl = getAppUrl();
  const isLocal = /localhost|127\.0\.0\.1/.test(appUrl);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total QR" value={qrs.length} />
        <StatTile label="Kuota Suara" value={totalQuota} />
        <StatTile label="Suara Masuk" value={used} />
        <StatTile label="Sisa Kuota" value={Math.max(0, totalQuota - used)} />
      </div>

      {isLocal && (
        <Alert tone="error">
          <code>BETTER_AUTH_URL</code> masih <code>{appUrl}</code>. QR yang dicetak akan mengarah ke alamat itu dan
          tidak bisa dibuka HP penonton. Ganti dengan domain publik (mis. https://vote-astro.vercel.app) sebelum
          mencetak.
        </Alert>
      )}

      {/* Generator QR Simpel */}
      <Card>
        <CardTitle>Generate QR Penonton</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Buat QR penonton sekaligus secara instan. Cukup masukkan berapa banyak lembar/kartu QR yang ingin dibuat
          dan kuota suara per QR. Nomor QR otomatis berurutan (mis. QR #001, QR #002, dst.).
        </p>
        <ActionForm
          action={generateSimpleQrCodes}
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Input
            name="count"
            label="Jumlah QR yang Ingin Dibuat"
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            defaultValue={20}
            required
            placeholder="mis. 50"
          />
          <Input
            name="quota"
            label="Kuota Suara per QR"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            defaultValue={1}
            required
            placeholder="mis. 1"
          />
          <SubmitButton pendingText="Membuat QR...">Generate QR</SubmitButton>
        </ActionForm>
      </Card>

      {/* Daftar QR Penonton */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-astro-navy">Daftar QR Penonton ({qrs.length})</h2>
            <p className="text-xs text-muted">Format cetak presisi 9 QR per lembar A4 portrait.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/admin/qr/cetak" variant="secondary" size="sm" prefetch={false}>
              Cetak Semua QR
            </ButtonLink>
            <ButtonLink href="/admin/qr/cetak?tersedia=1" variant="secondary" size="sm" prefetch={false}>
              Cetak Belum Penuh
            </ButtonLink>
            <ButtonLink href="/api/qr-export" variant="secondary" size="sm" prefetch={false}>
              Unduh CSV
            </ButtonLink>

            <ActionForm action={reopenAllQrCodes} className="inline">
              <SubmitButton variant="secondary" size="sm" pendingText="...">
                Buka Semua (+1 Slot)
              </SubmitButton>
            </ActionForm>

            {qrs.length > 0 && (
              <ActionForm action={deleteAllQrCodes} className="inline">
                <SubmitButton
                  variant="danger"
                  size="sm"
                  pendingText="Menghapus..."
                  title="Hapus seluruh QR penonton"
                >
                  Hapus Semua QR
                </SubmitButton>
              </ActionForm>
            )}
          </div>
        </div>

        <QrTable qrs={qrs} />
      </section>
    </>
  );
}
