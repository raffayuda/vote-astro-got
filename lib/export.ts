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

export const ACCUMULATED_RESULT_HEADERS = [
  "Peringkat",
  "Nama Penampilan",
  "Anggota",
  "Nilai Juri Showcase",
  "Bobot Showcase (30%)",
  "Nilai Juri Final",
  "Suara Final",
  "Nilai Voting Final",
  "Skor Babak Final",
  "Bobot Final (70%)",
  "Skor Akhir Juara (100%)",
] as const;

export const SHOWCASE_RESULT_HEADERS = [
  "Peringkat",
  "Nama Penampilan",
  "Anggota",
  "Jumlah Juri",
  "Nilai Juri Showcase",
  "Bobot ke Skor Akhir Juara (30%)",
] as const;

export const FINAL_RESULT_HEADERS = [
  "Peringkat",
  "Nama Penampilan",
  "Anggota",
  "Suara",
  "Persentase Suara (%)",
  "Jumlah Juri",
  "Nilai Juri (50%)",
  "Nilai Voting (50%)",
  "Skor Babak Final",
  "Bobot ke Skor Akhir Juara (70%)",
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

export function round(n: number): number {
  return Math.round(n * 100) / 100;
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

export function accumulatedResultRows(teams: TeamResult[]) {
  return teams.map((t, i) => {
    const showcase = t.showcaseScore ?? 0;
    const showcase30 = round(showcase * 0.3);
    const finalJudge = t.finalJudgeScore ?? t.judgeScore ?? 0;
    const finalVotes = t.finalVotes ?? t.votes ?? 0;
    const finalVoting = t.finalVotingScore ?? t.votingScore ?? 0;
    const finalRound = t.finalRoundScore ?? 0;
    const final70 = round(finalRound * 0.7);
    const totalAccumulated = round(t.finalScore);

    return [
      i + 1,
      t.name,
      formatMembers(t.members),
      round(showcase),
      showcase30,
      round(finalJudge),
      finalVotes,
      round(finalVoting),
      round(finalRound),
      final70,
      totalAccumulated,
    ];
  });
}

export function showcaseResultRows(teams: TeamResult[]) {
  return teams.map((t, i) => [
    i + 1,
    t.name,
    formatMembers(t.members),
    t.judgeCount,
    round(t.judgeScore),
    round(t.judgeScore * 0.3),
  ]);
}

export function finalResultRows(teams: TeamResult[]) {
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
    round(t.finalScore * 0.7),
  ]);
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV dengan BOM agar langsung terbaca benar di Excel. */
export function toCsv(headers: readonly string[], rows: Array<Array<string | number>>) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return "\uFEFF" + lines.join("\r\n");
}
