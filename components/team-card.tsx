import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function TeamAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={`Foto ${name}`} loading="lazy" className={cn("object-cover", className)} />
  ) : (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-linear-to-br from-astro-sky to-astro-blue font-display text-3xl font-extrabold text-white",
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function TeamCard({
  name,
  members,
  photoUrl,
  description,
  number,
  action,
  highlighted = false,
}: {
  name: string;
  members?: string | null;
  photoUrl?: string;
  description?: string | null;
  number?: number;
  action?: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden p-0 transition-colors", highlighted && "border-astro-blue")}>
      <div className="relative">
        <TeamAvatar name={name} photoUrl={photoUrl} className="aspect-4/3 w-full" />
        {number !== undefined && (
          <span className="absolute left-3 top-3 rounded-full bg-astro-gold px-3 py-1 text-xs font-extrabold text-astro-navy shadow-gloss">
            Peserta #{number}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-extrabold text-astro-navy">{name}</h3>
          {members && <p className="mt-0.5 whitespace-pre-line text-sm font-medium text-astro-blue">{members}</p>}
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
    </Card>
  );
}
