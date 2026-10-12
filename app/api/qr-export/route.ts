import { voterUrl } from "@/lib/app-url";
import { toCsv } from "@/lib/export";
import { prisma } from "@/lib/prisma";
import { getSessionFor } from "@/lib/session";

/** CSV daftar QR (Label, URL, Status) untuk kebutuhan desain atau mail-merge. */
export async function GET() {
  if (!(await getSessionFor("admin"))) return new Response("Unauthorized", { status: 401 });

  const voters = await prisma.voter.findMany({
    orderBy: [{ tableName: "asc" }, { seat: "asc" }, { id: "asc" }],
  });
  const rows = voters.map((v) => [v.label ?? `QR #${v.id}`, voterUrl(v.code), v.votedAt ? "Sudah vote" : "Belum vote"]);

  return new Response(toCsv(["Label", "URL", "Status"], rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="qr-penonton-astro-got.csv"',
      "Cache-Control": "no-store",
    },
  });
}
