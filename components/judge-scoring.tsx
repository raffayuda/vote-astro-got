"use client";

import { useState } from "react";
import { ScoreForm, type ScoreRecord } from "@/components/score-form";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CRITERIA, weightedJudgeScore, type CriteriaScores } from "@/lib/scoring";
import { cn } from "@/lib/cn";

export type ScoringTeam = {
  id: number;
  name: string;
  members: string | null;
  photoUrl: string;
  description: string | null;
};

/**
 * Penilaian juri satu penampilan per layar:
 * - Tab navigasi penampilan
 * - Preset angka nilai 50, 65, 75, 85, 95
 * - Field Catatan Komentar
 * - Draft terisolasi per stage & reset saat sesi berubah
 * - Perlindungan jika voting ditutup
 * - Tabel rekapitulasi penilaian juri di bawah form
 */
export function JudgeScoring({
  teams,
  initialScores,
  judgeName,
  judgeId,
  stage,
  isOpen = true,
}: {
  teams: ScoringTeam[];
  initialScores: Record<number, ScoreRecord>;
  judgeName: string;
  judgeId: string;
  stage: string;
  isOpen?: boolean;
}) {
  const firstUnscored = teams.findIndex((t) => !initialScores[t.id]);
  const [index, setIndex] = useState(firstUnscored === -1 ? 0 : firstUnscored);

  // Drafts selalu diinisialisasi khusus dari initialScores babak aktif ini
  const [drafts, setDrafts] = useState<Record<number, Record<string, string>>>(() =>
    Object.fromEntries(
      Object.entries(initialScores).map(([teamId, s]) => [
        Number(teamId),
        {
          kreativitas: s.kreativitas != null ? String(s.kreativitas) : "",
          teknis: s.teknis != null ? String(s.teknis) : "",
          panggung: s.panggung != null ? String(s.panggung) : "",
          kostum: s.kostum != null ? String(s.kostum) : "",
          notes: s.notes ?? "",
        },
      ]),
    ),
  );

  if (teams.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">Belum ada penampilan terdaftar di babak {stage}.</p>
      </Card>
    );
  }

  const team = teams[Math.min(index, teams.length - 1)];
  const scoredCount = teams.filter((t) => Boolean(initialScores[t.id])).length;
  const percent = Math.round((scoredCount / teams.length) * 100);
  const nextUnscored = teams.findIndex((t, i) => i !== index && !initialScores[t.id]);

  const go = (i: number) => {
    setIndex(Math.min(Math.max(i, 0), teams.length - 1));
    document.getElementById("penilaian-tim")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Hitung ringkasan rata-rata nilai juri
  const savedWeightedScores = teams
    .map((t) => {
      const s = initialScores[t.id];
      if (!s || s.kreativitas == null || s.teknis == null || s.panggung == null || s.kostum == null) return null;
      return weightedJudgeScore({
        kreativitas: Number(s.kreativitas),
        teknis: Number(s.teknis),
        panggung: Number(s.panggung),
        kostum: Number(s.kostum),
      });
    })
    .filter((w): w is number => w !== null);

  const avgScore =
    savedWeightedScores.length > 0
      ? (savedWeightedScores.reduce((a, b) => a + b, 0) / savedWeightedScores.length).toFixed(2)
      : "-";

  return (
    <div className="flex flex-col gap-6">
      {/* Status Voting Closed Banner jika ditutup */}
      {!isOpen && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-danger/40 bg-danger/10 p-4 text-danger">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-extrabold text-sm sm:text-base">Sesi Voting Sedang Ditutup Panitia</p>
            <p className="text-xs sm:text-sm text-danger/80">
              Penilaian untuk babak {stage} sedang dikunci. Anda tetap dapat meninjau lembar rekapitulasi nilai di bawah, namun input dan simpan nilai dinonaktifkan.
            </p>
          </div>
        </div>
      )}

      {/* Progress & Navigasi Penampilan */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-astro-navy">
              {judgeName} · <span className="tabular-nums">{scoredCount}/{teams.length} penampilan dinilai</span>
            </p>
            <Badge tone="accent" className="text-xs">
              Babak: {stage}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">Kelengkapan:</span>
            <p className="text-sm font-extrabold text-astro-blue tabular-nums">{percent}%</p>
          </div>
        </div>

        <div
          className="h-2.5 overflow-hidden rounded-full bg-astro-cyan-2/40"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-astro-blue to-astro-sky transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Tab Penampilan */}
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pilih penampilan">
          {teams.map((t, i) => {
            const scored = Boolean(initialScores[t.id]);
            const active = i === index;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={(e) => {
                  go(i);
                  e.currentTarget.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
                }}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition",
                  active
                    ? "border-astro-blue bg-astro-blue text-white shadow-soft"
                    : scored
                      ? "border-ok/40 bg-ok/10 text-ok hover:bg-ok/20"
                      : "border-line/60 bg-white text-muted hover:border-astro-blue hover:text-astro-blue",
                )}
              >
                <span className="tabular-nums">#{i + 1}</span>
                <span className="max-w-28 truncate">{t.name}</span>
                {scored && <span aria-label="Sudah dinilai">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          Pilih angka preset (50, 65, 75, 85, 95) untuk setiap kriteria. Bobot: {CRITERIA.map((c) => `${c.label} ${c.weight * 100}%`).join(", ")}. Nilai tersimpan per babak.
        </p>
      </Card>

      {/* Satu Penampilan Aktif yang Sedang Dinilai */}
      <Card id="penilaian-tim" className="scroll-mt-4 overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="p-4 pb-0 md:p-5 md:pb-5 md:pr-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl md:self-start border border-line/60 shadow-xs">
              <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-3 top-3 rounded-full bg-astro-gold px-3 py-1 text-xs font-black text-astro-navy shadow-gloss tabular-nums">
                Penampilan #{index + 1}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-astro-navy">{team.name}</h2>
                {initialScores[team.id] ? (
                  <Badge tone="success">Sudah dinilai ✓</Badge>
                ) : (
                  <Badge tone="neutral">Belum dinilai</Badge>
                )}
              </div>
              {team.members && (
                <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-astro-blue">{team.members}</p>
              )}
              {team.description && <p className="mt-0.5 text-xs text-muted">{team.description}</p>}
            </div>

            <ScoreForm
              key={`${judgeId}-${stage}-${team.id}`}
              teamId={team.id}
              stage={stage}
              judgeId={judgeId}
              isOpen={isOpen}
              initial={drafts[team.id] ?? initialScores[team.id] ?? null}
              onDraftChange={(values) => setDrafts((d) => ({ ...d, [team.id]: values }))}
            />
          </div>
        </div>
      </Card>

      {/* Navigasi Bawah */}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={index === 0} onClick={() => go(index - 1)}>
          ← Sebelumnya
        </Button>
        <p className="text-xs font-semibold text-muted tabular-nums">
          Penampilan {index + 1} dari {teams.length}
        </p>
        <div className="flex gap-2">
          {nextUnscored !== -1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => go(nextUnscored)}>
              Ke belum dinilai →
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={index === teams.length - 1}
            onClick={() => go(index + 1)}
          >
            Berikutnya →
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TABEL REKAPITULASI PENILAIAN JURI (Sesuai Konsep Blanko Gambar 1) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Card className="flex flex-col gap-4 overflow-hidden p-0 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 bg-surface-1 p-5 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>📋 Blanko Rekapitulasi Penilaian Juri</span>
              <Badge tone="accent" className="text-xs">
                Babak: {stage}
              </Badge>
            </CardTitle>
            <p className="mt-1 text-xs text-muted">
              Rekapitulasi seluruh nilai & catatan Anda untuk babak {stage}. Klik baris untuk menilai atau mengubah nilai di atas.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted">Rata-rata Nilai:</span>
            <span className="rounded-full bg-astro-navy/10 px-2.5 py-0.5 font-bold text-astro-navy tabular-nums">
              {avgScore}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line/60 bg-astro-navy text-xs font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-3.5 py-3 text-center w-12">No</th>
                <th className="px-4 py-3 min-w-[180px]">Nama Penampilan</th>
                <th className="px-3 py-3 text-center w-28 whitespace-nowrap">
                  Kreativitas <span className="block text-[10px] font-normal opacity-80">30%</span>
                </th>
                <th className="px-3 py-3 text-center w-28 whitespace-nowrap">
                  Teknis <span className="block text-[10px] font-normal opacity-80">30%</span>
                </th>
                <th className="px-3 py-3 text-center w-28 whitespace-nowrap">
                  Panggung <span className="block text-[10px] font-normal opacity-80">25%</span>
                </th>
                <th className="px-3 py-3 text-center w-28 whitespace-nowrap">
                  Kostum <span className="block text-[10px] font-normal opacity-80">15%</span>
                </th>
                <th className="px-3 py-3 text-center w-32 font-black text-astro-gold whitespace-nowrap">
                  Total Nilai <span className="block text-[10px] font-normal opacity-80">Berbobot</span>
                </th>
                <th className="px-4 py-3 min-w-[200px]">Catatan Komentar</th>
                <th className="px-3 py-3 text-center w-28">Status</th>
                <th className="px-3 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {teams.map((t, i) => {
                const s = initialScores[t.id];
                const d = drafts[t.id];
                const isSelected = i === index;
                const isSaved = Boolean(s && s.kreativitas != null);

                // Ambil nilai dari draft jika ada, atau dari saved score
                const valKreativitas = d?.kreativitas || (s?.kreativitas != null ? String(s.kreativitas) : "");
                const valTeknis = d?.teknis || (s?.teknis != null ? String(s.teknis) : "");
                const valPanggung = d?.panggung || (s?.panggung != null ? String(s.panggung) : "");
                const valKostum = d?.kostum || (s?.kostum != null ? String(s.kostum) : "");
                const valNotes = d?.notes !== undefined ? d.notes : s?.notes || "";

                const hasAllValues =
                  valKreativitas !== "" && valTeknis !== "" && valPanggung !== "" && valKostum !== "";
                const weighted = hasAllValues
                  ? weightedJudgeScore({
                      kreativitas: Number(valKreativitas),
                      teknis: Number(valTeknis),
                      panggung: Number(valPanggung),
                      kostum: Number(valKostum),
                    })
                  : null;

                return (
                  <tr
                    key={t.id}
                    onClick={() => go(i)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected
                        ? "bg-astro-blue/10 border-l-4 border-astro-blue font-medium"
                        : "hover:bg-astro-cyan-1/25",
                    )}
                  >
                    <td className="px-3.5 py-3 text-center font-bold text-muted tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <TeamAvatar
                          name={t.name}
                          photoUrl={t.photoUrl}
                          className="size-8 rounded-lg shrink-0 text-xs"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-astro-navy truncate">{t.name}</p>
                          {t.members && (
                            <p className="text-xs text-muted truncate max-w-[200px]">
                              {t.members.split("\n")[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums">
                      {valKreativitas !== "" ? (
                        <span className="inline-block rounded-md bg-astro-gold/20 px-2 py-0.5 text-xs font-black text-astro-navy">
                          {valKreativitas}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums">
                      {valTeknis !== "" ? (
                        <span className="inline-block rounded-md bg-astro-gold/20 px-2 py-0.5 text-xs font-black text-astro-navy">
                          {valTeknis}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums">
                      {valPanggung !== "" ? (
                        <span className="inline-block rounded-md bg-astro-gold/20 px-2 py-0.5 text-xs font-black text-astro-navy">
                          {valPanggung}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums">
                      {valKostum !== "" ? (
                        <span className="inline-block rounded-md bg-astro-gold/20 px-2 py-0.5 text-xs font-black text-astro-navy">
                          {valKostum}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-black tabular-nums">
                      {weighted !== null ? (
                        <span className="text-sm font-extrabold text-astro-blue">
                          {weighted.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {valNotes ? (
                        <p className="max-w-[240px] truncate text-ink font-medium" title={valNotes}>
                          {valNotes}
                        </p>
                      ) : (
                        <span className="text-muted/70 italic">— Tidak ada catatan —</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isSaved ? (
                        <Badge tone="success" className="text-[11px]">
                          Tersimpan ✓
                        </Badge>
                      ) : hasAllValues ? (
                        <Badge tone="accent" className="text-[11px]">
                          Draft
                        </Badge>
                      ) : (
                        <Badge tone="neutral" className="text-[11px]">
                          Belum
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant={isSelected ? "primary" : isSaved ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => go(i)}
                        className="text-xs h-7 px-2.5"
                      >
                        {isSelected ? "Sedang Dinilai" : isSaved ? "Edit Nilai" : "Nilai →"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
