import {
  bulkUpdateQrCodes,
  deleteCode,
  generateTableQr,
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

const NO_TABLE = "Tanpa meja";

export default async function AdminQrPage() {
  const qrs = await prisma.qrCode.findMany({
    orderBy: [{ tableName: "asc" }, { id: "asc" }],
    select: { id: true, tableName: true, label: true, maxUses: true, usedCount: true },
  });

  const tables = new Map<string, typeof qrs>();
  for (const qr of qrs) {
    const key = qr.tableName ?? NO_TABLE;
    tables.set(key, [...(tables.get(key) ?? []), qr]);
  }

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
        <CardTitle>Buat / Atur QR Meja</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Satu QR untuk satu meja. Isi kuota suara (berapa orang yang boleh vote lewat QR ini). Kuota bisa diubah
          kapan saja tanpa cetak ulang. URL di QR: <code className="text-astro-blue">{appUrl}/&lt;uuid&gt;</code>
        </p>
        <ActionForm action={generateTableQr} className="mt-4 grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <Input name="tableName" label="Nama meja" placeholder="Meja 5" required maxLength={40} />
          <Input
            name="quota"
            label="Kuota suara"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            defaultValue={6}
            required
          />
          <SubmitButton pendingText="Menyimpan...">Simpan QR</SubmitButton>
        </ActionForm>
      </Card>

      <Card>
        <CardTitle>Aksi Massal</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Centang QR di daftar bawah, lalu buka satu slot atau set kuota untuk QR yang dipilih. Tombol kedua membuka
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
            defaultValue={6}
            className="w-44"
          />
          <SubmitButton name="mode" value="reopen" variant="secondary" pendingText="Membuka...">
            Buka 1 slot terpilih
          </SubmitButton>
          <SubmitButton name="mode" value="set" variant="secondary" pendingText="Menyimpan...">
            Set kuota terpilih
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
          <CardTitle>Daftar Meja ({tables.size})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/qr/cetak" variant="secondary" size="sm" prefetch={false}>
              Cetak semua
            </ButtonLink>
            <ButtonLink href="/admin/qr/cetak?tersedia=1" variant="secondary" size="sm" prefetch={false}>
              Cetak yang belum penuh
            </ButtonLink>
            <ButtonLink href="/api/qr-export" variant="secondary" size="sm" prefetch={false}>
              Unduh CSV
            </ButtonLink>
          </div>
        </div>
        {tables.size === 0 && <p className="text-sm text-muted">Belum ada QR. Buat dulu di atas.</p>}
        {[...tables].map(([table, tableQrs]) => {
          const tableUsed = tableQrs.reduce((sum, qr) => sum + qr.usedCount, 0);
          const tableQuota = tableQrs.reduce((sum, qr) => sum + qr.maxUses, 0);
          return (
            <Card key={table}>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                  <span className="font-display font-extrabold text-astro-navy">{table}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={tableUsed >= tableQuota ? "accent" : "success"}>
                      {tableUsed}/{tableQuota} suara
                    </Badge>
                    {tableQrs.length > 1 && <Badge tone="neutral">{tableQrs.length} QR</Badge>}
                  </span>
                </summary>
                <div className="mt-4 flex flex-col gap-3">
                  {table !== NO_TABLE && (
                    <ButtonLink
                      href={`/admin/qr/cetak?meja=${encodeURIComponent(table)}`}
                      variant="secondary"
                      size="sm"
                      prefetch={false}
                      className="self-start"
                    >
                      Cetak meja ini
                    </ButtonLink>
                  )}
                  <ul className="grid gap-2">
                    {tableQrs.map((qr) => {
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
                            {qr.usedCount === 0 && (
                              <ActionForm action={deleteCode}>
                                <input type="hidden" name="id" value={qr.id} />
                                <SubmitButton variant="danger" size="sm" pendingText="...">
                                  Hapus
                                </SubmitButton>
                              </ActionForm>
                            )}
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
