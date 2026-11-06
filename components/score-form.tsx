"use client";

import { useState, useId } from "react";
import { saveScore } from "@/app/actions/judge";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
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

/** Form penilaian satu penampilan juri: tombol preset 50, 65, 75, 85, 95 + catatan komentar */
export function ScoreForm({
  teamId,
  stage,
  isOpen = true,
  initial,
  onDraftChange,
}: {
  teamId: number;
  stage: string;
  isOpen?: boolean;
  initial?: ScoreRecord | null;
  onDraftChange?: (values: Record<string, string>) => void;
}) {
  const formKey = `${stage}-${teamId}`;
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

  return (
    <ActionForm
      key={formKey}
      action={saveScore}
      className="flex flex-col gap-3.5"
    >
      <input type="hidden" name="teamId" value={teamId} />

      {!isOpen && (
        <div className="rounded-2xl border-2 border-danger/40 bg-danger/10 px-4 py-3 text-center text-sm font-bold text-danger">
          🔒 Sesi voting sedang ditutup oleh panitia. Tombol penilaian dan penyimpanan dinonaktifkan.
        </div>
      )}

      {/* 4 Kriteria Penilaian */}
      <div className="flex flex-col gap-3">
        {CRITERIA.map((c) => {
          const selectedVal = values[c.key];
          const hasCustomOldScore =
            selectedVal !== "" &&
            !PRESET_SCORES.some((p) => String(p) === selectedVal);

          return (
            <div
              key={c.key}
              className={cn(
                "rounded-2xl border p-3.5 sm:p-4 transition-colors",
                selectedVal !== ""
                  ? "border-astro-blue/40 bg-astro-blue/5"
                  : "border-line/70 bg-surface-1",
              )}
            >
              {/* Header kriteria */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-astro-navy sm:text-base">
                    {c.label}
                  </span>
                  <span className="rounded-full bg-astro-navy/10 px-2 py-0.5 text-xs font-extrabold text-astro-navy tabular-nums">
                    {c.weight * 100}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedVal !== "" ? (
                    <span className="flex items-center gap-1 rounded-full border border-astro-gold bg-astro-gold/20 px-2.5 py-0.5 text-xs font-black text-astro-navy tabular-nums">
                      <span>✓ Nilai:</span>
                      <span className="font-extrabold text-ink">{selectedVal}</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-line/50 px-2.5 py-0.5 text-xs font-semibold text-muted">
                      Pilih angka
                    </span>
                  )}
                </div>
              </div>

              {/* Input hidden untuk form submit */}
              <input
                type="hidden"
                name={c.key}
                value={selectedVal}
                required
              />

              {/* Baris Tombol Preset 50, 65, 75, 85, 95 */}
              <div className="mt-2.5 grid grid-cols-5 gap-1.5 sm:gap-2.5">
                {PRESET_SCORES.map((preset) => {
                  const isSelected = selectedVal === String(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={!isOpen}
                      onClick={() => setCriterionScore(c.key, preset)}
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-xl border-2 py-2.5 sm:py-3 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-astro-blue/40",
                        isSelected
                          ? "border-astro-gold bg-astro-gold text-astro-navy font-black shadow-md ring-2 ring-astro-gold/50 scale-[1.03]"
                          : "border-line/70 bg-white text-ink font-bold hover:border-astro-blue/60 hover:bg-astro-sky/20 active:scale-95",
                        !isOpen && "cursor-not-allowed opacity-50 hover:bg-white hover:border-line/70",
                      )}
                    >
                      <span className="text-base sm:text-lg tabular-nums tracking-tight">
                        {preset}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-astro-navy text-[10px] font-black text-white shadow-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Notifikasi jika ada nilai lama custom sebelum migrasi */}
              {hasCustomOldScore && (
                <p className="mt-2 text-xs text-muted">
                  Nilai tersimpan sebelumnya: <strong className="text-astro-navy">{selectedVal}</strong>. Klik salah satu tombol preset di atas untuk memperbarui.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Catatan Komentar Penampilan */}
      <div className="rounded-2xl border border-line/70 bg-astro-cyan-2/10 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor={notesId} className="text-sm font-bold text-astro-navy">
            Catatan Komentar Penampilan
          </label>
          <span className="text-xs text-muted">Opsional</span>
        </div>
        <textarea
          id={notesId}
          name="notes"
          rows={3}
          disabled={!isOpen}
          value={values.notes || ""}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={
            isOpen
              ? "Tuliskan catatan, masukan, atau evaluasi untuk penampilan ini..."
              : "Voting sedang ditutup. Catatan tidak dapat diubah."
          }
          className="w-full resize-y rounded-xl border-2 border-line/80 bg-white p-3 text-sm font-medium text-ink placeholder:text-muted/60 focus:border-astro-blue focus:outline-none focus:ring-2 focus:ring-astro-blue/20 disabled:bg-surface-2 disabled:text-muted"
        />
      </div>

      {/* Footer Skor Berbobot & Tombol Simpan */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-astro-navy p-4 text-white shadow-soft">
        <div className="flex flex-col">
          <span className="text-xs text-white/70">Total Nilai Berbobot (0–100):</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-astro-gold tabular-nums">
              {total === null ? "—" : total.toFixed(2)}
            </span>
            {complete && (
              <span className="text-xs text-white/60">
                (Kreativitas 30% + Teknis 30% + Panggung 25% + Kostum 15%)
              </span>
            )}
          </div>
          {!complete && (
            <span className="text-xs font-medium text-astro-gold/90">
              * Pilih nilai untuk ke-4 kriteria di atas
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (values.kreativitas || values.teknis || values.panggung || values.kostum || values.notes) && (
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 active:scale-95"
            >
              Reset
            </button>
          )}

          <SubmitButton
            size="md"
            disabled={!isOpen || !complete}
            pendingText="Menyimpan Nilai..."
            className={cn(
              "font-extrabold shadow-soft transition-all",
              (!isOpen || !complete) && "cursor-not-allowed opacity-50",
            )}
          >
            {!isOpen ? "Voting Ditutup" : !complete ? "Lengkapi Nilai" : "Simpan Nilai"}
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}
