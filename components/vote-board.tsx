"use client";

import { useState, useTransition } from "react";
import { castVote } from "@/app/actions/vote";
import { TeamCard } from "@/components/team-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type BoardTeam = { id: number; name: string; photoUrl: string; description: string | null };

export function VoteBoard({ teams, isOpen }: { teams: BoardTeam[]; isOpen: boolean }) {
  const [selected, setSelected] = useState<BoardTeam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (!selected) return;
    const teamId = selected.id;
    startTransition(async () => {
      const result = await castVote(teamId);
      if (result?.error) {
        setError(result.error);
        setSelected(null);
      }
    });
  }

  return (
    <>
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((team, i) => (
          <TeamCard
            key={team.id}
            number={i + 1}
            name={team.name}
            photoUrl={team.photoUrl}
            description={team.description}
            action={
              <Button
                size="lg"
                full
                disabled={!isOpen}
                onClick={() => {
                  setError(null);
                  setSelected(team);
                }}
              >
                {isOpen ? "Vote Tim Ini" : "Voting Ditutup"}
              </Button>
            }
          />
        ))}
      </div>
      <ConfirmDialog
        open={selected !== null}
        loading={pending}
        title="Apakah kamu yakin memilih tim ini?"
        description={
          <>
            Kamu akan memilih <strong className="text-astro-navy">{selected?.name}</strong>. Suara yang sudah dikirim
            tidak bisa diubah.
          </>
        }
        confirmLabel="Ya, kirim suara"
        onConfirm={confirm}
        onCancel={() => setSelected(null)}
      />
    </>
  );
}
