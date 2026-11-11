"use client";

import { Fragment, useState } from "react";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type {
  TransparencyData,
  TransparencyOverallTeam,
  TransparencyStage,
  TransparencyStageTeam,
} from "@/lib/transparency";

function OverallExpandedDetail({
  overall,
  stages,
  teamId,
  projector,
}: {
  overall: TransparencyOverallTeam;
  stages: TransparencyStage[];
  teamId: number;
  projector: boolean;
}) {
  const entries = stages
    .map((stage) => ({ stage, team: stage.teams.find((team) => team.teamId === teamId) }))
    .filter(
      (entry): entry is { stage: TransparencyStage; team: TransparencyStageTeam } =>
        Boolean(entry.team),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-2xl bg-astro-navy p-4 text-white sm:grid-cols-3">
        <div>
          <p className="text-[11px] text-white/70">Showcase · 30%</p>
          <p className="font-display text-xl font-black text-astro-gold tabular-nums">
            {overall.showcaseScore.toFixed(2)}
          </p>
          <p className="text-[11px] text-white/60 tabular-nums">
            Poin {overall.showcasePoints.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-white/70">Final · 70%</p>
          <p className="font-display text-xl font-black text-astro-gold tabular-nums">
            {overall.finalRoundScore.toFixed(2)}
          </p>
          <p className="text-[11px] text-white/60 tabular-nums">
            Juri {overall.finalJudgeScore.toFixed(2)} · Voting {overall.finalVotingScore.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-white/70">Skor Akhir Juara</p>
          <p className="font-display text-2xl font-black text-astro-gold tabular-nums">
            {overall.totalScore.toFixed(2)}
          </p>
          <p className="text-[11px] text-white/60 tabular-nums">
            Poin {overall.finalPoints.toFixed(2)}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          Belum ada rincian nilai untuk penampilan ini.
        </p>
      ) : (
        <div className={cn("grid gap-3", entries.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
          {entries.map(({ stage, team }) => (
            <div key={stage.name} className="rounded-2xl border border-line/60 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-display text-base font-extrabold text-astro-navy">{stage.name}</h4>
                  <p className="mt-0.5 text-[11px] text-muted tabular-nums">
                    {team.judgeCount} juri menilai
                    {stage.isShowcase
                      ? " · tanpa voting"
                      : ` · ${team.votes} suara · voting ${team.votingScore.toFixed(2)}`}
                  </p>
                </div>
                <Badge tone="accent">Skor {team.score.toFixed(2)}</Badge>
              </div>

              <div className="mt-2 divide-y divide-line/40">
                {team.judges.map((judge) => (
                  <div
                    key={judge.judgeId}
                    className="flex items-center justify-between gap-2 py-1.5 text-xs"
                  >
                    <span className="truncate text-muted">{judge.judgeName}</span>
                    <span
                      className={cn(
                        "shrink-0 font-bold tabular-nums",
                        judge.hasScored ? "text-astro-navy" : "text-muted/50",
                        projector ? "text-sm" : "text-xs",
                      )}
                    >
                      {judge.hasScored ? judge.weightedScore?.toFixed(2) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverallTable({
  data,
  stages,
  projector,
  collapsedKeys,
  onToggle,
}: {
  data: TransparencyData;
  stages: TransparencyStage[];
  projector: boolean;
  collapsedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const final = data.stages.find((stage) => stage.isFinal);
  const finalHasData = Boolean(
    final?.teams.some((team) => team.judgeCount > 0 || team.votes > 0),
  );
  const headText = projector ? "text-xs" : "text-[11px]";
  const subText = projector ? "text-xs" : "text-[11px]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-astro-blue/25 bg-white px-4 py-3 shadow-soft-sm">
        <span className="rounded-lg bg-astro-gold px-2 py-1 text-xs font-black text-astro-navy">
          Showcase 30%
        </span>
        <span className="text-xs font-semibold text-muted">100% nilai juri</span>
        <span className="text-sm font-black text-astro-navy">+</span>
        <span className="rounded-lg bg-astro-blue/10 px-2 py-1 text-xs font-black text-astro-blue">
          Final 70%
        </span>
        <span className="text-xs font-semibold text-muted">50% juri + 50% voting</span>
        <span className="text-sm font-black text-astro-navy">=</span>
        <span className="text-xs font-black text-astro-navy">Skor Akhir Juara</span>
        {!finalHasData && (
          <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
            Final belum dinilai · skor sementara
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-line/60 bg-white shadow-soft">
        <table className={cn("w-full min-w-[780px] text-left", projector ? "text-base" : "text-sm")}>
          <thead className={cn("bg-astro-navy font-bold uppercase text-white", headText)}>
            <tr>
              <th className="w-14 px-3 py-3 text-center">#</th>
              <th className="px-4 py-3">Penampilan</th>
              <th className="w-44 px-3 py-3 text-center">Showcase · 30%</th>
              <th className="w-56 px-3 py-3 text-center">Final · 70%</th>
              <th className="w-36 px-4 py-3 text-right">Skor Akhir</th>
              <th className="w-28 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.overall.map((team) => {
              const key = `overall:${team.teamId}`;
              const expanded = !collapsedKeys.has(key);

              return (
                <Fragment key={team.teamId}>
                  <tr className={cn("border-b border-line/40 transition-colors", expanded ? "bg-astro-blue/5" : "hover:bg-astro-cyan-1/20")}>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full font-black tabular-nums",
                          team.rank === 1
                            ? "bg-astro-gold text-astro-navy"
                            : "bg-astro-navy/8 text-astro-navy",
                        )}
                      >
                        {team.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TeamAvatar
                          name={team.name}
                          photoUrl={team.photoUrl}
                          className={cn("shrink-0 rounded-xl", projector ? "size-12 text-base" : "size-9 text-xs")}
                        />
                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-astro-navy">{team.name}</p>
                          {team.members && (
                            <p className="truncate text-xs text-muted">
                              {team.members.split(/\r?\n/).filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <p className="font-bold text-astro-navy tabular-nums">{team.showcaseScore.toFixed(2)}</p>
                      <p className={cn("text-muted tabular-nums", subText)}>
                        Poin: {team.showcasePoints.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <p className="font-bold text-astro-navy tabular-nums">{team.finalRoundScore.toFixed(2)}</p>
                      <p className={cn("text-muted tabular-nums", subText)}>
                        Juri {team.finalJudgeScore.toFixed(2)} · Voting {team.finalVotingScore.toFixed(2)}
                      </p>
                      <p className={cn("text-muted tabular-nums", subText)}>
                        Poin: {team.finalPoints.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-display font-black text-amber-700 tabular-nums",
                          projector ? "text-2xl" : "text-lg",
                        )}
                      >
                        {team.totalScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size={projector ? "md" : "sm"}
                        aria-expanded={expanded}
                        onClick={() => onToggle(key)}
                        className="gap-1.5 whitespace-nowrap"
                      >
                        {expanded ? "Tutup" : "Rincian"}
                        <span
                          className={cn(
                            "inline-block text-[10px] transition-transform duration-300",
                            expanded && "rotate-180",
                          )}
                        >
                          ▾
                        </span>
                      </Button>
                    </td>
                  </tr>
                  <tr className="bg-surface-1/60">
                    <td colSpan={6} className="p-0">
                      <div
                        aria-hidden={!expanded}
                        className={cn(
                          "grid transition-all duration-300 ease-in-out",
                          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="p-4 sm:p-5">
                            <OverallExpandedDetail
                              overall={team}
                              stages={stages}
                              teamId={team.teamId}
                              projector={projector}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {data.overall.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  Belum ada data penilaian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageTable({
  stage,
  projector,
  expandedKey,
  onToggle,
}: {
  stage: TransparencyStage;
  projector: boolean;
  expandedKey: string | null;
  onToggle: (key: string) => void;
}) {
  const showVoting = !stage.isShowcase;
  const scoredTeams = stage.teams.some((team) => team.judgeCount > 0);
  const formula = stage.isShowcase
    ? "100% nilai juri · kontribusi 30% ke Skor Akhir"
    : stage.isFinal
      ? "50% nilai juri + 50% voting penonton · kontribusi 70% ke Skor Akhir"
      : "Nilai juri per kriteria + voting penonton";
  const headText = projector ? "text-xs" : "text-[11px]";
  const subText = projector ? "text-xs" : "text-[10px]";
  const columnCount = 5 + (stage.teams[0]?.judges.length ?? 0) + (showVoting ? 2 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-astro-blue/25 bg-white px-4 py-3 shadow-soft-sm">
        <span className="rounded-lg bg-astro-navy px-2 py-1 text-xs font-black text-white">
          Babak {stage.name}
        </span>
        <span className="text-xs font-semibold text-muted">{formula}</span>
        {showVoting && (
          <span className="text-xs text-muted">Voting: suara tim ÷ suara terbanyak × 100</span>
        )}
        {stage.isFinal && stage.totalVotes === 0 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            Voting Final belum masuk
          </span>
        )}
        <span className="ml-auto text-xs font-semibold text-muted tabular-nums">
          {stage.isShowcase
            ? `${stage.teams.length} penampilan · tanpa voting`
            : `${stage.totalVotes} suara · tertinggi ${stage.maxVotes} · ${stage.teams.length} penampilan`}
        </span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-line/60 bg-white shadow-soft">
        <table className={cn("w-full min-w-[900px] text-left", projector ? "text-base" : "text-sm")}>
          <thead className={cn("bg-astro-navy font-bold uppercase text-white", headText)}>
            <tr>
              <th className="w-14 px-3 py-3 text-center">#</th>
              <th className="w-48 px-4 py-3">Penampilan</th>
              {stage.teams[0]?.judges.map((judge) => (
                <th key={judge.judgeId} className="px-3 py-3 text-center">
                  {judge.judgeName}
                  <span className={cn("block font-normal opacity-80", subText)}>Nilai juri</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center">
                Rata-rata
                <span className={cn("block font-normal opacity-80", subText)}>Juri</span>
              </th>
              {showVoting && (
                <>
                  <th className="px-3 py-3 text-center">Suara</th>
                  <th className="px-3 py-3 text-center">
                    Nilai
                    <span className={cn("block font-normal opacity-80", subText)}>Voting</span>
                  </th>
                </>
              )}
              <th className="px-3 py-3 text-center">
                Skor
                <span className={cn("block font-normal opacity-80", subText)}>Babak</span>
              </th>
              <th className="w-28 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {stage.teams.map((team, index) => {
              const key = `${stage.name}:${team.teamId}`;
              const expanded = expandedKey === key;

              return (
                <Fragment key={team.teamId}>
                  <tr className={cn("border-b border-line/40 transition-colors", expanded ? "bg-astro-blue/5" : "hover:bg-astro-cyan-1/20")}>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full font-black tabular-nums",
                          index === 0
                            ? "bg-astro-gold text-astro-navy"
                            : "bg-astro-navy/8 text-astro-navy",
                        )}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TeamAvatar
                          name={team.name}
                          photoUrl={team.photoUrl}
                          className={cn("shrink-0 rounded-xl", projector ? "size-12 text-base" : "size-9 text-xs")}
                        />
                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-astro-navy">{team.name}</p>
                          {team.members && (
                            <p className="truncate text-xs text-muted">
                              {team.members.split(/\r?\n/).filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {team.judges.map((judge) => (
                      <td key={judge.judgeId} className="px-3 py-3 text-center">
                        {judge.hasScored ? (
                          <>
                            <p className="font-extrabold text-astro-navy tabular-nums">
                              {judge.weightedScore?.toFixed(2)}
                            </p>
                            <p className={cn("text-muted tabular-nums", subText)}>
                              {judge.kreativitas} · {judge.teknis} · {judge.panggung} · {judge.kostum}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <p className="font-bold text-astro-blue tabular-nums">{team.judgeScore.toFixed(2)}</p>
                      <p className={cn("text-muted", subText)}>{team.judgeCount} juri</p>
                    </td>
                    {showVoting && (
                      <>
                        <td className="px-3 py-3 text-center font-semibold text-astro-navy tabular-nums">
                          {team.votes}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-astro-blue tabular-nums">
                          {team.votingScore.toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          "font-display font-black text-amber-700 tabular-nums",
                          projector ? "text-xl" : "text-base",
                        )}
                      >
                        {team.score.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size={projector ? "md" : "sm"}
                        aria-expanded={expanded}
                        onClick={() => onToggle(key)}
                        className="gap-1.5 whitespace-nowrap"
                      >
                        {expanded ? "Tutup" : "Rincian"}
                        <span
                          className={cn(
                            "inline-block text-[10px] transition-transform duration-300",
                            expanded && "rotate-180",
                          )}
                        >
                          ▾
                        </span>
                      </Button>
                    </td>
                  </tr>
                  <tr className="bg-surface-1/60">
                    <td colSpan={columnCount} className="p-0">
                      <div
                        aria-hidden={!expanded}
                        className={cn(
                          "grid transition-all duration-300 ease-in-out",
                          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="p-4 sm:p-5">
                            <TeamStageDetail
                              stage={stage}
                              team={team}
                              projector={projector}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {!scoredTeams && stage.teams.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-sm text-muted">
                  Belum ada nilai juri atau voting di babak ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {stage.teams.length > 0 && !scoredTeams && (
        <p className="text-xs text-muted">Belum ada juri yang memberi nilai di babak ini.</p>
      )}
      {stage.teams.length > 0 && (
        <p className={cn("text-muted", projector ? "text-xs" : "text-[11px]")}>
          Angka kecil di bawah nilai juri: Kreativitas · Teknis · Panggung · Kostum (bobot 30% · 30% · 25% · 15%).
        </p>
      )}
    </div>
  );
}

function TeamStageDetail({
  stage,
  team,
  projector,
}: {
  stage: TransparencyStage;
  team: TransparencyStageTeam;
  projector: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-display text-base font-extrabold text-astro-navy">{stage.name}</h4>
          <Badge tone="accent" className="text-[11px]">
            Skor {team.score.toFixed(2)}
          </Badge>
        </div>
        <p className="text-[11px] text-muted tabular-nums">
          {team.judgeCount} juri menilai
          {stage.isShowcase
            ? " · tanpa voting"
            : ` · ${team.votes} suara · voting ${team.votingScore.toFixed(2)}`}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line/60">
        <table className={cn("w-full text-left", projector ? "text-sm" : "text-xs")}>
          <thead className="bg-surface-2 text-[10px] font-bold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Juri</th>
              <th className="px-2 py-2 text-center">Kreativitas 30%</th>
              <th className="px-2 py-2 text-center">Teknis 30%</th>
              <th className="px-2 py-2 text-center">Panggung 25%</th>
              <th className="px-2 py-2 text-center">Kostum 15%</th>
              <th className="px-2 py-2 text-center">Nilai</th>
              <th className="px-3 py-2">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {team.judges.map((judge) => (
              <tr key={judge.judgeId}>
                <td className="px-3 py-2 font-semibold text-astro-navy">{judge.judgeName}</td>
                {judge.hasScored ? (
                  <>
                    <td className="px-2 py-2 text-center tabular-nums">{judge.kreativitas}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{judge.teknis}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{judge.panggung}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{judge.kostum}</td>
                    <td className="px-2 py-2 text-center font-extrabold text-astro-blue tabular-nums">
                      {judge.weightedScore?.toFixed(2)}
                    </td>
                    <td className="max-w-[240px] px-3 py-2 text-ink">
                      {judge.notes || <span className="italic text-muted/60">—</span>}
                    </td>
                  </>
                ) : (
                  <td colSpan={6} className="px-2 py-2 text-center text-[11px] italic text-muted">
                    Belum menilai
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ScoreTransparency({
  data,
  stages,
  projector = false,
  heading = "Hasil Penilaian",
}: {
  data: TransparencyData;
  stages?: string[];
  projector?: boolean;
  heading?: string | null;
}) {
  const [view, setView] = useState("overall");
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());
  const [stageExpandedKey, setStageExpandedKey] = useState<string | null>(null);

  const visibleStages = data.stages.filter(
    (stage) => !stages || stages.some((name) => name.toLowerCase() === stage.name.toLowerCase()),
  );
  const activeView =
    view === "overall" || visibleStages.some((stage) => stage.name === view) ? view : "overall";
  const activeStage = visibleStages.find((stage) => stage.name === activeView);

  const toggleExpanded = (key: string) => {
    setCollapsedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleStageExpanded = (key: string) => {
    setStageExpandedKey((current) => (current === key ? null : key));
  };

  return (
    <section className="flex flex-col gap-4">
      {heading && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className={cn("font-display font-extrabold text-astro-navy", projector ? "text-3xl" : "text-xl")}>
              {heading}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Showcase 30% (100% juri) + Final 70% (50% juri + 50% voting).
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pilih hasil penilaian">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "overall"}
          onClick={() => setView("overall")}
          className={cn(
            "rounded-full border-2 px-4 py-2 font-bold transition-colors",
            projector ? "text-base" : "text-xs",
            activeView === "overall"
              ? "border-astro-blue bg-astro-blue text-white shadow-soft"
              : "border-line/60 bg-white text-astro-navy hover:border-astro-blue",
          )}
        >
          Akumulasi Juara
        </button>
        {visibleStages.map((stage) => (
          <button
            key={stage.name}
            type="button"
            role="tab"
            aria-selected={activeView === stage.name}
            onClick={() => setView(stage.name)}
            className={cn(
              "rounded-full border-2 px-4 py-2 font-bold transition-colors",
              projector ? "text-base" : "text-xs",
              activeView === stage.name
                ? "border-astro-blue bg-astro-blue text-white shadow-soft"
                : "border-line/60 bg-white text-astro-navy hover:border-astro-blue",
            )}
          >
            {stage.name}
          </button>
        ))}
      </div>

      {activeStage ? (
        <StageTable
          key={activeStage.name}
          stage={activeStage}
          projector={projector}
          expandedKey={stageExpandedKey}
          onToggle={toggleStageExpanded}
        />
      ) : (
        <OverallTable
          data={data}
          stages={visibleStages}
          projector={projector}
          collapsedKeys={collapsedKeys}
          onToggle={toggleExpanded}
        />
      )}
    </section>
  );
}
