import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-2xl border-2 border-astro-cyan-2 bg-white px-4 text-base text-ink placeholder:text-muted/60 " +
  "focus:border-astro-blue focus:outline-3 focus:outline-astro-blue/25";

function Field({ label, hint, id, children }: { label?: string; hint?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-astro-navy">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input({
  label,
  hint,
  trailing,
  className,
  id,
  ...props
}: ComponentProps<"input"> & { label?: string; hint?: string; trailing?: React.ReactNode }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} id={inputId}>
      <div className="relative">
        <input id={inputId} className={cn(fieldClass, "h-12", trailing ? "pr-12" : undefined, className)} {...props} />
        {trailing && (
          <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">{trailing}</span>
        )}
      </div>
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  className,
  id,
  ...props
}: ComponentProps<"textarea"> & { label?: string; hint?: string }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} id={inputId}>
      <textarea id={inputId} className={cn(fieldClass, "min-h-20 py-3", className)} {...props} />
    </Field>
  );
}
