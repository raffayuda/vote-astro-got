export const CRITERIA = [
  { key: "kreativitas", label: "Kreativitas dan Orisinalitas", weight: 0.3 },
  { key: "teknis", label: "Teknis dan Kualitas", weight: 0.3 },
  { key: "panggung", label: "Penguasaan Panggung", weight: 0.25 },
  { key: "kostum", label: "Kostum / Visualisasi", weight: 0.15 },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type CriteriaScores = Record<CriterionKey, number>;

export const JUDGE_SHARE = 0.5;
export const VOTE_SHARE = 0.5;

/** Nilai satu juri untuk satu tim = Σ(nilai × bobot). */
export function weightedJudgeScore(scores: CriteriaScores) {
  return CRITERIA.reduce((sum, c) => sum + scores[c.key] * c.weight, 0);
}

/** Nilai voting dinormalisasi: tim dengan suara terbanyak = 100. */
export function votingScore(votes: number, maxVotes: number) {
  return maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
}

/** Skor Akhir = (Nilai Juri × 50%) + (Nilai Voting × 50%). */
export function finalScore(judge: number, voting: number) {
  return judge * JUDGE_SHARE + voting * VOTE_SHARE;
}
