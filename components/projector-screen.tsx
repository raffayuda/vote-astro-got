"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ScoreTransparency } from "@/components/score-transparency";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import type { TransparencyData } from "@/lib/transparency";

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="min-w-20 text-right font-mono text-sm font-bold text-astro-navy tabular-nums">
      {now
        ? now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "--:--:--"}
    </span>
  );
}

/** Layar proyektor: fullscreen, auto-refresh, tanpa navbar panel. */
export function ProjectorScreen({ initial }: { initial: TransparencyData }) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 5000);
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      clearInterval(refresh);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [router]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser menolak fullscreen (mis. iframe tanpa izin); tampilan tetap bisa dipakai.
    }
  };

  return (
    <div className="min-h-svh bg-linear-to-b from-sky-top via-sky-mid to-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/65 px-4 py-3 shadow-soft backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-4">
            <BrandLogo height={44} href={null} priority />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                ASTRO Got Talent
              </p>
              <h1 className="font-display text-2xl font-black text-astro-navy sm:text-3xl">
                Transparansi Penilaian
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={initial.isOpen ? "success" : "danger"}>
              {initial.isOpen ? "Voting Dibuka" : "Voting Ditutup"}
            </Badge>
            <Badge tone="accent">Babak {initial.activeStage}</Badge>
            <span className="flex items-center gap-1.5 rounded-full bg-ok/10 px-2.5 py-1 text-[11px] font-bold text-ok">
              <span className="size-2 animate-pulse rounded-full bg-ok" />
              LIVE
            </span>
            <LiveClock />
            <Button type="button" variant="secondary" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? "Keluar Layar Penuh" : "⛶ Layar Penuh"}
            </Button>
            <ButtonLink href="/admin" variant="ghost" size="sm">
              Panel
            </ButtonLink>
          </div>
        </header>

        <ScoreTransparency data={initial} projector heading={null} />

        <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px] text-muted">
          <span>Data diperbarui otomatis setiap 5 detik.</span>
          <span>Showcase 30% (100% juri) · Final 70% (50% juri + 50% voting)</span>
        </footer>
      </div>
    </div>
  );
}
