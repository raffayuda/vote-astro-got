import QRCode from "qrcode";
import { PrintButton } from "@/components/print-button";
import { QrCard } from "@/components/qr-card";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { voterUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Cetak QR — ASTRO Got Talent" };

export default async function PrintQrPage({
  searchParams,
}: {
  searchParams: Promise<{ meja?: string; belum?: string }>;
}) {
  const { meja, belum } = await searchParams;

  const voters = await prisma.voter.findMany({
    where: {
      ...(meja ? { tableName: meja } : {}),
      ...(belum === "1" ? { votedAt: null } : {}),
    },
    orderBy: [{ tableName: "asc" }, { seat: "asc" }, { id: "asc" }],
  });

  const cards = await Promise.all(
    voters.map(async (v) => {
      const url = voterUrl(v.code);
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return { id: v.id, label: v.label ?? `QR #${v.id}`, url, svg };
    }),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-astro-navy">Cetak QR</h1>
          <p className="text-sm text-muted">
            {cards.length} kartu{meja ? ` · ${meja}` : ""}
            {belum === "1" ? " · belum vote" : ""}. Tekan Cetak lalu pilih printer atau &quot;Save as PDF&quot;.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/qr" variant="secondary" prefetch={false}>
            Kembali
          </ButtonLink>
          <PrintButton>Cetak</PrintButton>
        </div>
      </div>
      {cards.length === 0 ? (
        <Alert tone="info">Tidak ada QR untuk dicetak.</Alert>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
          {cards.map((c) => (
            <QrCard key={c.id} label={c.label} url={c.url} svg={c.svg} />
          ))}
        </div>
      )}
    </>
  );
}
