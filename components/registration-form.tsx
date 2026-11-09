"use client";

import { useActionState, useState } from "react";
import { submitRegistration, type RegistrationResult } from "@/app/actions/registration";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const WA_GROUP_URL =
  "https://chat.whatsapp.com/FWOTafGrQX59KEzj8bsJmU?s=cl&p=a&iam=2";

export function RegistrationForm() {
  const [resetKey, setResetKey] = useState(0);
  const [state, formAction, isPending] = useActionState<RegistrationResult | null, FormData>(
    async (_prev, formData) => {
      return await submitRegistration(null, formData);
    },
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok/15 text-3xl text-ok ring-8 ring-ok/10">
          🎉
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-extrabold text-astro-navy">
            Pendaftaran Berhasil!
          </h2>
          <p className="text-sm text-muted">
            Terima kasih telah mendaftar di acara <strong className="text-astro-navy">ASTRO Got Talent</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-line/60 bg-surface-2 p-4 text-left">
          <div className="grid grid-cols-[80px_1fr] gap-1 text-xs">
            <span className="font-semibold text-muted">Nama:</span>
            <span className="font-bold text-astro-navy">{state.name}</span>
            <span className="font-semibold text-muted">NIM:</span>
            <span className="font-mono font-bold text-astro-blue">{state.nim}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5 text-left shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-xs">
              WA
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-emerald-950">
                Langkah Terakhir: Masuk Grup WhatsApp
              </p>
              <p className="text-xs text-emerald-900/80">
                Wajib bergabung untuk mendapatkan jadwal, nomor urut, dan informasi penting acara.
              </p>
            </div>
          </div>

          <a
            href={WA_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-display text-sm font-extrabold text-white shadow-soft transition-all hover:bg-emerald-700 active:scale-98"
          >
            <span>📱</span>
            <span>Gabung Grup WhatsApp Sekarang →</span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setResetKey((k) => k + 1)}
          className="text-xs font-semibold text-astro-blue hover:underline"
        >
          Daftarkan teman atau orang lain
        </button>
      </div>
    );
  }

  return (
    <form
      key={resetKey}
      action={formAction}
      className="flex flex-col gap-4 text-left"
    >
      {state?.error && (
        <Alert tone="error">{state.error}</Alert>
      )}

      <Input
        name="name"
        label="Nama Lengkap"
        placeholder="Masukkan nama lengkap Anda"
        required
        minLength={2}
        maxLength={100}
        disabled={isPending}
      />

      <Input
        name="nim"
        label="Nomor Induk Mahasiswa (NIM)"
        placeholder="mis. 240601231..."
        required
        minLength={3}
        maxLength={30}
        disabled={isPending}
      />

      <p className="text-2xs text-muted">
        Pastikan NIM dan Nama Lengkap yang Anda masukkan sudah benar sebelum menekan tombol di bawah.
      </p>

      <SubmitButton
        size="lg"
        pendingText="Mengirim pendaftaran..."
        className="w-full mt-2"
      >
        Kirim Pendaftaran
      </SubmitButton>
    </form>
  );
}

