"use client";

import { useActionState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";

export type FormState = { ok?: boolean; message?: string; error?: string } | null;
export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Form yang memanggil server action dan menampilkan pesan error/sukses secara konsisten. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {/* col-span-full: di form grid (mis. Tambah Juri) notif melebar penuh, di form flex tidak berpengaruh. */}
      {state?.error && <Alert tone="error" className="col-span-full">{state.error}</Alert>}
      {state?.message && <Alert tone="success" className="col-span-full">{state.message}</Alert>}
      {children}
    </form>
  );
}
