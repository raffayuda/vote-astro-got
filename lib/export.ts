import type { TeamResult } from "@/lib/results";

export const RESULT_HEADERS = [
  "Peringkat",
  "Nama Penampilan",
  "Anggota",
  "Suara",
  "Persentase Suara (%)",
  "Jumlah Juri",
  "Nilai Juri",
  "Nilai Voting",
  "Skor Akhir",
] as const;

/** Mengubah baris-baris nama anggota (\n) menjadi dipisahkan koma dan spasi agar terbaca rapi di Excel */
export function formatMembers(members: string | null | undefined): string {
  if (!members) return "-";
  return members
    .split(/\r?\n/)
    .map((m) => m.trim())
    .filter(Boolean)
    .join(", ");
}

export function resultRows(teams: TeamResult[]) {
  return teams.map((t, i) => [
    i + 1,
    t.name,
    formatMembers(t.members),
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
