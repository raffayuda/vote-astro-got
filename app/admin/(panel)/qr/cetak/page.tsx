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
  searchParams: Promise<{ meja?: string; baris?: string; qr?: string; belum?: string; tersedia?: string }>;
}) {
  const { meja, baris, qr, belum, tersedia } = await searchParams;
  const targetRow = baris ?? meja;
  const singleId = qr ? Number(qr) : null;
  const onlyAvailable = tersedia === "1" || belum === "1";

  let qrs = await prisma.qrCode.findMany({
    where: {
      ...(targetRow ? { tableName: targetRow } : {}),
      ...(singleId && Number.isInteger(singleId) ? { id: singleId } : {}),
    },
    orderBy: [{ tableName: "asc" }, { id: "asc" }],
  });

  // Filter dulu jika hanya ingin yang masih tersedia kuotanya
  if (onlyAvailable) qrs = qrs.filter((code) => code.usedCount < code.maxUses);

  // Urutkan secara natural: Baris 1, Baris 2, Baris 10; Kursi 1, Kursi 2, Kursi 10
  qrs.sort((a, b) => {
    const tableCompare = (a.tableName ?? "").localeCompare(b.tableName ?? "", undefined, { numeric: true });
    if (tableCompare !== 0) return tableCompare;
    const labelA = a.label ?? "";
    const labelB = b.label ?? "";
    return labelA.localeCompare(labelB, undefined, { numeric: true }) || a.id - b.id;
  });

  const cards = await Promise.all(
    qrs.map(async (code) => {
      const url = voterUrl(code.code);
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return { id: code.id, label: code.label ?? code.tableName ?? `QR #${code.id}`, svg };
    }),
  );

  // Bagi kartu menjadi per 9 QR code untuk setiap halaman cetak (3 kolom x 3 baris)
  const pages: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += 9) {
    pages.push(cards.slice(i, i + 9));
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          html, body {
            height: 100% !important;
            background: white !important;
          }
          body, main, [class*="max-w-"], [class*="Container"] {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .print-sheet {
            height: 270mm !important;
            max-height: 270mm !important;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            grid-template-rows: repeat(3, 1fr) !important;
            gap: 4mm 6mm !important;
            page-break-after: always;
            break-after: page;
            box-sizing: border-box !important;
            padding: 2mm 0 !important;
          }
          .print-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-astro-navy">Cetak QR</h1>
          <p className="text-sm text-muted">
            {cards.length} kartu ({pages.length} halaman · 9 QR per halaman){targetRow ? ` · ${targetRow}` : ""}
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
        <div className="flex flex-col gap-6 print:gap-0">
          {pages.map((pageCards, pageIndex) => (
            <div
              key={pageIndex}
              className="print-sheet grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3"
            >
              {pageCards.map((c) => (
                <QrCard key={c.id} label={c.label} svg={c.svg} />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
