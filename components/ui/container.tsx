import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Container({
  size = "md",
  className,
  ...props
}: ComponentProps<"div"> & { size?: "sm" | "md" | "lg" }) {
  const widths = { sm: "max-w-md", md: "max-w-3xl", lg: "max-w-6xl" };
  return <div className={cn("mx-auto w-full px-4 sm:px-6", widths[size], className)} {...props} />;
}
