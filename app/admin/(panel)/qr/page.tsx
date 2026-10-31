import {
  bulkUpdateQrCodes,
  deleteCode,
  deleteRowQrCodes,
  generateRowQrCodes,
  reopenAllQrCodes,
  reopenQr,
  updateQrQuota,
} from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/ui/stat-tile";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "QR Penonton — ASTRO Got Talent" };

const NO_ROW = "Tanpa baris";

export default async function AdminQrPage() {
  const qrs = await prisma.qrCode.findMany({
    orderBy: [{ tableName: "asc" }, { id: "asc" }],
    select: { id: true, tableName: true, label: true, maxUses: true, usedCount: true },
  });

  const rows = new Map<string, typeof qrs>();
  for (const qr of qrs) {
    const key = qr.tableName ?? NO_ROW;
    rows.set(key, [...(rows.get(key) ?? []), qr]);
  }

  const sortedRowKeys = [...rows.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

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

      <Card>
        <CardTitle>Generate QR Baris</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Generate beberapa QR sekaligus untuk satu baris tempat duduk. Tentukan nama baris, jumlah QR (kursi),
          dan kuota suara per QR. Nomor kursi akan otomatis melanjutkan yang sudah ada. URL di QR:{" "}
          <code className="text-astro-blue">{appUrl}/&lt;uuid&gt;</code>
        </p>
        <ActionForm
          action={generateRowQrCodes}
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_9rem_9rem_auto] sm:items-end"
        >
          <Input
            name="tableName"
            label="Nama baris"
            placeholder="mis. Baris 1 atau Baris A"
            required
            maxLength={40}
          />
          <Input
            name="count"
            label="Jumlah QR"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            defaultValue={10}
            required
          />
          <Input
            name="quota"
            label="Kuota per QR"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            defaultValue={1}
            required
          />
          <SubmitButton pendingText="Membuat QR...">Generate QR</SubmitButton>
        </ActionForm>
      </Card>

      <Card>
        <CardTitle>Aksi Massal</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Centang QR di daftar bawah, lalu buka satu slot, set kuota, atau hapus QR yang dipilih. Tombol terakhir membuka
          satu slot untuk semua QR sekaligus.
        </p>
        <ActionForm
          id="qr-bulk"
          action={bulkUpdateQrCodes}
          className="mt-4 flex flex-wrap items-end gap-3 border-b border-line/50 pb-4"
        >
          <Input
            name="quota"
            label="Kuota baru (untuk Set)"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            defaultValue={1}
            className="w-44"
          />
          <SubmitButton name="mode" value="reopen" variant="secondary" pendingText="Membuka...">
            Buka 1 slot terpilih
          </SubmitButton>
          <SubmitButton name="mode" value="set" variant="secondary" pendingText="Menyimpan...">
            Set kuota terpilih
          </SubmitButton>
          <SubmitButton name="mode" value="delete" variant="danger" pendingText="Menghapus...">
            Hapus terpilih
          </SubmitButton>
          <span className="text-xs text-muted">Centang QR di daftar bawah.</span>
        </ActionForm>
        <ActionForm action={reopenAllQrCodes} className="mt-4">
          <SubmitButton variant="secondary" pendingText="Membuka...">
            Buka semua QR (+1 slot)
          </SubmitButton>
        </ActionForm>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Daftar Baris ({rows.size})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/qr/cetak" variant="secondary" size="sm" prefetch={false}>
              Cetak semua QR
            </ButtonLink>
            <ButtonLink href="/admin/qr/cetak?tersedia=1" variant="secondary" size="sm" prefetch={false}>
              Cetak yang belum penuh
            </ButtonLink>
            <ButtonLink href="/api/qr-export" variant="secondary" size="sm" prefetch={false}>
              Unduh CSV
            </ButtonLink>
          </div>
        </div>
        {rows.size === 0 && <p className="text-sm text-muted">Belum ada QR. Buat dulu di atas.</p>}
        {sortedRowKeys.map((rowName) => {
          const rowQrs = rows.get(rowName) ?? [];
          rowQrs.sort((a, b) => {
            const labelA = a.label ?? "";
            const labelB = b.label ?? "";
            return labelA.localeCompare(labelB, undefined, { numeric: true }) || a.id - b.id;
          });
          const rowUsed = rowQrs.reduce((sum, qr) => sum + qr.usedCount, 0);
          const rowQuota = rowQrs.reduce((sum, qr) => sum + qr.maxUses, 0);
          return (
            <Card key={rowName}>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                  <span className="font-display font-extrabold text-astro-navy">{rowName}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={rowUsed >= rowQuota ? "accent" : "success"}>
                      {rowUsed}/{rowQuota} suara
                    </Badge>
                    <Badge tone="neutral">{rowQrs.length} QR</Badge>
                  </span>
                </summary>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {rowName !== NO_ROW && (
                      <ButtonLink
                        href={`/admin/qr/cetak?baris=${encodeURIComponent(rowName)}`}
                        variant="secondary"
                        size="sm"
                        prefetch={false}
                        className="self-start"
                      >
                        Cetak baris ini ({rowQrs.length} QR)
                      </ButtonLink>
                    )}
                    {rowName !== NO_ROW && (
                      <ActionForm action={deleteRowQrCodes}>
                        <input type="hidden" name="tableName" value={rowName} />
                        <SubmitButton variant="danger" size="sm" pendingText="Menghapus baris...">
                          Hapus baris ini
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                  <ul className="grid gap-2">
                    {rowQrs.map((qr) => {
                      const full = qr.usedCount >= qr.maxUses;
                      const name = qr.label ?? `QR #${qr.id}`;
                      return (
                        <li
                          key={qr.id}
                          className="flex flex-col gap-3 rounded-2xl border border-line/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <label className="flex items-center gap-2 text-sm font-semibold text-astro-navy">
                            <input
                              type="checkbox"
                              name="ids"
                              value={qr.id}
                              form="qr-bulk"
                              className="size-4 accent-astro-blue"
                            />
                            <span>{name}</span>
                          </label>
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge tone={full ? "accent" : "success"}>
                              {qr.usedCount}/{qr.maxUses} suara
                            </Badge>
                            <ActionForm action={updateQrQuota} className="flex items-center gap-1">
                              <input type="hidden" name="id" value={qr.id} />
                              <Input
                                name="maxUses"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={1000}
                                defaultValue={qr.maxUses}
                                aria-label={`Kuota ${name}`}
                                className="h-9 w-20 px-2 text-sm"
                              />
                              <SubmitButton variant="secondary" size="sm" pendingText="...">
                                Set
                              </SubmitButton>
                            </ActionForm>
                            <ActionForm action={reopenQr}>
                              <input type="hidden" name="id" value={qr.id} />
                              <SubmitButton variant="secondary" size="sm" pendingText="...">
                                Buka 1 slot
                              </SubmitButton>
                            </ActionForm>
                            <ButtonLink
                              href={`/admin/qr/cetak?qr=${qr.id}`}
                              variant="secondary"
                              size="sm"
                              prefetch={false}
                            >
                              Cetak
                            </ButtonLink>
                            <ActionForm action={deleteCode}>
                              <input type="hidden" name="id" value={qr.id} />
                              <SubmitButton variant="danger" size="sm" pendingText="...">
                                Hapus
                              </SubmitButton>
                            </ActionForm>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </details>
            </Card>
          );
        })}
      </section>
    </>
  );
}
