import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const tones = {
  error: "border-bad/40 bg-bad/8 text-bad",
  success: "border-ok/40 bg-ok/8 text-ok",
  info: "border-astro-cyan-2 bg-astro-blue/8 text-astro-navy",
} as const;

export function Alert({
  tone = "info",
  className,
  ...props
}: ComponentProps<"div"> & { tone?: keyof typeof tones }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", tones[tone], className)}
      {...props}
    />
  );
}
