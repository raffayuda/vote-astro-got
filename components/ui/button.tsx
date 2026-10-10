import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; full?: boolean };

// Gaya mengikuti tombol di situs ASTRO: pil, border putih, gradasi navy→biru→sky, kilau atas.
const variants: Record<ButtonVariant, string> = {
  primary:
    "border-white bg-linear-to-r from-astro-navy via-astro-blue to-astro-sky text-white ring-3 ring-white/70 shadow-gloss hover:brightness-110 hover:shadow-soft-lg hover:-translate-y-0.5",
  secondary:
    "border-astro-cyan-2 bg-white/80 text-astro-navy shadow-soft backdrop-blur-md hover:border-astro-blue hover:text-astro-blue",
  ghost: "border-transparent text-astro-navy/70 hover:bg-astro-navy/5 hover:text-astro-navy",
  danger: "border-bad/40 bg-white text-bad hover:bg-bad/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClass({ variant = "primary", size = "md", full = false }: StyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold tracking-wide whitespace-nowrap select-none",
    "transition-all duration-200 active:scale-[0.97]",
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-astro-blue/50",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    full && "w-full",
  );
}

export function Button({
  variant,
  size,
  full,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={cn(buttonClass({ variant, size, full }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  full,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={cn(buttonClass({ variant, size, full }), className)} {...props} />;
}
