"use client";

import Image from "next/image";
import Link from "next/link";
import { TeamAvatar } from "@/components/team-card";
import { Card, CardTitle } from "@/components/ui/card";
import { assetUrl } from "@/lib/asset";
import { cn } from "@/lib/cn";
import type { TeamResult } from "@/lib/results";

const MEDALS = ["/assets/medali1.png", "/assets/medali2.png", "/assets/medali3.png"];
const RING = ["ring-2 ring-astro-gold", "ring-1 ring-slate-300", "ring-1 ring-amber-600/40"];

/** Sorotan 3 besar klasemen sementara. Klik kartu untuk melihat detail penampilan. */
export function Leaderboard({
  teams,
  selectedStage,
}: {
  teams: TeamResult[];
  selectedStage?: string;
}) {
  const top = teams.slice(0, 3);
  if (top.length === 0) return null;
  const hasData = teams.some((t) => t.votes > 0 || t.judgeCount > 0);
  const stageQuery = selectedStage && selectedStage !== "Semua" ? `?stage=${encodeURIComponent(selectedStage)}` : "";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle>
          {hasData ? (
            <>Unggul Sementara: <span className="text-astro-blue">{top[0].name}</span></>
          ) : (
            "Klasemen Sementara Penampilan"
          )}
        </CardTitle>
        <p className="text-xs text-muted">Diperbarui otomatis · Skor Akhir = Juri 50% + Voting 50%</p>
      </div>
      {hasData ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {top.map((t, i) => (
            <Link
              key={t.id}
              href={`/admin/penampilan/${t.id}${stageQuery}`}
              title={`Buka detail penampilan ${t.name}`}
              className={cn(
                "group flex items-center gap-3 rounded-3xl border border-line/60 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg",
                RING[i]
              )}
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
                <p className="truncate font-display font-extrabold text-astro-navy group-hover:text-astro-blue group-hover:underline">
                  <span className="mr-1 text-muted tabular-nums">#{i + 1}</span>
                  {t.name}
                </p>
                <p className="text-2xl font-extrabold text-astro-blue tabular-nums">{t.finalScore.toFixed(2)}</p>
                <p className="truncate text-xs text-muted tabular-nums">
                  Juri {t.judgeScore.toFixed(1)} · Voting {t.votingScore.toFixed(1)} · {t.votes} suara
                </p>
                <span className="mt-1 block text-2xs font-semibold text-astro-blue/80">
                  Lihat detail suara &amp; nilai →
                </span>
              </div>
            </Link>
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
