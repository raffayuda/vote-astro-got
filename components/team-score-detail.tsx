import { TeamAvatar } from "@/components/team-card";
import { CRITERIA, JUDGE_SHARE, VOTE_SHARE } from "@/lib/scoring";
import type { TeamResult } from "@/lib/results";

/** Rincian perhitungan satu tim: voting, nilai tiap juri, rata-rata, dan skor akhir. */
export function TeamScoreDetail({
  team,
  rank,
  totalVotes,
  maxVotes,
}: {
  team: TeamResult;
  rank: number;
  totalVotes: number;
  maxVotes: number;
}) {
  const avg = team.judgeCount > 0 ? team.judgeScore : null;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center gap-3">
        <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="size-12 shrink-0 rounded-xl text-base" />
        <div>
          <p className="font-display font-extrabold text-astro-navy">
            <span className="mr-1 text-muted tabular-nums">#{rank}</span>
            {team.name}
          </p>
          {team.members && (
            <p className="whitespace-pre-line text-xs font-medium text-astro-blue">{team.members}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Voting */}
        <div className="rounded-2xl border border-line/60 bg-white p-4">
          <p className="font-display font-bold text-astro-navy">Rincian Voting</p>
          <dl className="mt-2 flex flex-col gap-1 tabular-nums">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Suara tim ini</dt>
              <dd className="font-bold text-ink">{team.votes}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Suara tim lain</dt>
              <dd className="font-bold text-ink">{totalVotes - team.votes}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Total suara masuk (semua tim)</dt>
              <dd className="font-bold text-ink">{totalVotes}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Suara terbanyak (normalisasi)</dt>
              <dd className="font-bold text-ink">{maxVotes}</dd>
            </div>
          </dl>
          <p className="mt-2 rounded-xl bg-astro-cyan-2/20 px-3 py-2 font-medium text-astro-navy tabular-nums">
            Voting = {team.votes}/{Math.max(maxVotes, 1)} × 100 = <strong>{team.votingScore.toFixed(2)}</strong>
          </p>
        </div>

        {/* Juri */}
        <div className="rounded-2xl border border-line/60 bg-white p-4">
          <p className="font-display font-bold text-astro-navy">Nilai Juri ({team.judgeCount})</p>
          {team.judges.length === 0 ? (
            <p className="mt-2 text-muted">Belum ada juri yang menilai tim ini.</p>
          ) : (
            <>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="text-muted">
                    <tr>
                      <th className="py-1 pr-2 font-semibold">Juri</th>
                      {CRITERIA.map((c) => (
                        <th key={c.key} className="px-1 py-1 text-right font-semibold" title={`${c.label} (${c.weight * 100}%)`}>
                          {c.label.split(" ").slice(0, 1)}
                        </th>
                      ))}
                      <th className="py-1 pl-2 text-right font-semibold">Bobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {team.judges.map((j) => (
                      <tr key={j.judgeId}>
                        <td className="max-w-24 truncate py-1.5 pr-2 font-medium text-ink">{j.judgeName}</td>
                        <td className="px-1 py-1.5 text-right">{j.kreativitas}</td>
                        <td className="px-1 py-1.5 text-right">{j.teknis}</td>
                        <td className="px-1 py-1.5 text-right">{j.panggung}</td>
                        <td className="px-1 py-1.5 text-right">{j.kostum}</td>
                        <td className="py-1.5 pl-2 text-right font-bold text-astro-blue">{j.weighted.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted">
                Kolom: Kreativitas, Teknis, Panggung, Kostum. Berbobot = Σ(nilai × bobot).
              </p>
              <p className="mt-1 rounded-xl bg-astro-cyan-2/20 px-3 py-2 font-medium text-astro-navy tabular-nums">
                Rata-rata juri = ({team.judges.map((j) => j.weighted.toFixed(2)).join(" + ")}) / {team.judgeCount}{" "}
                = <strong>{team.judgeScore.toFixed(2)}</strong>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Skor akhir */}
      <p className="rounded-2xl bg-astro-navy px-4 py-3 font-medium text-white tabular-nums">
        Skor Akhir = {avg !== null ? avg.toFixed(2) : "0.00"} × {JUDGE_SHARE * 100}% + {team.votingScore.toFixed(2)} ×{" "}
        {VOTE_SHARE * 100}% = <strong className="text-xl text-astro-gold">{team.finalScore.toFixed(2)}</strong>
      </p>
    </div>
  );
}
