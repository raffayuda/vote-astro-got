import * as XLSX from "xlsx";
import { RESULT_HEADERS, resultRows, toCsv } from "@/lib/export";
import { prisma } from "@/lib/prisma";
import { getResults } from "@/lib/results";
import { CRITERIA, weightedJudgeScore } from "@/lib/scoring";
import { getSessionFor } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getSessionFor("admin"))) return new Response("Unauthorized", { status: 401 });

  const format = new URL(request.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const { teams } = await getResults();
  const rows = resultRows(teams);

  if (format === "csv") {
    return new Response(toCsv(RESULT_HEADERS, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hasil-voting-astro-got.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  const judgeScores = await prisma.judgeScore.findMany({
    include: { judge: { select: { name: true } }, team: { select: { name: true } } },
    orderBy: [{ teamId: "asc" }, { judgeId: "asc" }],
  });
  const detailHeaders = ["Juri", "Tim", ...CRITERIA.map((c) => c.label), "Nilai Berbobot"];
  const detailRows = judgeScores.map((s) => [
    s.judge.name,
    s.team.name,
    ...CRITERIA.map((c) => s[c.key]),
    Math.round(weightedJudgeScore(s) * 100) / 100,
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[...RESULT_HEADERS], ...rows]), "Hasil");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]), "Nilai Juri");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="hasil-voting-astro-got.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
