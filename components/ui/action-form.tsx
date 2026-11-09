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
  id,
  onSuccess,
  onError,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  id?: string;
  onSuccess?: (state: FormState) => void;
  onError?: (state: FormState) => void;
}) {
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    if (typeof action !== "function") {
      console.error("ActionForm: action is not a function. Value:", action);
      return { error: "Aksi tidak tersedia atau sesi telah berubah. Silakan refresh halaman." };
    }
    const res = await action(prev, formData);
    if (res?.ok) {
      onSuccess?.(res);
    } else if (res?.error) {
      onError?.(res);
    }
    return res;
  }, null);

  return (
    <form id={id} action={formAction} className={className}>
      {state?.error && <Alert tone="error" className="col-span-full">{state.error}</Alert>}
      {state?.message && <Alert tone="success" className="col-span-full">{state.message}</Alert>}
      {children}
    </form>
  );
}
