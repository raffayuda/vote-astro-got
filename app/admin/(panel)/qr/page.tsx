import { deleteCode, generateCodes } from "@/app/actions/admin";
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
  const voters = await prisma.voter.findMany({
    orderBy: [{ tableName: "asc" }, { seat: "asc" }, { id: "asc" }],
    select: { id: true, tableName: true, seat: true, label: true, votedAt: true },
  });

  const tables = new Map<string, typeof voters>();
  for (const v of voters) {
    const key = v.tableName ?? NO_TABLE;
    tables.set(key, [...(tables.get(key) ?? []), v]);
  }
  const voted = voters.filter((v) => v.votedAt).length;
  const appUrl = getAppUrl();
  const isLocal = /localhost|127\.0\.0\.1/.test(appUrl);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total QR" value={voters.length} />
        <StatTile label="Sudah vote" value={voted} />
        <StatTile label="Belum vote" value={voters.length - voted} />
      </div>

      {isLocal && (
        <Alert tone="error">
          <code>BETTER_AUTH_URL</code> masih <code>{appUrl}</code>. QR yang dicetak akan mengarah ke alamat itu dan
          tidak bisa dibuka HP penonton. Ganti dengan domain publik (mis. https://vote-astro.vercel.app) sebelum
          mencetak.
        </Alert>
      )}

      <Card>
        <CardTitle>Generate QR</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Satu QR = satu penonton. Isi nama meja dan jumlah kursi. Generate lagi untuk meja yang sama akan melanjutkan
          nomor kursi. URL di QR: <code className="text-astro-blue">{appUrl}/&lt;uuid&gt;</code>
        </p>
        <ActionForm action={generateCodes} className="mt-4 grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <Input name="tableName" label="Nama meja" placeholder="Meja 5" required maxLength={40} />
          <Input name="seats" label="Jumlah kursi" type="number" inputMode="numeric" min={1} max={100} defaultValue={6} required />
          <SubmitButton pendingText="Membuat...">Generate</SubmitButton>
        </ActionForm>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Daftar Meja ({tables.size})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/qr/cetak" variant="secondary" size="sm" prefetch={false}>
              Cetak semua
            </ButtonLink>
            <ButtonLink href="/admin/qr/cetak?belum=1" variant="secondary" size="sm" prefetch={false}>
              Cetak yang belum vote
            </ButtonLink>
            <ButtonLink href="/api/qr-export" variant="secondary" size="sm" prefetch={false}>
              Unduh CSV
            </ButtonLink>
          </div>
        </div>
        {tables.size === 0 && <p className="text-sm text-muted">Belum ada QR. Generate dulu di atas.</p>}
        {[...tables].map(([table, seats]) => {
          const done = seats.filter((s) => s.votedAt).length;
          return (
            <Card key={table}>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                  <span className="font-display font-extrabold text-astro-navy">{table}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={done === seats.length ? "success" : "neutral"}>
                      {done}/{seats.length} sudah vote
                    </Badge>
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
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {seats.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 rounded-2xl border border-line/50 px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-astro-navy">{s.label ?? `QR #${s.id}`}</span>
                        <span className="flex items-center gap-2">
                          <Badge tone={s.votedAt ? "success" : "neutral"}>{s.votedAt ? "Sudah vote" : "Belum"}</Badge>
                          {!s.votedAt && (
                            <ActionForm action={deleteCode}>
                              <input type="hidden" name="id" value={s.id} />
                              <SubmitButton variant="danger" size="sm" pendingText="...">
                                Hapus
                              </SubmitButton>
                            </ActionForm>
                          )}
                        </span>
                      </li>
                    ))}
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
