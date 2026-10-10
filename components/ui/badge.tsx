import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-astro-navy/8 text-astro-navy/70",
  brand: "bg-astro-blue/12 text-astro-blue",
  success: "bg-ok/12 text-ok",
  danger: "bg-bad/12 text-bad",
  accent: "bg-astro-gold/30 text-amber-800",
  // Pil pink "Open" seperti di situs ASTRO.
  open: "bg-linear-to-r from-astro-pink to-pink-400 text-white uppercase tracking-wide shadow-gloss",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
