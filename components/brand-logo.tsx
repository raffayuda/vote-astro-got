import Image from "next/image";
import Link from "next/link";
import { assetUrl } from "@/lib/asset";
import { cn } from "@/lib/cn";

/** Logo ASTRO 2026 (versi Astro Got Talent). Rasio asli 256×187. */
export function BrandLogo({
  height = 40,
  href = "/",
  priority = false,
  className,
}: {
  height?: number;
  href?: string | null;
  priority?: boolean;
  className?: string;
}) {
  const img = (
    <Image
      src={assetUrl("/assets/agt/logo-astro-agt.png")}
      alt="ASTRO 2026"
      width={Math.round((height * 256) / 187)}
      height={height}
      unoptimized
      priority={priority}
      className={cn("w-auto object-contain", className)}
      style={{ height }}
    />
  );
  return href ? (
    <Link href={href} aria-label="ASTRO 2026 beranda" className="inline-flex shrink-0">
      {img}
    </Link>
  ) : (
    img
  );
}
