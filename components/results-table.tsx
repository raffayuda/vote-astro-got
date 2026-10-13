import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { TeamResult } from "@/lib/results";

export function ResultsTable({ teams }: { teams: TeamResult[] }) {
  const maxVotes = Math.max(1, ...teams.map((t) => t.votes));
  const columns: Column<TeamResult & { rank: number }>[] = [
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
          <ProgressBar value={t.votes} max={maxVotes} label={`Suara ${t.name}`} className="mt-1" />
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
  ];
  return (
    <DataTable
      columns={columns}
      rows={teams.map((t, i) => ({ ...t, rank: i + 1 }))}
      rowKey={(t) => t.id}
      empty="Belum ada tim."
    />
  );
}
