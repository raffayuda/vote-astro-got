"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { TeamResult } from "@/lib/results";

type Ranked = TeamResult & { rank: number };

export function ResultsTable({
  teams,
  selectedStage,
}: {
  teams: TeamResult[];
  selectedStage?: string;
  totalVotes?: number;
  maxVotes?: number;
  expandedId?: number | null;
  onToggle?: (id: number) => void;
}) {
  const router = useRouter();
  const maxVotesBar = Math.max(1, ...teams.map((t) => t.votes));
  const stageQuery = selectedStage && selectedStage !== "Semua" ? `?stage=${encodeURIComponent(selectedStage)}` : "";

  const isShowcase = selectedStage?.toLowerCase() === "showcase";
  const isFinal = selectedStage?.toLowerCase() === "final";
  const isAll = !selectedStage || selectedStage === "Semua";

  const columns: Column<Ranked>[] = isAll
    ? [
        { header: "#", cell: (t) => <Badge tone={t.rank === 1 ? "accent" : "neutral"}>{t.rank}</Badge> },
        {
          header: "Nama Penampilan",
          cell: (t) => (
            <Link
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              className="group flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <TeamAvatar name={t.name} photoUrl={t.photoUrl} className="size-10 shrink-0 rounded-lg text-sm" />
              <span>
                <span className="font-semibold text-astro-navy group-hover:text-astro-blue group-hover:underline">
                  {t.name}
                </span>
                {t.members && (
                  <span className="block max-w-56 truncate text-xs text-muted" title={t.members.split(/\r?\n/).map((m) => m.trim()).filter(Boolean).join(", ")}>
                    {t.members.split(/\r?\n/).map((m) => m.trim()).filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
            </Link>
          ),
        },
        {
          header: "Showcase (30%)",
          align: "right",
          cell: (t) => (
            <div>
              <span className="tabular-nums font-semibold text-astro-navy">
                {(t.showcaseScore ?? 0).toFixed(2)}
              </span>
              <span className="block text-2xs text-muted">
                Poin: {((t.showcaseScore ?? 0) * 0.3).toFixed(2)}
              </span>
            </div>
          ),
        },
        {
          header: "Final (70%)",
          align: "right",
          cell: (t) => (
            <div>
              <span className="tabular-nums font-semibold text-astro-navy">
                {(t.finalRoundScore ?? 0).toFixed(2)}
              </span>
              <span className="block text-2xs text-muted">
                Poin: {((t.finalRoundScore ?? 0) * 0.7).toFixed(2)}
              </span>
            </div>
          ),
        },
        {
          header: "Skor Akhir Juara",
          align: "right",
          cell: (t) => <strong className="text-base text-amber-700 font-extrabold">{t.finalScore.toFixed(2)}</strong>,
        },
        {
          header: "",
          align: "right",
          cell: (t) => (
            <Link
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-astro-blue/30 bg-white px-3 py-1 text-xs font-bold text-astro-blue shadow-2xs hover:bg-astro-blue hover:text-white transition-all"
            >
              Detail Penampilan →
            </Link>
          ),
        },
      ]
    : isShowcase
    ? [
        { header: "#", cell: (t) => <Badge tone={t.rank === 1 ? "accent" : "neutral"}>{t.rank}</Badge> },
        {
          header: "Nama Penampilan",
          cell: (t) => (
            <Link
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              className="group flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <TeamAvatar name={t.name} photoUrl={t.photoUrl} className="size-10 shrink-0 rounded-lg text-sm" />
              <span>
                <span className="font-semibold text-astro-navy group-hover:text-astro-blue group-hover:underline">
                  {t.name}
                </span>
                {t.members && (
                  <span className="block max-w-56 truncate text-xs text-muted" title={t.members.split(/\r?\n/).map((m) => m.trim()).filter(Boolean).join(", ")}>
                    {t.members.split(/\r?\n/).map((m) => m.trim()).filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
            </Link>
          ),
        },
        {
          header: "Nilai Juri (100%)",
          align: "right",
          cell: (t) => `${t.judgeScore.toFixed(2)} (${t.judgeCount} juri)`,
        },
        {
          header: "Voting Penonton",
          align: "right",
          cell: () => <span className="text-xs text-muted">Juri Only</span>,
        },
        {
          header: "Skor Showcase",
          align: "right",
          cell: (t) => <strong className="text-base text-amber-700 font-extrabold">{t.finalScore.toFixed(2)}</strong>,
        },
        {
          header: "",
          align: "right",
          cell: (t) => (
            <Link
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-astro-blue/30 bg-white px-3 py-1 text-xs font-bold text-astro-blue shadow-2xs hover:bg-astro-blue hover:text-white transition-all"
            >
              Detail Penampilan →
            </Link>
          ),
        },
      ]
    : [
        { header: "#", cell: (t) => <Badge tone={t.rank === 1 ? "accent" : "neutral"}>{t.rank}</Badge> },
        {
          header: "Nama Penampilan",
          cell: (t) => (
            <Link
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              className="group flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <TeamAvatar name={t.name} photoUrl={t.photoUrl} className="size-10 shrink-0 rounded-lg text-sm" />
              <span>
                <span className="font-semibold text-astro-navy group-hover:text-astro-blue group-hover:underline">
                  {t.name}
                </span>
                {t.members && (
                  <span className="block max-w-56 truncate text-xs text-muted" title={t.members.split(/\r?\n/).map((m) => m.trim()).filter(Boolean).join(", ")}>
                    {t.members.split(/\r?\n/).map((m) => m.trim()).filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
            </Link>
          ),
        },
        {
          header: "Suara",
          cell: (t) => (
            <div className="min-w-32">
              <span className="tabular-nums">
                {t.votes} <span className="text-muted">({t.votePercent.toFixed(1)}%)</span>
              </span>
              <ProgressBar value={t.votes} max={maxVotesBar} label={`Suara ${t.name}`} className="mt-1" />
            </div>
          ),
        },
        { header: isFinal ? "Juri (50%)" : "Juri", align: "right", cell: (t) => `${t.judgeScore.toFixed(2)} (${t.judgeCount})` },
        { header: isFinal ? "Voting (50%)" : "Voting", align: "right", cell: (t) => t.votingScore.toFixed(2) },
        {
          header: isFinal ? "Skor Babak Final" : "Skor Akhir",
          align: "right",
          cell: (t) => <strong className="text-base text-amber-700 font-extrabold">{t.finalScore.toFixed(2)}</strong>,
        },
        {
          header: "",
          align: "right",
          cell: (t) => (
            <Link
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-astro-blue/30 bg-white px-3 py-1 text-xs font-bold text-astro-blue shadow-2xs hover:bg-astro-blue hover:text-white transition-all"
            >
              Detail Penampilan →
            </Link>
          ),
        },
      ];

  const rows = teams.map((t, i) => ({ ...t, rank: i + 1 }));

  return (
    <div id="hasil-penampilan" className="scroll-mt-4">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        empty="Belum ada penampilan."
        onRowClick={(t) => router.push(`/admin/penampilan/${t.id}${stageQuery}`)}
      />
      <p className="mt-2 text-xs text-muted">
        Klik baris penampilan atau tombol &quot;Detail Penampilan →&quot; untuk melihat rincian suara dan penilaian juri di halaman khususnya.
      </p>
    </div>
  );
}
