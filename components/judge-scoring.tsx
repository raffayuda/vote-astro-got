"use client";

import { useState } from "react";
import { ScoreForm } from "@/components/score-form";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CRITERIA } from "@/lib/scoring";
import { cn } from "@/lib/cn";

export type ScoringTeam = {
  id: number;
  name: string;
  members: string | null;
  photoUrl: string;
  description: string | null;
};

/**
 * Penilaian juri satu tim per layar: progress bar, chip navigasi antar tim,
 * dan tombol Sebelumnya/Berikutnya — tanpa scroll vertikal panjang.
 * Draft nilai tiap tim disimpan saat berpindah, tidak hilang sebelum disimpan.
 */
export function JudgeScoring({
  teams,
  initialScores,
  judgeName,
}: {
  teams: ScoringTeam[];
  initialScores: Record<number, Partial<Record<string, string | number>>>;
  judgeName: string;
}) {
  const firstUnscored = teams.findIndex((t) => !initialScores[t.id]);
  const [index, setIndex] = useState(firstUnscored === -1 ? 0 : firstUnscored);
  const [drafts, setDrafts] = useState<Record<number, Record<string, string>>>(() =>
    Object.fromEntries(
      Object.entries(initialScores).map(([teamId, s]) => [
        Number(teamId),
        Object.fromEntries(CRITERIA.map((c) => [c.key, s[c.key] != null ? String(s[c.key]) : ""])),
      ]),
    ),
  );

  if (teams.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">Belum ada tim untuk dinilai.</p>
      </Card>
    );
  }

  const team = teams[Math.min(index, teams.length - 1)];
  const scoredCount = teams.filter((t) => initialScores[t.id]).length;
  const percent = Math.round((scoredCount / teams.length) * 100);
  const nextUnscored = teams.findIndex((t, i) => i !== index && !initialScores[t.id]);

  const go = (i: number) => {
    setIndex(Math.min(Math.max(i, 0), teams.length - 1));
    document.getElementById("penilaian-tim")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Progress + navigasi tim */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-astro-navy">
            {judgeName} · <span className="tabular-nums">{scoredCount}/{teams.length} tim dinilai</span>
          </p>
          <p className="text-sm font-extrabold text-astro-blue tabular-nums">{percent}%</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-astro-cyan-2/40" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-linear-to-r from-astro-blue to-astro-sky transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pilih tim">
          {teams.map((t, i) => {
            const scored = !!initialScores[t.id];
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
          Nilai 0–100 per kriteria. Bobot: {CRITERIA.map((c) => `${c.label} ${c.weight * 100}%`).join(", ")}. Nilai bisa diubah kapan saja.
        </p>
      </Card>

      {/* Satu tim aktif */}
      <Card id="penilaian-tim" className="scroll-mt-4 overflow-hidden p-0">
        <div className="grid md:grid-cols-[240px_1fr]">
          <div className="relative h-52 md:h-auto md:min-h-full">
            <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="absolute inset-0 h-full w-full" />
            <span className="absolute left-3 top-3 rounded-full bg-astro-gold px-3 py-1 text-xs font-extrabold text-astro-navy shadow-gloss tabular-nums">
              Peserta #{index + 1}
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-astro-navy">{team.name}</h2>
                {initialScores[team.id] && <Badge tone="success">Sudah dinilai ✓</Badge>}
              </div>
              {team.members && <p className="mt-0.5 whitespace-pre-line text-sm font-medium text-astro-blue">{team.members}</p>}
              {team.description && <p className="mt-0.5 text-sm text-muted">{team.description}</p>}
            </div>
            <ScoreForm
              key={team.id}
              teamId={team.id}
              initial={drafts[team.id] ?? initialScores[team.id] ?? null}
              onDraftChange={(values) => setDrafts((d) => ({ ...d, [team.id]: values }))}
            />
          </div>
        </div>
      </Card>

      {/* Navigasi bawah */}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={index === 0} onClick={() => go(index - 1)}>
          ← Sebelumnya
        </Button>
        <p className="text-xs font-semibold text-muted tabular-nums">
          Tim {index + 1} dari {teams.length}
        </p>
        <div className="flex gap-2">
          {nextUnscored !== -1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => go(nextUnscored)}>
              Ke belum dinilai →
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" disabled={index === teams.length - 1} onClick={() => go(index + 1)}>
            Berikutnya →
          </Button>
        </div>
      </div>
    </div>
  );
}
