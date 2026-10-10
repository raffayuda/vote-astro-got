"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export function FileDropzone({
  name,
  accept,
  label,
  hint,
}: {
  name: string;
  accept?: string;
  label: string;
  hint?: string;
}) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
        fileName ? "border-astro-blue bg-astro-blue/5" : "border-astro-cyan-2 hover:border-astro-blue",
      )}
    >
      <span className="text-sm font-semibold text-astro-navy">{fileName ?? label}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        required
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}
