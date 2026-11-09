import XLSX from "xlsx-js-style";
import {
  RESULT_HEADERS,
  ACCUMULATED_RESULT_HEADERS,
  SHOWCASE_RESULT_HEADERS,
  FINAL_RESULT_HEADERS,
  formatMembers,
  resultRows,
  accumulatedResultRows,
  showcaseResultRows,
  finalResultRows,
} from "@/lib/export";
import { prisma } from "@/lib/prisma";
import { getResults } from "@/lib/results";
import { CRITERIA, weightedJudgeScore, JUDGE_SHARE, VOTE_SHARE } from "@/lib/scoring";

export const HEADER_STYLE = {
  fill: { fgColor: { rgb: "1E40AF" } }, // Blue Tailwind blue-800
  font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
  alignment: { vertical: "center", horizontal: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } },
  },
};

export const CELL_STYLE = {
  font: { name: "Calibri", sz: 11, color: { rgb: "0F172A" } },
  border: {
    top: { style: "thin", color: { rgb: "E2E8F0" } },
    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
    left: { style: "thin", color: { rgb: "E2E8F0" } },
    right: { style: "thin", color: { rgb: "E2E8F0" } },
  },
};

export const TITLE_STYLE = {
  font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "1E3A8A" } },
};

export function sanitizeSheetName(rawName: string, usedNames: Set<string>): string {
  let clean = rawName.replace(/[\\/?*:[\]]/g, "").trim();
  if (!clean) clean = "Sheet";
  let finalName = clean.slice(0, 31);
  let counter = 2;
  while (usedNames.has(finalName.toLowerCase())) {
    const suffix = ` (${counter})`;
    finalName = `${clean.slice(0, 31 - suffix.length)}${suffix}`;
    counter++;
  }
  usedNames.add(finalName.toLowerCase());
  return finalName;
}

/** Menghitung lebar kolom otomatis berdasarkan panjang teks konten + padding */
export function calculateColumnWidths(
  rows: Array<Array<string | number | null | undefined>>,
  ignoreRowsForCol0: number = 0,
) {
  const maxLengths: number[] = [];

  rows.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (colIdx === 0 && rowIdx < ignoreRowsForCol0) return; // Abaikan judul di A1..A4 agar kolom A tidak terlalu lebar
      const text = cell != null ? String(cell).trim() : "";
      const len = text.length;
      maxLengths[colIdx] = Math.max(maxLengths[colIdx] || 8, len);
    });
  });

  return maxLengths.map((len) => ({
    wch: Math.max(8, Math.min(len + 4, 45)), // padding 4, min 8, max 45
  }));
}

/** Terapkan gaya visual (header biru, border, format angka) pada worksheet */
export function applySheetStyles(
  ws: XLSX.WorkSheet,
  rows: Array<Array<string | number | null | undefined>>,
  headerRowIndex: number,
  ignoreRowsForCol0: number = 0,
) {
  ws["!cols"] = calculateColumnWidths(rows, ignoreRowsForCol0);

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell) continue;

      if (R === headerRowIndex) {
        cell.s = { ...HEADER_STYLE };
      } else if (R < headerRowIndex) {
        if (C === 0) {
          cell.s = { ...TITLE_STYLE, alignment: { horizontal: "left" } };
        } else {
          cell.s = { font: { name: "Calibri", sz: 11, bold: true } };
        }
      } else {
        const isNum = typeof cell.v === "number";
        cell.s = {
          ...CELL_STYLE,
          alignment: {
            vertical: "center",
            horizontal: isNum ? "right" : C === 0 ? "center" : "left",
          },
        };
      }
    }
  }

  return ws;
}

/** Buat workbook lengkap untuk Ringkasan Admin: semua babak dan semua juri */
export async function buildOverviewWorkbook(stageFilter?: string) {
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  const [dbStages, judges] = await Promise.all([
    prisma.stage.findMany({ select: { name: true }, orderBy: { id: "asc" } }),
    prisma.user.findMany({
      where: { role: "judge" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const allStageNames = dbStages.map((s) => s.name);

  // Jika stageFilter "Semua" atau tidak dispesifikasikan, tampilkan sheet akumulasi semua babak + sheet tiap babak
  if (!stageFilter || stageFilter === "Semua") {
    // 1. Tab Hasil Semua Babak (Akumulasi Juara: Showcase 30% + Final 70%)
    const overallResults = await getResults("Semua");
    const overallRows = [
      [...ACCUMULATED_RESULT_HEADERS],
      ...accumulatedResultRows(overallResults.teams),
    ];
    const overallWs = XLSX.utils.aoa_to_sheet(overallRows);
    applySheetStyles(overallWs, overallRows, 0);
    XLSX.utils.book_append_sheet(wb, overallWs, sanitizeSheetName("Hasil - Semua Babak", usedSheetNames));

    // 2. Tab Hasil per Babak (Showcase, Final, dll)
    for (const stName of allStageNames) {
      const stageRes = await getResults(stName);
      if (stageRes.teams.length > 0) {
        const isShowcase = stName.toLowerCase() === "showcase";
        const isFinal = stName.toLowerCase() === "final";
        const headers = isShowcase
          ? SHOWCASE_RESULT_HEADERS
          : isFinal
          ? FINAL_RESULT_HEADERS
          : RESULT_HEADERS;
        const rows = isShowcase
          ? showcaseResultRows(stageRes.teams)
          : isFinal
          ? finalResultRows(stageRes.teams)
          : resultRows(stageRes.teams);

        const sRows = [[...headers], ...rows];
        const sWs = XLSX.utils.aoa_to_sheet(sRows);
        applySheetStyles(sWs, sRows, 0);
        XLSX.utils.book_append_sheet(wb, sWs, sanitizeSheetName(`Hasil - ${stName}`, usedSheetNames));
      }
    }
  } else {
    // Babak spesifik yang dipilih
    const stageRes = await getResults(stageFilter);
    const isShowcase = stageFilter.toLowerCase() === "showcase";
    const isFinal = stageFilter.toLowerCase() === "final";
    const headers = isShowcase
      ? SHOWCASE_RESULT_HEADERS
      : isFinal
      ? FINAL_RESULT_HEADERS
      : RESULT_HEADERS;
    const rows = isShowcase
      ? showcaseResultRows(stageRes.teams)
      : isFinal
      ? finalResultRows(stageRes.teams)
      : resultRows(stageRes.teams);

    const sRows = [[...headers], ...rows];
    const sWs = XLSX.utils.aoa_to_sheet(sRows);
    applySheetStyles(sWs, sRows, 0);
    XLSX.utils.book_append_sheet(wb, sWs, sanitizeSheetName(`Hasil - ${stageFilter}`, usedSheetNames));
  }

  // 3. Tab Tiap Juri (mencakup semua babak atau babak aktif)
  const allScores = await prisma.judgeScore.findMany({
    where: stageFilter && stageFilter !== "Semua" ? { stage: stageFilter } : {},
    include: { team: { select: { id: true, name: true, order: true } } },
    orderBy: [{ stage: "asc" }, { team: { order: "asc" } }],
  });

  const scoresByJudge = new Map<string, typeof allScores>();
  for (const s of allScores) {
    if (!scoresByJudge.has(s.judgeId)) scoresByJudge.set(s.judgeId, []);
    scoresByJudge.get(s.judgeId)!.push(s);
  }

  for (const judge of judges) {
    const judgeScores = scoresByJudge.get(judge.id) ?? [];
    const isMultiStage = !stageFilter || stageFilter === "Semua";

    const header = [
      "NO",
      ...(isMultiStage ? ["BABAK"] : []),
      "NAMA PENAMPILAN",
      "KREATIVITAS & ORISINALITAS (30%)",
      "TEKNIS & KUALITAS (30%)",
      "PENGUASAAN PANGGUNG (25%)",
      "KOSTUM ATAU VISUALISASI (15%)",
      "TOTAL NILAI BERBOBOT",
      "CATATAN KOMENTAR",
    ];

    const judgeData: Array<Array<string | number>> = [
      ["BLANKO PENILAIAN JURI — ASTRO GOT TALENT"],
      ["NAMA JURI", `: ${judge.name}`],
      ["EMAIL", `: ${judge.email}`],
      ["BABAK / SESI", `: ${stageFilter && stageFilter !== "Semua" ? stageFilter : "Semua Babak"}`],
      [],
      header,
    ];

    judgeScores.forEach((sc, idx) => {
      const weighted = weightedJudgeScore(sc);
      judgeData.push([
        idx + 1,
        ...(isMultiStage ? [sc.stage] : []),
        sc.team.name,
        sc.kreativitas,
        sc.teknis,
        sc.panggung,
        sc.kostum,
        Math.round(weighted * 100) / 100,
        sc.notes && sc.notes.trim() ? sc.notes : "-",
      ]);
    });

    const jWs = XLSX.utils.aoa_to_sheet(judgeData);
    applySheetStyles(jWs, judgeData, 5, 4);
    XLSX.utils.book_append_sheet(wb, jWs, sanitizeSheetName(`Juri - ${judge.name}`, usedSheetNames));
  }

  return wb;
}

/** Buat workbook khusus untuk 1 Juri */
export async function buildSingleJudgeWorkbook(judgeId: string, stageFilter?: string) {
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  const judge = await prisma.user.findFirst({
    where: { id: judgeId, role: "judge" },
  });
  if (!judge) throw new Error("Juri tidak ditemukan.");

  const isMultiStage = !stageFilter || stageFilter === "Semua";

  const scores = await prisma.judgeScore.findMany({
    where: {
      judgeId,
      ...(stageFilter && stageFilter !== "Semua" ? { stage: stageFilter } : {}),
    },
    include: { team: { select: { id: true, name: true, order: true } } },
    orderBy: [{ stage: "asc" }, { team: { order: "asc" } }],
  });

  const header = [
    "NO",
    ...(isMultiStage ? ["BABAK"] : []),
    "NAMA PENAMPILAN",
    "KREATIVITAS & ORISINALITAS (30%)",
    "TEKNIS & KUALITAS (30%)",
    "PENGUASAAN PANGGUNG (25%)",
    "KOSTUM ATAU VISUALISASI (15%)",
    "TOTAL NILAI BERBOBOT",
    "CATATAN KOMENTAR",
  ];

  const data: Array<Array<string | number>> = [
    ["LEMBAR PENILAIAN JURI — ASTRO GOT TALENT"],
    ["NAMA JURI", `: ${judge.name}`],
    ["EMAIL", `: ${judge.email}`],
    ["BABAK / SESI", `: ${stageFilter && stageFilter !== "Semua" ? stageFilter : "Semua Babak"}`],
    [],
    header,
  ];

  scores.forEach((sc, idx) => {
    const weighted = weightedJudgeScore(sc);
    data.push([
      idx + 1,
      ...(isMultiStage ? [sc.stage] : []),
      sc.team.name,
      sc.kreativitas,
      sc.teknis,
      sc.panggung,
      sc.kostum,
      Math.round(weighted * 100) / 100,
      sc.notes && sc.notes.trim() ? sc.notes : "-",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  applySheetStyles(ws, data, 5, 4);
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(`Juri - ${judge.name}`, usedSheetNames));

  return wb;
}

/** Buat workbook khusus untuk 1 Penampilan (Profil, Nilai Juri, & Rincian Suara Penonton) */
export async function buildSingleTeamWorkbook(teamId: number, stageFilter?: string) {
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  if (!team) throw new Error("Penampilan tidak ditemukan.");

  const selectedStage = stageFilter === "Semua" ? undefined : stageFilter;

  const [judgeScores, ballots, results] = await Promise.all([
    prisma.judgeScore.findMany({
      where: {
        teamId,
        ...(selectedStage ? { stage: selectedStage } : {}),
      },
      include: { judge: { select: { name: true, email: true } } },
      orderBy: [{ stage: "asc" }, { judge: { name: "asc" } }],
    }),
    prisma.ballot.findMany({
      where: {
        teamId,
        votedAt: { not: null },
        ...(selectedStage ? { stage: selectedStage } : {}),
      },
      include: { qr: { select: { tableName: true, label: true } } },
      orderBy: { votedAt: "desc" },
    }),
    getResults(selectedStage),
  ]);

  const teamResult = results.teams.find((t) => t.id === teamId);
  const finalScore = teamResult?.finalScore ?? 0;
  const judgeScore = teamResult?.judgeScore ?? 0;
  const votingScore = teamResult?.votingScore ?? 0;
  const votes = teamResult?.votes ?? ballots.length;

  const isShowcase = selectedStage?.toLowerCase() === "showcase";
  const isFinal = selectedStage?.toLowerCase() === "final";
  const isAll = !selectedStage || selectedStage === "Semua";

  const scoreRows: Array<Array<string | number>> = isShowcase
    ? [
        ["SKOR BABAK SHOWCASE", `: ${finalScore.toFixed(2)} (100% Nilai Juri)`],
        ["BOBOT KE SKOR AKHIR", ": 30%"],
      ]
    : isFinal
    ? [
        ["SKOR BABAK FINAL", `: ${finalScore.toFixed(2)}`],
        ["NILAI JURI (50%)", `: ${judgeScore.toFixed(2)}`],
        ["NILAI VOTING (50%)", `: ${votingScore.toFixed(2)} (${votes} suara)`],
        ["BOBOT KE SKOR AKHIR", ": 70%"],
      ]
    : isAll
    ? [
        ["SKOR AKHIR JUARA (100%)", `: ${finalScore.toFixed(2)}`],
        ["BABAK SHOWCASE (30%)", `: Juri ${(teamResult?.showcaseScore ?? 0).toFixed(2)} (Poin: ${(Math.round((teamResult?.showcaseScore ?? 0) * 30) / 100).toFixed(2)})`],
        ["BABAK FINAL (70%)", `: Babak ${(teamResult?.finalRoundScore ?? 0).toFixed(2)} (Poin: ${(Math.round((teamResult?.finalRoundScore ?? 0) * 70) / 100).toFixed(2)})`],
      ]
    : [
        ["SKOR AKHIR", `: ${finalScore.toFixed(2)}`],
        ["NILAI JURI (50%)", `: ${judgeScore.toFixed(2)}`],
        ["NILAI VOTING (50%)", `: ${votingScore.toFixed(2)} (${votes} suara)`],
      ];

  // TAB 1: Rincian Penilaian & Skor Akhir
  const summaryData: Array<Array<string | number>> = [
    ["RINCIAN PENILAIAN PENAMPILAN — ASTRO GOT TALENT"],
    ["NAMA PENAMPILAN", `: ${team.name}`],
    ["URUTAN TAMPIL", `: #${team.order}`],
    ["ANGGOTA", `: ${formatMembers(team.members)}`],
    ["BABAK / SESI", `: ${selectedStage || "Semua Babak"}`],
    [],
    ...scoreRows,
    [],
    [
      "NO",
      "NAMA JURI",
      "BABAK",
      "KREATIVITAS (30%)",
      "TEKNIS (30%)",
      "PANGGUNG (25%)",
      "KOSTUM (15%)",
      "NILAI BERBOBOT",
      "CATATAN KOMENTAR",
    ],
  ];

  judgeScores.forEach((js, idx) => {
    const weighted = weightedJudgeScore(js);
    summaryData.push([
      idx + 1,
      js.judge.name,
      js.stage,
      js.kreativitas,
      js.teknis,
      js.panggung,
      js.kostum,
      Math.round(weighted * 100) / 100,
      js.notes && js.notes.trim() ? js.notes : "-",
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  applySheetStyles(wsSummary, summaryData, 10, 9);
  XLSX.utils.book_append_sheet(wb, wsSummary, sanitizeSheetName("Penilaian Juri", usedSheetNames));

  // TAB 2: Detail Suara Voting Penonton
  const voteData: Array<Array<string | number>> = [
    ["DETAIL SUARA VOTING PENONTON — ASTRO GOT TALENT"],
    ["NAMA PENAMPILAN", `: ${team.name}`],
    ["TOTAL SUARA", `: ${ballots.length} suara`],
    ["BABAK / SESI", `: ${selectedStage || "Semua Babak"}`],
    [],
    ["NO", "WAKTU VOTE", "LOKASI / BARIS KURSI PENONTON", "BABAK / SESI"],
  ];

  ballots.forEach((b, idx) => {
    voteData.push([
      idx + 1,
      b.votedAt
        ? new Date(b.votedAt).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "-",
      b.qr.label ?? b.qr.tableName ?? "Penonton",
      b.stage,
    ]);
  });

  const wsVotes = XLSX.utils.aoa_to_sheet(voteData);
  applySheetStyles(wsVotes, voteData, 5, 4);
  XLSX.utils.book_append_sheet(wb, wsVotes, sanitizeSheetName("Suara Penonton", usedSheetNames));

  return wb;
}

