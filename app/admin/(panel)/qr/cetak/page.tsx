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
  searchParams: Promise<{ meja?: string; qr?: string; belum?: string; tersedia?: string }>;
}) {
  const { meja, qr, belum, tersedia } = await searchParams;
  const singleId = qr ? Number(qr) : null;
  const onlyAvailable = tersedia === "1" || belum === "1";

  let qrs = await prisma.qrCode.findMany({
    where: {
      ...(meja ? { tableName: meja } : {}),
      ...(singleId && Number.isInteger(singleId) ? { id: singleId } : {}),
    },
    orderBy: [{ tableName: "asc" }, { id: "asc" }],
  });

  // Filter dulu, supaya "belum penuh" bisa memilih QR lain di meja yang QR utamanya sudah penuh.
  if (onlyAvailable) qrs = qrs.filter((code) => code.usedCount < code.maxUses);

  // Cetak semua = satu QR per meja, bukan semua QR lama per kursi.
  if (!singleId) {
    const primary = new Map<string, (typeof qrs)[number]>();
    for (const code of qrs) {
      const key = code.tableName ?? `tanpa-meja-${code.id}`;
      if (!primary.has(key)) primary.set(key, code);
    }
    qrs = [...primary.values()];
  }

  const cards = await Promise.all(
    qrs.map(async (code) => {
      const url = voterUrl(code.code);
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return { id: code.id, label: code.label ?? code.tableName ?? `QR #${code.id}`, url, svg };
    }),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-astro-navy">Cetak QR</h1>
          <p className="text-sm text-muted">
            {cards.length} kartu{meja ? ` · ${meja}` : ""}
            {onlyAvailable ? " · belum penuh" : ""}. Tekan Cetak lalu pilih printer atau &quot;Save as PDF&quot;.
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
