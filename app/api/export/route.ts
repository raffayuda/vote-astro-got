import XLSX from "xlsx-js-style";
import {
  RESULT_HEADERS,
  ACCUMULATED_RESULT_HEADERS,
  SHOWCASE_RESULT_HEADERS,
  FINAL_RESULT_HEADERS,
  resultRows,
  accumulatedResultRows,
  showcaseResultRows,
  finalResultRows,
  toCsv,
} from "@/lib/export";
import { getResults } from "@/lib/results";
import { getSessionFor } from "@/lib/session";
import {
  buildOverviewWorkbook,
  buildSingleJudgeWorkbook,
  buildSingleTeamWorkbook,
} from "@/lib/excel-builder";

export async function GET(request: Request) {
  if (!(await getSessionFor("admin"))) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const stage = url.searchParams.get("stage") ?? undefined;
  const judgeId = url.searchParams.get("judgeId") ?? undefined;
  const teamIdParam = url.searchParams.get("teamId") ?? undefined;
  const teamId = teamIdParam ? Number(teamIdParam) : undefined;

  const stageSuffix = stage && stage !== "Semua" ? `-${stage.toLowerCase().replace(/\s+/g, "-")}` : "";

  // 1. Ekspor CSV (hanya ringkasan hasil)
  if (format === "csv") {
    const { teams } = await getResults(stage);
    const isMulti = !stage || stage === "Semua";
    const isShowcase = stage?.toLowerCase() === "showcase";
    const isFinal = stage?.toLowerCase() === "final";

    const headers = isMulti
      ? ACCUMULATED_RESULT_HEADERS
      : isShowcase
      ? SHOWCASE_RESULT_HEADERS
      : isFinal
      ? FINAL_RESULT_HEADERS
      : RESULT_HEADERS;

    const rows = isMulti
      ? accumulatedResultRows(teams)
      : isShowcase
      ? showcaseResultRows(teams)
      : isFinal
      ? finalResultRows(teams)
      : resultRows(teams);

    return new Response(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hasil-voting${stageSuffix}-astro-got.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // 2. Ekspor Excel (.xlsx) dengan gaya visual header biru dan auto-fit kolom
  let workbook: XLSX.WorkBook;
  let filename = `hasil-voting${stageSuffix}-astro-got.xlsx`;

  if (judgeId) {
    workbook = await buildSingleJudgeWorkbook(judgeId, stage);
    filename = `penilaian-juri${stageSuffix}-astro-got.xlsx`;
  } else if (teamId && Number.isInteger(teamId)) {
    workbook = await buildSingleTeamWorkbook(teamId, stage);
    filename = `detail-penampilan-${teamId}${stageSuffix}-astro-got.xlsx`;
  } else {
    // Ringkasan Dashboard: mencakup semua babak dan semua juri
    workbook = await buildOverviewWorkbook(stage);
    filename = `rekap-lengkap-semua-babak-astro-got.xlsx`;
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
