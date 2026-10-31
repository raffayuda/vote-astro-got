import { voterUrl } from "@/lib/app-url";
import { toCsv } from "@/lib/export";
import { prisma } from "@/lib/prisma";
import { getSessionFor } from "@/lib/session";

/** CSV daftar QR (Label, URL, Kuota, Terpakai, Sisa, Status) untuk kebutuhan desain atau mail-merge. */
export async function GET() {
  if (!(await getSessionFor("admin"))) return new Response("Unauthorized", { status: 401 });

  const qrs = await prisma.qrCode.findMany({
    orderBy: [{ tableName: "asc" }, { id: "asc" }],
  });

  qrs.sort((a, b) => {
    const tableCompare = (a.tableName ?? "").localeCompare(b.tableName ?? "", undefined, { numeric: true });
    if (tableCompare !== 0) return tableCompare;
    const labelA = a.label ?? "";
    const labelB = b.label ?? "";
    return labelA.localeCompare(labelB, undefined, { numeric: true }) || a.id - b.id;
  });
  const rows = qrs.map((qr) => {
    const remaining = Math.max(0, qr.maxUses - qr.usedCount);
    return [
      qr.label ?? qr.tableName ?? `QR #${qr.id}`,
      voterUrl(qr.code),
      qr.maxUses,
      qr.usedCount,
      remaining,
      remaining === 0 ? "Penuh" : "Tersedia",
    ];
  });

  return new Response(toCsv(["Label", "URL", "Kuota", "Terpakai", "Sisa", "Status"], rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="qr-penonton-astro-got.csv"',
      "Cache-Control": "no-store",
    },
  });
}
