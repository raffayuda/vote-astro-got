import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/cn";

/** Navbar pil melayang, mengikuti situs ASTRO: putih transparan, ring putih, blur. */
export function Navbar({
  links = [],
  action,
  size = "lg",
}: {
  links?: Array<{ href: string; label: string }>;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const widths = { sm: "max-w-md", md: "max-w-3xl", lg: "max-w-6xl" };
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 print:hidden">
      <div
        className={cn(
          "mx-auto flex h-14 w-full items-center justify-between gap-3 rounded-full bg-white/55 px-4 shadow-soft-sm ring-1 ring-white/70 backdrop-blur-md",
          widths[size],
        )}
      >
        <BrandLogo height={36} priority />
        <nav className="flex items-center gap-1 overflow-x-auto text-sm" aria-label="Utama">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 font-semibold tracking-tight text-astro-navy/60 transition-colors hover:text-astro-navy"
            >
              {l.label}
            </Link>
          ))}
          {action}
        </nav>
      </div>
    </header>
  );
}
