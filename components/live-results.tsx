"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { ResultsTable } from "@/components/results-table";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import type { ResultsData } from "@/lib/results";

/** Hasil voting + skor akhir, diperbarui otomatis (polling) tanpa reload halaman. */
export function LiveResults({ initial, intervalSeconds = 3 }: { initial: ResultsData; intervalSeconds?: number }) {
  const [data, setData] = useState(initial);
  const [stale, setStale] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/results", { cache: "no-store" });
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
    const id = setInterval(load, intervalSeconds * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalSeconds]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Suara masuk" value={data.totalVotes} />
        <StatTile
          label="Partisipasi"
          value={data.totalVoters ? `${Math.round((data.totalVotes / data.totalVoters) * 100)}%` : "0%"}
          hint={`${data.totalVotes} dari ${data.totalVoters} penonton`}
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
    </div>
  );
}
