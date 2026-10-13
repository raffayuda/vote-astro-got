"use client";

import { useState } from "react";
import { saveScore } from "@/app/actions/judge";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CRITERIA, weightedJudgeScore, type CriteriaScores } from "@/lib/scoring";
import { cn } from "@/lib/cn";

function emptyValues(initial?: Partial<Record<string, string | number>> | null): Record<string, string> {
  return Object.fromEntries(CRITERIA.map((c) => [c.key, initial?.[c.key] != null ? String(initial[c.key]) : ""]));
}

/** Form nilai satu tim: slider + angka per kriteria, total berbobot live. */
export function ScoreForm({
  teamId,
  initial,
  onDraftChange,
}: {
  teamId: number;
  initial?: Partial<Record<string, string | number>> | null;
  onDraftChange?: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(initial));

  const set = (key: string, value: string) => {
    // Izinkan kosong (belum diisi); jika angka, jepit 0–100.
    const next = { ...values, [key]: value === "" ? "" : String(Math.min(100, Math.max(0, Number(value) || 0))) };
    setValues(next);
    onDraftChange?.(next);
  };

  const complete = CRITERIA.every((c) => values[c.key] !== "");
  const total = complete
    ? weightedJudgeScore(Object.fromEntries(CRITERIA.map((c) => [c.key, Number(values[c.key])])) as CriteriaScores)
    : null;

  return (
    <ActionForm action={saveScore} className="flex flex-col gap-3">
      <input type="hidden" name="teamId" value={teamId} />
      {CRITERIA.map((c) => (
        <div key={c.key} className="rounded-2xl border border-line/60 bg-astro-cyan-2/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`score-${teamId}-${c.key}`} className="text-sm font-semibold text-astro-navy">
              {c.label}
            </label>
            <span className="shrink-0 rounded-full bg-astro-blue/10 px-2.5 py-0.5 text-xs font-bold text-astro-blue tabular-nums">
              {c.weight * 100}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={`${c.label} (slider)`}
              value={values[c.key] === "" ? 0 : Number(values[c.key])}
              onChange={(e) => set(c.key, e.target.value)}
              className="h-2 flex-1 cursor-pointer accent-astro-blue"
            />
            <input
              id={`score-${teamId}-${c.key}`}
              name={c.key}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              required
              placeholder="0–100"
              value={values[c.key]}
              onChange={(e) => set(c.key, e.target.value)}
              className={cn(
                "h-11 w-24 shrink-0 rounded-xl border-2 border-astro-cyan-2 bg-white px-3 text-center text-base font-bold text-ink tabular-nums",
                "focus:border-astro-blue focus:outline-3 focus:outline-astro-blue/25",
              )}
            />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-astro-navy px-4 py-3 text-white">
        <p className="text-sm text-white/80">
          Nilai berbobot:{" "}
          <strong className="text-xl text-astro-gold tabular-nums">{total === null ? "—" : total.toFixed(2)}</strong>
        </p>
        <SubmitButton size="sm" pendingText="Menyimpan...">Simpan Nilai</SubmitButton>
      </div>
    </ActionForm>
  );
}
