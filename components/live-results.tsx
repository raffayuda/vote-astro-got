"use client";

import Link from "next/link";
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
  const stageQuery = selectedStage !== "Semua" ? `?stage=${encodeURIComponent(selectedStage)}` : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Tombol Unduh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Hasil &amp; Skor Akhir</CardTitle>
          <p className="text-sm text-muted">
            {selectedStage === "Semua"
              ? "Akumulasi Juara · Skor Akhir = (Showcase 30% × Juri) + (Final 70% × [Juri 50% + Voting 50%])"
              : selectedStage?.toLowerCase() === "showcase"
              ? "Babak Showcase · Skor = 100% Nilai Juri (Bobot 30% ke Skor Akhir Juara)"
              : selectedStage?.toLowerCase() === "final"
              ? "Babak Final · Skor = (Nilai Juri × 50%) + (Nilai Voting × 50%) (Bobot 70% ke Skor Akhir Juara)"
              : `Babak: ${selectedStage} · Skor = (Nilai Juri × 50%) + (Nilai Voting × 50%)`}
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

      {/* Filter Babak */}
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

      {/* Statistik Cepat */}
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

      {/* SECTION JURI: KLIK TIAP JURI UNTUK BUKA DATA PENILAIANNYA */}
      {data.judges && data.judges.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <CardTitle>Penilaian Juri ({data.judges.length} Juri)</CardTitle>
            <p className="text-xs text-muted">Klik kartu juri untuk melihat lembar penilaian lengkap</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.judges.map((j) => (
              <Link
                key={j.id}
                href={`/admin/juri/${j.id}${stageQuery}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-line/60 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-astro-blue/50 hover:shadow-soft-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-astro-navy to-astro-blue text-sm font-bold text-white shadow-xs">
                    {j.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-astro-navy group-hover:text-astro-blue group-hover:underline">
                      {j.name}
                    </p>
                    <p className="truncate text-xs text-muted">{j.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge tone={j.scoredCount >= data.teams.length && data.teams.length > 0 ? "success" : "neutral"} className="text-2xs">
                    {j.scoredCount}/{data.teams.length} dinilai
                  </Badge>
                  <span className="text-2xs font-semibold text-astro-blue">Lihat Lembar Nilai →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Sorotan 3 Besar (Klik untuk ke Halaman Detail) */}
      <Leaderboard teams={data.teams} selectedStage={selectedStage} />

      {/* Tabel Hasil Lengkap (Klik untuk ke Halaman Detail) */}
      <ResultsTable teams={data.teams} selectedStage={selectedStage} />

      <p className="text-xs text-muted">
        {selectedStage === "Semua"
          ? "Akumulasi Juara menggabungkan 30% Babak Showcase (murni penilaian juri) dan 70% Babak Final (50% juri + 50% voting penonton). Klik baris penampilan untuk melihat rincian."
          : selectedStage?.toLowerCase() === "showcase"
          ? "Babak Showcase dinilai murni oleh Dewan Juri (bobot 30% ke skor akhir). Klik baris penampilan untuk membuka rincian nilai tiap kriteria."
          : "Nilai Voting dinormalisasi: penampilan dengan suara terbanyak = 100, lainnya proporsional. Nilai Juri = rata-rata nilai berbobot semua juri. Klik baris penampilan untuk membuka rincian suara & penilaian."}
      </p>
    </div>
  );
}
