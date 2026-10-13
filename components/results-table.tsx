"use client";

import { TeamAvatar } from "@/components/team-card";
import { TeamScoreDetail } from "@/components/team-score-detail";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import type { TeamResult } from "@/lib/results";

type Ranked = TeamResult & { rank: number };

export function ResultsTable({
  teams,
  totalVotes,
  maxVotes,
  expandedId,
  onToggle,
}: {
  teams: TeamResult[];
  totalVotes: number;
  maxVotes: number;
  expandedId?: number | null;
  onToggle?: (id: number) => void;
}) {
  const maxVotesBar = Math.max(1, ...teams.map((t) => t.votes));
  const columns: Column<Ranked>[] = [
    { header: "#", cell: (t) => <Badge tone={t.rank === 1 ? "accent" : "neutral"}>{t.rank}</Badge> },
    {
      header: "Tim",
      cell: (t) => (
        <div className="flex items-center gap-3">
          <TeamAvatar name={t.name} photoUrl={t.photoUrl} className="size-10 shrink-0 rounded-lg text-sm" />
          <span>
            <span className="font-medium text-astro-navy">{t.name}</span>
            {t.members && <span className="block max-w-48 truncate text-xs text-muted">{t.members.split("\n")[0]}</span>}
          </span>
        </div>
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
    { header: "Juri", align: "right", cell: (t) => `${t.judgeScore.toFixed(2)} (${t.judgeCount})` },
    { header: "Voting", align: "right", cell: (t) => t.votingScore.toFixed(2) },
    {
      header: "Skor Akhir",
      align: "right",
      cell: (t) => <strong className="text-amber-700">{t.finalScore.toFixed(2)}</strong>,
    },
    {
      header: "",
      align: "right",
      cell: (t) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
          className={cn(
            "inline size-4 text-astro-blue transition-transform duration-300",
            expandedId === t.id && "rotate-180",
          )}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      ),
    },
  ];
  const rows = teams.map((t, i) => ({ ...t, rank: i + 1 }));
  return (
    <div id="hasil-tim" className="scroll-mt-4">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        empty="Belum ada tim."
        onRowClick={onToggle ? (t) => onToggle(t.id) : undefined}
        expandedKey={expandedId ?? undefined}
        renderExpanded={(t) => <TeamScoreDetail team={t} rank={t.rank} totalVotes={totalVotes} maxVotes={maxVotes} />}
      />
      <p className="mt-2 text-xs text-muted">Klik baris tim untuk melihat rincian perhitungan.</p>
    </div>
  );
}
