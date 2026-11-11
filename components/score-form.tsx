"use client";

import { useState, useId } from "react";
import { saveScore } from "@/app/actions/judge";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/ui/toast";
import { CRITERIA, PRESET_SCORES, weightedJudgeScore, type CriteriaScores } from "@/lib/scoring";
import { cn } from "@/lib/cn";

export type ScoreRecord = {
  kreativitas?: number | string;
  teknis?: number | string;
  panggung?: number | string;
  kostum?: number | string;
  notes?: string;
};

function emptyValues(initial?: ScoreRecord | null): Record<string, string> {
  const res: Record<string, string> = {};
  for (const c of CRITERIA) {
    const val = initial?.[c.key];
    res[c.key] = val != null && val !== "" ? String(val) : "";
  }
  res["notes"] = typeof initial?.notes === "string" ? initial.notes : "";
  return res;
}

/** Form penilaian satu penampilan: preset nilai per kriteria + catatan komentar. */
export function ScoreForm({
  teamId,
  teamName,
  stage,
  judgeId,
  isOpen = true,
  privacyMode = false,
  initial,
  onDraftChange,
}: {
  teamId: number;
  teamName?: string;
  stage: string;
  judgeId?: string;
  isOpen?: boolean;
  privacyMode?: boolean;
  initial?: ScoreRecord | null;
  onDraftChange?: (values: Record<string, string>) => void;
}) {
  const formKey = `${judgeId || ""}-${stage}-${teamId}`;
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(initial));
  const notesId = useId();

  const setCriterionScore = (key: string, num: number) => {
    if (!isOpen) return;
    const next = { ...values, [key]: String(num) };
    setValues(next);
    onDraftChange?.(next);
  };

  const handleNotesChange = (text: string) => {
    if (!isOpen) return;
    const next = { ...values, notes: text };
    setValues(next);
    onDraftChange?.(next);
  };

  const resetSelection = () => {
    if (!isOpen) return;
    const empty: Record<string, string> = { notes: "" };
    for (const c of CRITERIA) empty[c.key] = "";
    setValues(empty);
    onDraftChange?.(empty);
  };

  const complete = CRITERIA.every((c) => values[c.key] !== "" && values[c.key] != null);
  const total = complete
    ? weightedJudgeScore(
        Object.fromEntries(CRITERIA.map((c) => [c.key, Number(values[c.key])])) as CriteriaScores,
      )
    : null;
  const hasInput = CRITERIA.some((c) => values[c.key]) || Boolean(values.notes);

  return (
    <ActionForm
      key={formKey}
      action={saveScore}
      className="flex flex-col gap-3"
      onSuccess={(res) => {
        toast.success("Nilai tersimpan", {
          description:
            res?.message || `Nilai babak ${stage} untuk "${teamName || "penampilan ini"}" berhasil disimpan.`,
        });
      }}
      onError={(res) => {
        toast.error("Gagal menyimpan", {
          description: res?.error || "Terjadi kesalahan saat menyimpan nilai.",
        });
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        {CRITERIA.map((c) => {
          const selectedVal = values[c.key];
          const hasCustomOldScore =
            selectedVal !== "" && !PRESET_SCORES.some((p) => String(p) === selectedVal);

          return (
            <div
              key={c.key}
              className={cn(
                "rounded-2xl border p-3 transition-colors",
                selectedVal !== ""
                  ? "border-astro-blue/50 bg-astro-blue/5"
                  : "border-line/60 bg-white",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-astro-navy sm:text-sm">{c.label}</span>
                <span className="text-[11px] font-semibold text-muted">{c.weight * 100}%</span>
              </div>

              <input type="hidden" name={c.key} value={selectedVal} />

              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {PRESET_SCORES.map((preset) => {
                  const isSelected = selectedVal === String(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={!isOpen}
                      aria-pressed={isSelected}
                      aria-label={`${c.label}: ${preset}`}
                      onClick={() => setCriterionScore(c.key, preset)}
                      className={cn(
                        "h-10 rounded-lg border-2 text-sm font-bold tabular-nums transition-all",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-astro-blue/50",
                        isSelected
                          ? "border-astro-gold bg-astro-gold text-astro-navy shadow-sm"
                          : "border-line/60 bg-white text-ink hover:border-astro-blue/60 hover:bg-astro-sky/15 active:scale-95",
                        !isOpen && "cursor-not-allowed opacity-40",
                        privacyMode && "blur-[3px] select-none hover:blur-none",
                      )}
                      title={privacyMode ? "Arahkan kursor untuk melihat angka" : undefined}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {hasCustomOldScore && (
                <p className="mt-1.5 text-[11px] text-muted">
                  Nilai lama <strong className="text-astro-navy">{selectedVal}</strong> — pilih preset untuk memperbarui.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <label htmlFor={notesId} className="mb-1.5 block text-xs font-bold text-astro-navy">
          Catatan <span className="font-normal text-muted">(opsional)</span>
        </label>
        <textarea
          id={notesId}
          name="notes"
          rows={2}
          disabled={!isOpen}
          value={values.notes || ""}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Masukan untuk penampilan ini..."
          className="w-full resize-y rounded-xl border-2 border-line/80 bg-white p-2.5 text-sm font-medium text-ink placeholder:text-muted/60 focus:border-astro-blue focus:outline-none focus:ring-2 focus:ring-astro-blue/20 disabled:bg-surface-2 disabled:text-muted"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-astro-navy p-3.5 text-white shadow-soft sm:p-4">
        <div>
          <p className="text-[11px] text-white/70">Nilai berbobot</p>
          <p
            className={cn(
              "font-display text-2xl font-black text-astro-gold tabular-nums transition-all",
              privacyMode && "cursor-pointer blur-md select-none hover:blur-none",
            )}
            title={privacyMode ? "Arahkan kursor untuk melihat total nilai" : undefined}
          >
            {total === null ? "—" : total.toFixed(2)}
          </p>
          {!complete && (
            <p className="text-[11px] font-medium text-astro-gold/90">Lengkapi 4 kriteria</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOpen && hasInput && (
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 active:scale-95"
            >
              Reset
            </button>
          )}

          <SubmitButton
            size="md"
            disabled={!isOpen || !complete}
            pendingText="Menyimpan..."
            className="font-extrabold shadow-soft"
          >
            {!isOpen ? "Voting Ditutup" : complete ? "Simpan Nilai" : "Lengkapi Nilai"}
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}
