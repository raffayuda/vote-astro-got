"use client";

import { useState } from "react";
import { ScoreForm, type ScoreRecord } from "@/components/score-form";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CRITERIA, PRESET_SCORES, weightedJudgeScore, type CriteriaScores, type CriterionKey } from "@/lib/scoring";
import { cn } from "@/lib/cn";

export type ScoringTeam = {
  id: number;
  name: string;
  members: string | null;
  photoUrl: string;
  description: string | null;
};

export type JudgeDetailScore = {
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  isMe: boolean;
  hasScored: boolean;
  kreativitas?: number;
  teknis?: number;
  panggung?: number;
  kostum?: number;
  weightedScore?: number;
  notes?: string;
};

export type TeamJudgesSummary = {
  teamId: number;
  averageWeightedScore: number | null; // e.g. 83.67
  judgesScoredCount: number; // e.g. 3
  totalJudgesCount: number; // e.g. 3
  judgeScores: JudgeDetailScore[];
};

/**
 * Penilaian juri satu penampilan per layar:
 * - Tab navigasi penampilan
 * - Preset angka nilai 50, 65, 75, 85, 95
 * - Field Catatan Komentar
 * - Toast notifikasi saat simpan nilai
 * - Tampilan rata-rata dari hasil keseluruhan nilai juri (misal: 83.67 (3))
 * - Rincian nilai dan komentar dari setiap juri untuk setiap penampilan
 * - Draft terisolasi per stage & reset saat sesi/juri berubah
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
  teamJudgesSummaries = {},
}: {
  teams: ScoringTeam[];
  initialScores: Record<number, ScoreRecord>;
  judgeName: string;
  judgeId: string;
  stage: string;
  isOpen?: boolean;
  teamJudgesSummaries?: Record<number, TeamJudgesSummary>;
}) {
  const firstUnscored = teams.findIndex((t) => !initialScores[t.id]);
  const [index, setIndex] = useState(firstUnscored === -1 ? 0 : firstUnscored);
  const [breakdownTeam, setBreakdownTeam] = useState<ScoringTeam | null>(null);

  // Drafts selalu diinisialisasi khusus dari initialScores babak aktif juri ini
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
  const activeSummary = teamJudgesSummaries[team.id];

  const go = (i: number) => {
    setIndex(Math.min(Math.max(i, 0), teams.length - 1));
    document.getElementById("penilaian-tim")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Hitung ringkasan rata-rata nilai juri yang sedang login
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

  const avgMyScore =
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
            <span className="text-xs font-semibold text-muted">Kelengkapan Anda:</span>
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
            const tSummary = teamJudgesSummaries[t.id];
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
                {tSummary?.averageWeightedScore != null && (
                  <span className="text-[10px] opacity-75 font-semibold">
                    ({tSummary.averageWeightedScore.toFixed(1)})
                  </span>
                )}
                {scored && <span aria-label="Sudah dinilai">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          Pilih angka preset ({PRESET_SCORES.join(", ")}) untuk setiap kriteria. Bobot: {CRITERIA.map((c) => `${c.label} ${c.weight * 100}%`).join(", ")}. Nilai tersimpan per babak.
        </p>
      </Card>

      {/* Satu Penampilan Aktif yang Sedang Dinilai */}
      <Card id="penilaian-tim" className="scroll-mt-4 overflow-hidden p-0 shadow-soft">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="p-4 pb-0 md:p-5 md:pb-5 md:pr-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl md:self-start border border-line/60 shadow-xs">
              <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-3 top-3 rounded-full bg-astro-gold px-3 py-1 text-xs font-black text-astro-navy shadow-gloss tabular-nums">
                Penampilan #{index + 1}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-astro-navy">{team.name}</h2>
                {initialScores[team.id] ? (
                  <Badge tone="success">Sudah Anda nilai ✓</Badge>
                ) : (
                  <Badge tone="neutral">Belum Anda nilai</Badge>
                )}
              </div>
              {team.members && (
                <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-astro-blue">{team.members}</p>
              )}
              {team.description && <p className="mt-0.5 text-xs text-muted">{team.description}</p>}
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* FITUR BARU: REKAPITULASI NILAI SELURUH JURI UNTUK TIM INI     */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border-2 border-astro-blue/25 bg-astro-blue/5 p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-astro-blue/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-astro-navy">
                    ⭐ Rekap Nilai Juri — {team.name}
                  </span>
                  <Badge tone="accent" className="text-xs">
                    Babak: {stage}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-bold">Rata-rata Keseluruhan:</span>
                  <span className="rounded-full bg-astro-navy px-2.5 py-0.5 text-xs font-black text-astro-gold tabular-nums">
                    {activeSummary?.averageWeightedScore != null
                      ? activeSummary.averageWeightedScore.toFixed(2)
                      : "—"}{" "}
                    <span className="text-[10px] text-white/80 font-normal">
                      ({activeSummary?.judgesScoredCount ?? 0} dari {activeSummary?.totalJudgesCount ?? 0} juri)
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBreakdownTeam(team)}
                    className="h-7 px-2 text-xs text-astro-blue hover:bg-astro-blue/10"
                  >
                    Rincian Lengkap →
                  </Button>
                </div>
              </div>

              {/* Grid nilai masing-masing juri untuk penampilan ini */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeSummary?.judgeScores.map((js) => (
                  <div
                    key={js.judgeId}
                    className={cn(
                      "rounded-xl border p-3 flex flex-col justify-between gap-1.5 transition-all",
                      js.isMe
                        ? "border-astro-blue/60 bg-white shadow-xs ring-1 ring-astro-blue/20"
                        : "border-line/70 bg-white/80 hover:bg-white",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-bold text-xs text-astro-navy truncate">
                        {js.judgeName}{" "}
                        {js.isMe && (
                          <span className="text-astro-blue font-extrabold text-[11px]">(Anda)</span>
                        )}
                      </p>
                      {js.hasScored ? (
                        <span className="rounded-md bg-astro-gold/25 px-2 py-0.5 text-xs font-black text-astro-navy tabular-nums">
                          {js.weightedScore?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted font-medium italic">Belum menilai</span>
                      )}
                    </div>

                    {js.hasScored && (
                      <div className="flex flex-col gap-1 border-t border-line/40 pt-1.5">
                        <div className="flex items-center justify-between text-[10px] text-muted tabular-nums font-semibold">
                          <span>Kr: {js.kreativitas}</span>
                          <span>Tk: {js.teknis}</span>
                          <span>Pg: {js.panggung}</span>
                          <span>Ks: {js.kostum}</span>
                        </div>
                        {js.notes ? (
                          <p className="text-[11px] text-ink/80 italic truncate font-medium" title={js.notes}>
                            &ldquo;{js.notes}&rdquo;
                          </p>
                        ) : (
                          <span className="text-[10px] text-muted/60 italic">— Tanpa catatan —</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Formulir Input Nilai */}
            <ScoreForm
              key={`${judgeId}-${stage}-${team.id}`}
              teamId={team.id}
              teamName={team.name}
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
      {/* TABEL REKAPITULASI PENILAIAN JURI (Sesuai Konsep Blanko Gambar 1 & 3) */}
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
              Rekapitulasi nilai Anda & rata-rata seluruh juri untuk babak {stage}. Klik baris untuk menilai atau mengubah nilai di atas.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted">Rata-rata Nilai Anda:</span>
            <span className="rounded-full bg-astro-navy/10 px-2.5 py-0.5 font-bold text-astro-navy tabular-nums">
              {avgMyScore}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line/60 bg-astro-navy text-xs font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="px-3.5 py-3 text-center w-12">No</th>
                <th className="px-4 py-3 min-w-[180px]">Nama Penampilan</th>
                {CRITERIA.map((c) => (
                  <th key={c.key} className="px-3 py-3 text-center w-24 whitespace-nowrap">
                    {c.label.split(" ")[0]}{" "}
                    <span className="block text-[10px] font-normal opacity-80">{c.weight * 100}%</span>
                  </th>
                ))}
                <th className="px-3 py-3 text-center w-28 font-black text-astro-gold whitespace-nowrap">
                  Nilai Anda <span className="block text-[10px] font-normal opacity-80">(Berbobot)</span>
                </th>

                {/* KOLOM RATA-RATA SEMUA JURI (Sesuai Gambar 3: 83.67 (3)) */}
                <th className="px-3 py-3 text-center w-28 whitespace-nowrap bg-astro-blue/30 font-black text-white">
                  JURI <span className="block text-[10px] font-normal opacity-90">Rata-rata (Jml)</span>
                </th>

                <th className="px-4 py-3 min-w-[180px]">Catatan Komentar Anda</th>
                <th className="px-3 py-3 text-center w-24">Status Anda</th>
                <th className="px-3 py-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {teams.map((t, i) => {
                const s = initialScores[t.id];
                const d = drafts[t.id];
                const isSelected = i === index;
                const isSaved = Boolean(s && s.kreativitas != null);
                const tSummary = teamJudgesSummaries[t.id];

                // Nilai dari draft (jika ada) atau dari nilai tersimpan
                const savedVal = (k: CriterionKey) => (s?.[k] != null ? String(s[k]) : "");
                const vals = Object.fromEntries(
                  CRITERIA.map((c) => [c.key, d ? (d[c.key] ?? "") : savedVal(c.key)]),
                ) as Record<CriterionKey, string>;
                const valNotes = d?.notes !== undefined ? d.notes : s?.notes || "";

                const hasAllValues = CRITERIA.every((c) => vals[c.key] !== "");
                const weighted = hasAllValues
                  ? weightedJudgeScore(
                      Object.fromEntries(CRITERIA.map((c) => [c.key, Number(vals[c.key])])) as CriteriaScores,
                    )
                  : null;
                const isDirty =
                  isSaved &&
                  (CRITERIA.some((c) => vals[c.key] !== savedVal(c.key)) || valNotes !== (s?.notes ?? ""));

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
                            <p className="text-xs text-muted truncate max-w-[180px]">
                              {t.members.split("\n")[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {CRITERIA.map((c) => (
                      <td key={c.key} className="px-3 py-3 text-center font-bold tabular-nums">
                        {vals[c.key] !== "" ? (
                          <span className="inline-block rounded-md bg-astro-gold/20 px-2 py-0.5 text-xs font-black text-astro-navy">
                            {vals[c.key]}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center font-black tabular-nums">
                      {weighted !== null ? (
                        <span className="text-sm font-extrabold text-astro-blue">
                          {weighted.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>

                    {/* CELL RATA-RATA SEMUA JURI (Format: 83.67 (3)) */}
                    <td
                      className="px-3 py-3 text-center bg-astro-blue/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBreakdownTeam(t);
                      }}
                    >
                      <button
                        type="button"
                        title="Klik untuk melihat rincian nilai seluruh juri"
                        className="group flex flex-col items-center justify-center mx-auto rounded-lg px-2 py-1 transition-all hover:bg-astro-blue/15"
                      >
                        <span className="font-extrabold text-astro-navy group-hover:text-astro-blue tabular-nums text-sm">
                          {tSummary?.averageWeightedScore != null
                            ? tSummary.averageWeightedScore.toFixed(2)
                            : "-"}
                        </span>
                        <span className="text-xs font-semibold text-muted group-hover:text-astro-navy tabular-nums">
                          ({tSummary?.judgesScoredCount ?? 0})
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {valNotes ? (
                        <p className="max-w-[200px] truncate text-ink font-medium" title={valNotes}>
                          {valNotes}
                        </p>
                      ) : (
                        <span className="text-muted/70 italic">— Tidak ada catatan —</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isDirty ? (
                        <Badge tone="accent" className="text-[11px]" title="Ada perubahan yang belum disimpan">
                          Belum disimpan
                        </Badge>
                      ) : isSaved ? (
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
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant={isSelected ? "primary" : isSaved ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => go(i)}
                          className="text-xs h-7 px-2"
                        >
                          {isSelected ? "Sedang Dinilai" : isSaved ? "Edit" : "Nilai →"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBreakdownTeam(t)}
                          title="Lihat rincian nilai seluruh juri untuk penampilan ini"
                          className="text-xs h-7 px-2 text-astro-blue hover:bg-astro-blue/10"
                        >
                          👁️ Rincian
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL DIALOG: RINCIAN PENILAIAN SELURUH JURI UNTUK SATU TIM   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {breakdownTeam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-astro-navy/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setBreakdownTeam(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border-2 border-line bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dialog */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/60 pb-3.5">
              <div className="flex items-center gap-3">
                <TeamAvatar
                  name={breakdownTeam.name}
                  photoUrl={breakdownTeam.photoUrl}
                  className="size-12 rounded-xl text-base shrink-0"
                />
                <div>
                  <h3 className="font-display text-xl font-extrabold text-astro-navy">
                    {breakdownTeam.name}
                  </h3>
                  {breakdownTeam.members && (
                    <p className="text-xs font-semibold text-astro-blue mt-0.5">
                      {breakdownTeam.members.replace(/\n/g, ", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    Rincian Penilaian Seluruh Juri · Babak <strong className="text-astro-navy">{stage}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBreakdownTeam(null)}
                className="text-muted hover:text-ink font-bold text-lg p-1 rounded-lg hover:bg-surface-2 transition-colors"
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            {/* Statistik Rata-rata */}
            {(() => {
              const summary = teamJudgesSummaries[breakdownTeam.id];
              return (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-astro-navy p-4 text-white shadow-soft">
                  <div>
                    <p className="text-xs text-white/70">Rata-rata Nilai Berbobot Semua Juri:</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl sm:text-3xl font-black text-astro-gold tabular-nums">
                        {summary?.averageWeightedScore != null
                          ? summary.averageWeightedScore.toFixed(2)
                          : "Belum ada nilai"}
                      </span>
                      {summary?.averageWeightedScore != null && (
                        <span className="text-xs text-white/70">
                          (Dari {summary.judgesScoredCount} juri yang sudah menilai)
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge tone={summary?.judgesScoredCount === summary?.totalJudgesCount ? "success" : "accent"}>
                    {summary?.judgesScoredCount ?? 0} dari {summary?.totalJudgesCount ?? 0} Juri Telah Menilai
                  </Badge>
                </div>
              );
            })()}

            {/* Tabel Penilaian Tiap Juri */}
            <div className="overflow-x-auto rounded-2xl border border-line/60">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted border-b border-line/60">
                  <tr>
                    <th className="px-3.5 py-2.5">Nama Juri</th>
                    <th className="px-2.5 py-2.5 text-center">Kreativitas (30%)</th>
                    <th className="px-2.5 py-2.5 text-center">Teknis (30%)</th>
                    <th className="px-2.5 py-2.5 text-center">Panggung (25%)</th>
                    <th className="px-2.5 py-2.5 text-center">Kostum (15%)</th>
                    <th className="px-3 py-2.5 text-center font-extrabold text-astro-navy">Nilai Berbobot</th>
                    <th className="px-3 py-2.5">Catatan Komentar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {teamJudgesSummaries[breakdownTeam.id]?.judgeScores.map((js) => (
                    <tr
                      key={js.judgeId}
                      className={cn(
                        "transition-colors",
                        js.isMe ? "bg-astro-blue/8 font-medium" : "hover:bg-surface-1",
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-astro-navy">{js.judgeName}</span>
                          {js.isMe && (
                            <span className="rounded-full bg-astro-blue text-white px-2 py-0.2 text-[10px] font-black">
                              Anda
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted">{js.judgeEmail}</span>
                      </td>

                      <td className="px-2.5 py-3 text-center tabular-nums">
                        {js.hasScored ? (
                          <span className="font-bold text-ink">{js.kreativitas}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-2.5 py-3 text-center tabular-nums">
                        {js.hasScored ? (
                          <span className="font-bold text-ink">{js.teknis}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-2.5 py-3 text-center tabular-nums">
                        {js.hasScored ? (
                          <span className="font-bold text-ink">{js.panggung}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-2.5 py-3 text-center tabular-nums">
                        {js.hasScored ? (
                          <span className="font-bold text-ink">{js.kostum}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center tabular-nums font-black">
                        {js.hasScored ? (
                          <span className="text-sm font-extrabold text-astro-blue">
                            {js.weightedScore?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs italic font-normal">Belum menilai</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-xs">
                        {js.hasScored && js.notes ? (
                          <p className="text-ink leading-relaxed font-medium">&ldquo;{js.notes}&rdquo;</p>
                        ) : js.hasScored ? (
                          <span className="text-muted/60 italic">— Tidak ada catatan —</span>
                        ) : (
                          <span className="text-muted/40 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setBreakdownTeam(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
