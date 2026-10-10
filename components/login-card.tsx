import type { ReactNode } from "react";
import { ActionForm, type FormAction } from "@/components/ui/action-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

/** Kartu form login: dipakai untuk penonton (1 field identitas) maupun staf (email + password). */
export function LoginCard({
  title,
  description,
  action,
  submitLabel,
  fields,
  footer,
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
}) {
  return (
    <Card className="p-6">
      <CardTitle className="text-xl">{title}</CardTitle>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <ActionForm action={action} className="mt-5 flex flex-col gap-4">
        {fields.map((f) => (
          <Input key={f.name} required {...f} />
        ))}
        <SubmitButton size="lg" full pendingText="Memeriksa...">
          {submitLabel}
        </SubmitButton>
      </ActionForm>
      {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
    </Card>
  );
}
