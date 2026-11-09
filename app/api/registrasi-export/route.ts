import XLSX from "xlsx-js-style";
import { applySheetStyles } from "@/lib/excel-builder";
import { prisma } from "@/lib/prisma";
import { getSessionFor } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getSessionFor("admin"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: "asc" },
  });

  const headers = ["NO", "WAKTU PENDAFTARAN", "NAMA LENGKAP", "NIM"];

  const rows = registrations.map((r, i) => [
    i + 1,
    new Date(r.createdAt).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    r.name,
    r.nim,
  ]);

  if (format === "csv") {
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row
            .map((val) => {
              const str = String(val);
              return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
            })
            .join(","),
        )
        .join("\r\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="data-registrasi-astro-got.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Format XLSX
  const wb = XLSX.utils.book_new();

  const data: Array<Array<string | number>> = [
    ["DATA REGISTRASI PENONTON & PESERTA — ASTRO GOT TALENT"],
    ["TOTAL PENDAFTAR", `: ${registrations.length} orang`],
    [
      "WAKTU UNDUH",
      `: ${new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    ],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  applySheetStyles(ws, data, 4, 3);

  XLSX.utils.book_append_sheet(wb, ws, "Data Registrasi");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="data-registrasi-astro-got.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

