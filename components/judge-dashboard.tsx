"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Tab utama juri: formulir penilaian dan hasil Showcase + Final tanpa scroll panjang. */
export function JudgeDashboard({
  scoring,
  results,
  defaultTab = "scoring",
}: {
  scoring: ReactNode;
  results: ReactNode;
  defaultTab?: "scoring" | "results";
}) {
  const [tab, setTab] = useState<"scoring" | "results">(defaultTab);

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Pilih tampilan juri"
        className="sticky top-[4.5rem] z-30 flex w-full gap-1 rounded-2xl bg-white/80 p-1 shadow-soft-sm ring-1 ring-white/70 backdrop-blur-md sm:w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "scoring"}
          onClick={() => setTab("scoring")}
          className={cn(
            "flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors sm:flex-none",
            tab === "scoring"
              ? "bg-astro-blue text-white shadow-soft"
              : "text-astro-navy/70 hover:bg-white/70 hover:text-astro-navy",
          )}
        >
          Penilaian
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "results"}
          onClick={() => setTab("results")}
          className={cn(
            "flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors sm:flex-none",
            tab === "results"
              ? "bg-astro-blue text-white shadow-soft"
              : "text-astro-navy/70 hover:bg-white/70 hover:text-astro-navy",
          )}
        >
          Hasil Showcase &amp; Final
        </button>
      </div>

      <div className={cn(tab !== "scoring" && "hidden")}>{scoring}</div>
      <div className={cn(tab !== "results" && "hidden")}>{results}</div>
    </div>
  );
}
