import type { TeamResult } from "@/lib/results";

export const RESULT_HEADERS = [
  "Peringkat",
  "Tim",
  "Suara",
  "Persentase Suara (%)",
  "Jumlah Juri",
  "Nilai Juri",
  "Nilai Voting",
  "Skor Akhir",
] as const;

export function resultRows(teams: TeamResult[]) {
  return teams.map((t, i) => [
    i + 1,
    t.name,
    t.votes,
    round(t.votePercent),
    t.judgeCount,
    round(t.judgeScore),
    round(t.votingScore),
    round(t.finalScore),
  ]);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV dengan BOM agar langsung terbaca benar di Excel. */
export function toCsv(headers: readonly string[], rows: Array<Array<string | number>>) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n");
}
