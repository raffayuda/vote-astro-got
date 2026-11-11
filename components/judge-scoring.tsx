"use client";

import { useState, useSyncExternalStore } from "react";
import { ScoreForm, type ScoreRecord } from "@/components/score-form";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  CRITERIA,
  weightedJudgeScore,
  type CriteriaScores,
  type CriterionKey,
} from "@/lib/scoring";
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

const PRIVACY_KEY = "astro_judge_privacy";
const PRIVACY_EVENT = "astro-judge-privacy";

function subscribePrivacy(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PRIVACY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PRIVACY_EVENT, callback);
  };
}

function getPrivacySnapshot() {
  try {
    return localStorage.getItem(PRIVACY_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Penilaian juri satu penampilan per layar:
 * - Tab navigasi penampilan + progres kelengkapan
 * - Form preset nilai & catatan, total berbobot, simpan
 * - Ringkasan rata-rata seluruh juri + dialog rincian per juri
 * - Mode privasi untuk menyamarkan angka di layar
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

  // Draft per tim supaya input tidak hilang saat berpindah tab.
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

  const privacyMode = useSyncExternalStore(subscribePrivacy, getPrivacySnapshot, () => false);

  const togglePrivacy = () => {
    try {
      localStorage.setItem(PRIVACY_KEY, privacyMode ? "0" : "1");
      window.dispatchEvent(new Event(PRIVACY_EVENT));
    } catch {}
  };

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
  const activeSummary = teamJudgesSummaries[team.id];
  const breakdownSummary = breakdownTeam ? teamJudgesSummaries[breakdownTeam.id] : undefined;

  const go = (i: number) => {
    setIndex(Math.min(Math.max(i, 0), teams.length - 1));
    document.getElementById("penilaian-tim")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const savedWeightedScores = teams
    .map((t) => {
      const s = initialScores[t.id];
      if (!s || s.kreativitas == null || s.teknis == null || s.panggung == null || s.kostum == null) {
        return null;
      }
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
      : "—";

  return (
    <div className="flex flex-col gap-5">
      {/* Progres & navigasi penampilan */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="text-sm font-bold text-astro-navy">
            {judgeName}
            <span className="ml-2 font-medium text-muted tabular-nums">
              {scoredCount}/{teams.length} dinilai
            </span>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePrivacy}
              aria-pressed={privacyMode}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
                privacyMode
                  ? "border-amber-500/60 bg-amber-50 text-amber-700"
                  : "border-line/60 bg-white text-muted hover:text-astro-navy",
              )}
              title="Samarkan angka nilai di layar dari orang di belakang Anda"
            >
              {privacyMode ? "🔒 Privasi" : "👁 Privasi"}
            </button>
          </div>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-astro-cyan-2/40"
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
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
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
      </Card>

      {/* Penampilan aktif */}
      <Card id="penilaian-tim" className="scroll-mt-4 overflow-hidden p-0 shadow-soft">
        <div className="grid gap-0 md:grid-cols-[240px_1fr]">
          <div className="p-4 pb-0 md:p-5 md:pr-0">
            <div className="relative hidden aspect-square w-full overflow-hidden rounded-2xl border border-line/60 shadow-xs md:block">
              <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-3 top-3 rounded-full bg-astro-gold px-3 py-1 text-xs font-black text-astro-navy shadow-gloss tabular-nums">
                #{index + 1}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-line/60 shadow-xs md:hidden">
                <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="absolute inset-0 h-full w-full" />
                <span className="absolute left-1 top-1 rounded-full bg-astro-gold px-1.5 py-0.5 text-[10px] font-black text-astro-navy shadow-gloss tabular-nums">
                  #{index + 1}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold text-astro-navy">{team.name}</h2>
                {team.members && (
                  <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-astro-blue">{team.members}</p>
                )}
                {team.description && <p className="mt-0.5 text-xs text-muted">{team.description}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-line/60 bg-surface-1 px-3.5 py-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="text-xs font-semibold text-muted">Rata-rata</span>
                <span
                  className={cn(
                    "text-lg font-black text-astro-navy tabular-nums transition-all",
                    privacyMode && "blur-xs hover:blur-none select-none",
                  )}
                  title={privacyMode ? "Arahkan kursor untuk melihat angka" : undefined}
                >
                  {activeSummary?.averageWeightedScore != null
                    ? activeSummary.averageWeightedScore.toFixed(2)
                    : "—"}
                </span>
                <span className="truncate text-xs text-muted tabular-nums">
                  {activeSummary?.judgesScoredCount ?? 0}/{activeSummary?.totalJudgesCount ?? 0} juri
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBreakdownTeam(team)}
                className="h-8 shrink-0 px-2 text-xs text-astro-blue hover:bg-astro-blue/10"
              >
                Rincian
              </Button>
            </div>

            <ScoreForm
              key={`${judgeId}-${stage}-${team.id}`}
              teamId={team.id}
              teamName={team.name}
              stage={stage}
              judgeId={judgeId}
              isOpen={isOpen}
              privacyMode={privacyMode}
              initial={drafts[team.id] ?? initialScores[team.id] ?? null}
              onDraftChange={(values) => setDrafts((d) => ({ ...d, [team.id]: values }))}
            />
          </div>
        </div>
      </Card>

      {/* Navigasi antar penampilan */}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={index === 0} onClick={() => go(index - 1)}>
          ← Sebelumnya
        </Button>
        <p className="text-xs font-semibold text-muted tabular-nums">
          {index + 1} / {teams.length}
        </p>
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

      {/* Rekap seluruh penampilan */}
      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 bg-surface-1 p-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Rekap Penilaian</CardTitle>
            <Badge tone="accent">Babak {stage}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted">Rata-rata Anda</span>
            <span
              className={cn(
                "rounded-full bg-astro-navy/10 px-2.5 py-0.5 font-bold text-astro-navy tabular-nums transition-all",
                privacyMode && "blur-xs select-none hover:blur-none",
              )}
              title={privacyMode ? "Arahkan kursor untuk melihat angka" : undefined}
            >
              {avgMyScore}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-48" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-24" />
              <col />
              <col className="w-24" />
            </colgroup>
            <thead className="border-b border-line/60 bg-astro-navy text-[11px] font-bold uppercase text-white">
              <tr>
                <th className="px-2 py-3 text-center">No</th>
                <th className="px-3 py-3">Penampilan</th>
                {CRITERIA.map((c) => (
                  <th key={c.key} className="px-1 py-3 text-center">
                    {c.label.split(" ")[0]}
                    <span className="block text-[10px] font-normal opacity-80">{c.weight * 100}%</span>
                  </th>
                ))}
                <th className="whitespace-nowrap px-2 py-3 text-center text-astro-gold">Nilai Anda</th>
                <th className="whitespace-nowrap bg-astro-blue/30 px-2 py-3 text-center">Rata-rata Juri</th>
                <th className="px-3 py-3">Catatan</th>
                <th className="px-2 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {teams.map((t, i) => {
                const s = initialScores[t.id];
                const d = drafts[t.id];
                const isSelected = i === index;
                const isSaved = Boolean(s && s.kreativitas != null);
                const tSummary = teamJudgesSummaries[t.id];

                const vals = Object.fromEntries(
                  CRITERIA.map((c) => [
                    c.key,
                    d ? (d[c.key] ?? "") : s?.[c.key] != null ? String(s[c.key]) : "",
                  ]),
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
                  (CRITERIA.some(
                    (c) => vals[c.key] !== (s?.[c.key] != null ? String(s[c.key]) : ""),
                  ) ||
                    valNotes !== (s?.notes ?? ""));

                return (
                  <tr
                    key={t.id}
                    onClick={() => go(i)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected ? "border-l-4 border-astro-blue bg-astro-blue/10" : "hover:bg-astro-cyan-1/25",
                    )}
                  >
                    <td className="px-3.5 py-3 text-center font-bold text-muted tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <TeamAvatar
                          name={t.name}
                          photoUrl={t.photoUrl}
                          className="size-8 shrink-0 rounded-lg text-xs"
                        />
                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-astro-navy">{t.name}</p>
                          {t.members && (
                            <p className="truncate text-xs text-muted">{t.members.split("\n")[0]}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {CRITERIA.map((c) => (
                      <td key={c.key} className="px-3 py-3 text-center font-bold tabular-nums">
                        {vals[c.key] !== "" ? (
                          <span
                            className={cn(
                              "inline-block rounded-md bg-astro-gold/20 px-2 py-0.5 text-xs font-black text-astro-navy transition-all",
                              privacyMode && "blur-xs select-none hover:blur-none",
                            )}
                            title={privacyMode ? "Arahkan kursor untuk melihat nilai" : undefined}
                          >
                            {privacyMode ? "••" : vals[c.key]}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center font-extrabold tabular-nums">
                      {weighted !== null ? (
                        <span
                          className={cn(
                            "text-sm text-astro-blue transition-all",
                            privacyMode && "blur-xs select-none hover:blur-none",
                          )}
                          title={privacyMode ? "Arahkan kursor untuk melihat nilai" : undefined}
                        >
                          {weighted.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="bg-astro-blue/5 px-3 py-3 text-center">
                      <button
                        type="button"
                        title="Lihat rincian nilai seluruh juri"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBreakdownTeam(t);
                        }}
                        className={cn(
                          "mx-auto flex flex-col items-center rounded-lg px-2 py-1 transition-all hover:bg-astro-blue/15",
                          privacyMode && "blur-xs select-none hover:blur-none",
                        )}
                      >
                        <span className="text-sm font-extrabold text-astro-navy tabular-nums">
                          {tSummary?.averageWeightedScore != null
                            ? tSummary.averageWeightedScore.toFixed(2)
                            : "-"}
                        </span>
                        <span className="text-xs font-semibold text-muted tabular-nums">
                          {tSummary?.judgesScoredCount ?? 0}/{tSummary?.totalJudgesCount ?? 0} juri
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {valNotes ? (
                        <p className="max-w-[200px] truncate font-medium text-ink" title={valNotes}>
                          {valNotes}
                        </p>
                      ) : (
                        <span className="italic text-muted/70">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isDirty ? (
                        <Badge tone="accent" title="Perubahan belum disimpan">
                          Draft
                        </Badge>
                      ) : isSaved ? (
                        <Badge tone="success">Tersimpan</Badge>
                      ) : (
                        <Badge tone="neutral">Belum</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rincian nilai seluruh juri */}
      {breakdownTeam && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="breakdown-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-astro-navy/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setBreakdownTeam(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-3xl border-2 border-line bg-white p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3.5">
              <div className="flex items-center gap-3">
                <TeamAvatar
                  name={breakdownTeam.name}
                  photoUrl={breakdownTeam.photoUrl}
                  className="size-12 shrink-0 rounded-xl text-base"
                />
                <div>
                  <h3 id="breakdown-title" className="font-display text-xl font-extrabold text-astro-navy">
                    {breakdownTeam.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">Babak {stage}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBreakdownTeam(null)}
                className="rounded-lg p-1 text-lg font-bold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Tutup rincian"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-astro-navy px-4 py-3 text-white">
              <div>
                <p className="text-[11px] text-white/70">Rata-rata nilai juri</p>
                <p className="font-display text-2xl font-black text-astro-gold tabular-nums">
                  {breakdownSummary?.averageWeightedScore != null
                    ? breakdownSummary.averageWeightedScore.toFixed(2)
                    : "—"}
                </p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                {breakdownSummary?.judgesScoredCount ?? 0}/{breakdownSummary?.totalJudgesCount ?? 0} juri menilai
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-line/60">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line/60 bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted">
                  <tr>
                    <th className="w-36 px-3.5 py-2.5">Juri</th>
                    <th className="px-2.5 py-2.5 text-center">Kreativitas 30%</th>
                    <th className="px-2.5 py-2.5 text-center">Teknis 30%</th>
                    <th className="px-2.5 py-2.5 text-center">Panggung 25%</th>
                    <th className="px-2.5 py-2.5 text-center">Kostum 15%</th>
                    <th className="px-3 py-2.5 text-center font-extrabold text-astro-navy">Nilai</th>
                    <th className="px-3 py-2.5">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {breakdownSummary?.judgeScores.map((js) => (
                    <tr key={js.judgeId} className={cn("transition-colors", js.isMe ? "bg-astro-blue/8" : "hover:bg-surface-1")}>
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-astro-navy">{js.judgeName}</span>
                          {js.isMe && (
                            <span className="rounded-full bg-astro-blue px-2 py-0.5 text-[10px] font-black text-white">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>

                      {[js.kreativitas, js.teknis, js.panggung, js.kostum].map((value, i) => (
                        <td key={i} className="px-2.5 py-3 text-center font-bold text-ink tabular-nums">
                          {js.hasScored ? value : <span className="font-normal text-muted">-</span>}
                        </td>
                      ))}

                      <td className="px-3 py-3 text-center tabular-nums">
                        {js.hasScored ? (
                          <span className="text-sm font-extrabold text-astro-blue">{js.weightedScore?.toFixed(2)}</span>
                        ) : (
                          <span className="text-xs italic text-muted">Belum</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-xs">
                        {js.hasScored && js.notes ? (
                          <p className="font-medium leading-relaxed text-ink">&ldquo;{js.notes}&rdquo;</p>
                        ) : (
                          <span className="italic text-muted/60">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
