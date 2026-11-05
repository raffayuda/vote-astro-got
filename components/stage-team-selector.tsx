"use client";

import { useState } from "react";
import { TeamAvatar } from "@/components/team-card";
import { Button } from "@/components/ui/button";

type SimpleTeam = {
  id: number;
  name: string;
  order: number;
  photoUrl: string;
  members: string | null;
};

export function StageTeamSelector({
  teams,
  defaultSelectedIds = [],
  name = "teamIds",
  idPrefix,
}: {
  teams: SimpleTeam[];
  defaultSelectedIds?: number[];
  name?: string;
  idPrefix: string;
}) {
  const [selected, setSelected] = useState<number[]>(defaultSelectedIds);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelected(teams.map((t) => t.id));
  const deselectAll = () => setSelected([]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-astro-navy">
          Pilih Penampilan yang Lolos / Masuk Sesi Ini ({selected.length} dari {teams.length} penampilan dipilih):
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={selectAll} className="h-7 px-2 text-xs">
            Pilih Semua
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={deselectAll} className="h-7 px-2 text-xs text-bad hover:bg-bad/10">
            Kosongkan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const isChecked = selected.includes(team.id);
          const inputId = `${idPrefix}-team-${team.id}`;
          return (
            <label
              key={team.id}
              htmlFor={inputId}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all ${
                isChecked
                  ? "border-astro-blue bg-astro-blue/5 shadow-xs"
                  : "border-astro-cyan-2/60 bg-white hover:border-astro-blue/50"
              }`}
            >
              <input
                id={inputId}
                type="checkbox"
                name={name}
                value={team.id}
                checked={isChecked}
                onChange={() => toggle(team.id)}
                className="size-4 shrink-0 rounded accent-astro-blue"
              />
              <TeamAvatar
                name={team.name}
                photoUrl={team.photoUrl}
                className="size-10 shrink-0 rounded-lg text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-astro-navy">{team.name}</p>
                <p className="truncate text-xs text-muted">
                  #{team.order} {team.members ? `· ${team.members.split("\n")[0]}` : ""}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
