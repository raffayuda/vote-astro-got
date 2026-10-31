"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { ResultsTable } from "@/components/results-table";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { assetUrl } from "@/lib/asset";
import type { ResultsData } from "@/lib/results";

/** Hasil voting + skor akhir, diperbarui otomatis (polling) tanpa reload halaman. */
export function LiveResults({ initial, intervalSeconds = 3 }: { initial: ResultsData; intervalSeconds?: number }) {
  const [data, setData] = useState(initial);
  const [selectedStage, setSelectedStage] = useState(initial.stage ?? initial.activeStage ?? "Semua");
  const [stale, setStale] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const stages = ["Semua", ...(initial.availableStages ?? ["Penyisihan", "Semi Final", "Final"])];

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const query = selectedStage !== "Semua" ? `?stage=${encodeURIComponent(selectedStage)}` : "?stage=Semua";
        const res = await fetch(assetUrl(`/api/results${query}`), { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as ResultsData;
        if (active) {
          setData(next);
          setStale(false);
        }
      } catch {
        if (active) setStale(true);
      }
    }

    load();
    const id = setInterval(load, intervalSeconds * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalSeconds, selectedStage]);

  const exportStageParam = selectedStage !== "Semua" ? `&stage=${encodeURIComponent(selectedStage)}` : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Hasil &amp; Skor Akhir</CardTitle>
          <p className="text-sm text-muted">
            {selectedStage === "Semua" ? "Akumulasi Semua Babak" : `Babak: ${selectedStage}`} · Skor Akhir = (Nilai Juri × 50%) + (Nilai Voting × 50%).
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/api/export?format=csv${exportStageParam}`} variant="secondary" size="sm" prefetch={false}>
            Unduh CSV
          </ButtonLink>
          <ButtonLink href={`/api/export?format=xlsx${exportStageParam}`} variant="secondary" size="sm" prefetch={false}>
            Unduh Excel
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line/40 pb-3">
        <span className="text-xs font-semibold text-muted">Filter Babak:</span>
        {stages.map((st) => {
          const isSelected = selectedStage === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStage(st)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-astro-blue text-white shadow-sm"
                  : "bg-surface-2 text-astro-navy/70 hover:bg-surface-3 hover:text-astro-navy"
              }`}
            >
              {st}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Suara masuk" value={data.totalVotes} />
        <StatTile
          label="Partisipasi"
          value={data.totalQuota ? `${Math.min(100, Math.round((data.totalVotes / data.totalQuota) * 100))}%` : "0%"}
          hint={`${data.totalVotes} dari ${data.totalQuota} kuota suara`}
        />
        <div className="col-span-2 flex items-center sm:col-span-1">
          <Badge tone={data.isOpen ? "success" : "danger"}>{data.isOpen ? "Voting dibuka" : "Voting ditutup"}</Badge>
          {stale && <Badge tone="accent" className="ml-2">Koneksi terputus</Badge>}
        </div>
      </div>

      <Leaderboard
        teams={data.teams}
        onSelect={(id) => {
          setExpandedId((prev) => (prev === id ? null : id));
          document.getElementById("hasil-tim")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <ResultsTable
        teams={data.teams}
        totalVotes={data.totalVotes}
        maxVotes={data.maxVotes}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
      />
      <p className="text-xs text-muted">
        Nilai Voting dinormalisasi: tim dengan suara terbanyak = 100, lainnya proporsional. Nilai Juri = rata-rata
        nilai berbobot semua juri.
      </p>
    </div>
  );
}
