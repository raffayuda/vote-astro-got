import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-astro-cyan-2/30", className)}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-astro-navy via-astro-blue to-astro-sky transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
