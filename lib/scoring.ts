export const CRITERIA = [
  { key: "kreativitas", label: "Kreativitas & Orisinalitas", weight: 0.3 },
  { key: "teknis", label: "Teknis & Kualitas", weight: 0.3 },
  { key: "panggung", label: "Penguasaan Panggung", weight: 0.25 },
  { key: "kostum", label: "Kostum / Visualisasi", weight: 0.15 },
] as const;

export const PRESET_SCORES = [50, 65, 75, 85, 95] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type CriteriaScores = Record<CriterionKey, number>;

export const JUDGE_SHARE = 0.5;
export const VOTE_SHARE = 0.5;

/** Bobot kontribusi babak ke Skor Akhir Juara Keseluruhan */
export const SHOWCASE_STAGE_WEIGHT = 0.3; // 30% dari Showcase (murni Juri)
export const FINAL_STAGE_WEIGHT = 0.7; // 70% dari Final (Juri 50% + Voting 50%)

/** Nilai satu juri untuk satu tim = Σ(nilai × bobot). */
export function weightedJudgeScore(scores: CriteriaScores) {
  return CRITERIA.reduce((sum, c) => sum + scores[c.key] * c.weight, 0);
}

/** Nilai voting dinormalisasi: tim dengan suara terbanyak = 100. */
export function votingScore(votes: number, maxVotes: number) {
  return maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
}

/** Skor Akhir Babak Final = (Nilai Juri × 50%) + (Nilai Voting × 50%). */
export function finalScore(judge: number, voting: number) {
  return judge * JUDGE_SHARE + voting * VOTE_SHARE;
}

/** Skor Akhir Juara Akumulasi = (Showcase × 30%) + (Final × 70%). */
export function overallAccumulatedScore(showcaseScore: number, roundFinalScore: number) {
  return showcaseScore * SHOWCASE_STAGE_WEIGHT + roundFinalScore * FINAL_STAGE_WEIGHT;
}
