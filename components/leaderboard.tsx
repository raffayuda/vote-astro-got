"use client";

import Image from "next/image";
import { TeamAvatar } from "@/components/team-card";
import { Card, CardTitle } from "@/components/ui/card";
import { assetUrl } from "@/lib/asset";
import { cn } from "@/lib/cn";
import type { TeamResult } from "@/lib/results";

const MEDALS = ["/assets/medali1.png", "/assets/medali2.png", "/assets/medali3.png"];
const RING = ["ring-2 ring-astro-gold", "ring-1 ring-slate-300", "ring-1 ring-amber-600/40"];

/** Sorotan 3 besar klasemen sementara — terlihat sekilas tanpa membuka Excel. Klik kartu untuk rincian. */
export function Leaderboard({ teams, onSelect }: { teams: TeamResult[]; onSelect?: (id: number) => void }) {
  const top = teams.slice(0, 3);
  if (top.length === 0) return null;
  const hasData = teams.some((t) => t.votes > 0 || t.judgeCount > 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle>
          {hasData ? (
            <>Unggul sementara: <span className="text-astro-blue">{top[0].name}</span></>
          ) : (
            "Klasemen sementara"
          )}
        </CardTitle>
        <p className="text-xs text-muted">Diperbarui otomatis · Skor Akhir = Juri 50% + Voting 50%</p>
      </div>
      {hasData ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {top.map((t, i) => (
            <Card
              key={t.id}
              onClick={onSelect ? () => onSelect(t.id) : undefined}
              title={onSelect ? `Lihat rincian ${t.name}` : undefined}
              className={cn("flex items-center gap-3 p-4", RING[i], onSelect && "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-soft-lg")}
            >
              <div className="relative shrink-0">
                <TeamAvatar name={t.name} photoUrl={t.photoUrl} className="size-14 rounded-2xl text-lg" />
                <Image
                  src={assetUrl(MEDALS[i])}
                  alt={`Peringkat ${i + 1}`}
                  width={28}
                  height={28}
                  unoptimized
                  className="absolute -bottom-2 -right-2 size-7"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-extrabold text-astro-navy">
                  <span className="mr-1 text-muted tabular-nums">#{i + 1}</span>
                  {t.name}
                </p>
                <p className="text-2xl font-extrabold text-astro-blue tabular-nums">{t.finalScore.toFixed(2)}</p>
                <p className="truncate text-xs text-muted tabular-nums">
                  Juri {t.judgeScore.toFixed(1)} · Voting {t.votingScore.toFixed(1)} · {t.votes} suara
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-muted">Belum ada suara maupun nilai juri. Klasemen akan muncul di sini otomatis.</p>
        </Card>
      )}
    </section>
  );
}
