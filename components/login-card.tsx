"use client";

import { useState, type ReactNode } from "react";
import { ActionForm, type FormAction } from "@/components/ui/action-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

function EyeIcon({ off, className }: { off?: boolean; className?: string }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

const ICONS = { shield: ShieldIcon, star: StarIcon } as const;

/** Kartu form login: dipakai panitia (shield) maupun juri (star). */
export function LoginCard({
  title,
  description,
  action,
  submitLabel,
  fields,
  footer,
  icon = "shield",
}: {
  title: string;
  description?: string;
  action: FormAction;
  submitLabel: string;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    inputMode?: "text" | "email" | "numeric";
  }>;
  footer?: ReactNode;
  icon?: keyof typeof ICONS;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = ICONS[icon];

  return (
    <Card className="w-full p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-astro-navy via-astro-blue to-astro-sky text-white shadow-gloss">
          <Icon className="size-7" />
        </span>
        <CardTitle className="mt-3 text-2xl">{title}</CardTitle>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <ActionForm action={action} className="mt-6 flex flex-col gap-4">
        {fields.map((f) =>
          f.type === "password" ? (
            <Input
              key={f.name}
              required
              {...f}
              type={showPassword ? "text" : "password"}
              placeholder={f.placeholder ?? `Masukkan ${f.label.toLowerCase()}`}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl text-muted transition",
                    "hover:bg-astro-cyan-2/40 hover:text-astro-navy",
                  )}
                >
                  <EyeIcon off={showPassword} className="size-5" />
                </button>
              }
            />
          ) : (
            <Input key={f.name} required {...f} placeholder={f.placeholder ?? `Masukkan ${f.label.toLowerCase()}`} />
          ),
        )}
        <SubmitButton size="lg" full pendingText="Memeriksa...">
          {submitLabel}
        </SubmitButton>
      </ActionForm>
      {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
    </Card>
  );
}
