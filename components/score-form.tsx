"use client";

import { useState } from "react";
import { saveScore } from "@/app/actions/judge";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { CRITERIA, weightedJudgeScore, type CriteriaScores } from "@/lib/scoring";

export function ScoreForm({ teamId, initial }: { teamId: number; initial?: CriteriaScores | null }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CRITERIA.map((c) => [c.key, initial ? String(initial[c.key]) : ""])),
  );
  const complete = CRITERIA.every((c) => values[c.key] !== "");
  const total = complete
    ? weightedJudgeScore(Object.fromEntries(CRITERIA.map((c) => [c.key, Number(values[c.key])])) as CriteriaScores)
    : null;

  return (
    <ActionForm action={saveScore} className="flex flex-col gap-4">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map((c) => (
          <Input
            key={c.key}
            name={c.key}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            required
            label={`${c.label} (${c.weight * 100}%)`}
            value={values[c.key]}
            onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Nilai berbobot:{" "}
          <strong className="text-lg text-amber-700 tabular-nums">{total === null ? "—" : total.toFixed(2)}</strong>
        </p>
        <SubmitButton>Simpan Nilai</SubmitButton>
      </div>
    </ActionForm>
  );
}
