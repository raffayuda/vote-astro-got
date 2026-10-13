"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "h-12 w-full rounded-2xl border-2 border-astro-cyan-2 bg-white px-4 text-base text-ink placeholder:text-muted/60 " +
  "focus:border-astro-blue focus:outline-3 focus:outline-astro-blue/25";

function parseMembers(value?: string | null): string[] {
  if (!value) return [""];
  const parts = value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [""];
}

/** Input anggota tim satu-per-satu dengan tombol tambah/hapus. Disimpan sebagai newline di field `members`. */
export function MembersField({
  id,
  name = "members",
  label = "Anggota tim",
  hint = "Masukkan satu anggota per kolom. Klik Tambah untuk menambah anggota baru.",
  defaultValue,
}: {
  id: string;
  name?: string;
  label?: string;
  hint?: string;
  defaultValue?: string | null;
}) {
  const [members, setMembers] = useState<string[]>(() => parseMembers(defaultValue));

  const update = (index: number, value: string) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? value : m)));
  };

  const add = () => setMembers((prev) => [...prev, ""]);

  const remove = (index: number) => {
    setMembers((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={`${id}-0`} className="text-sm font-semibold text-astro-navy">
          {label} <span className="font-normal text-muted">({members.filter((m) => m.trim()).length})</span>
        </label>
      )}
      {/* Nilai aktual yang dikirim ke server action (dipisah baris baru). */}
      <input type="hidden" name={name} value={members.map((m) => m.trim()).filter(Boolean).join("\n")} />
      <div className="flex flex-col gap-2">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex size-10 w-8 shrink-0 items-center justify-center rounded-xl bg-astro-cyan-2/40 text-sm font-bold text-astro-navy">
              {i + 1}
            </span>
            <input
              id={`${id}-${i}`}
              type="text"
              value={member}
              maxLength={200}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (i === members.length - 1) add();
                  else document.getElementById(`${id}-${i + 1}`)?.focus();
                }
              }}
              placeholder={i === 0 ? "Contoh: Rina — vokal" : `Anggota ${i + 1}...`}
              className={cn(inputClass, "flex-1")}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={members.length === 1 && !member}
              title="Hapus anggota ini"
              aria-label={`Hapus anggota ${i + 1}`}
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 text-lg font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-40"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-1 inline-flex h-11 w-fit items-center gap-2 rounded-2xl border-2 border-dashed border-astro-blue/40 bg-astro-cyan-2/20 px-4 text-sm font-semibold text-astro-blue transition hover:border-astro-blue hover:bg-astro-cyan-2/40"
      >
        <span className="text-lg leading-none">+</span> Tambah Anggota
      </button>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
