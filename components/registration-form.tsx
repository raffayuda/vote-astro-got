"use client";

import { useActionState, useRef } from "react";
import { submitRegistration, type RegistrationResult } from "@/app/actions/registration";
import { Alert } from "@/components/ui/alert";

const WA_GROUP_URL =
  "https://chat.whatsapp.com/FWOTafGrQX59KEzj8bsJmU?s=cl&p=a&iam=2";

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 18.15c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.27-8.24 2.21 0 4.28.86 5.84 2.42a8.216 8.216 0 012.42 5.83c0 4.54-3.7 8.24-8.26 8.24zm4.53-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.15.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.35-.77-1.85c-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z"
      />
    </svg>
  );
}

function AlertIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function RegistrationForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<RegistrationResult | null, FormData>(
    async (_prev, formData) => {
      return await submitRegistration(null, formData);
    },
    null,
  );

  const handleReset = () => {
    formRef.current?.reset();
  };

  // ── Layar Konfirmasi Berhasil (Google Form Confirmation Style) ──────
  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header Card Tanggapan Direkam */}
        <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-xs">
          <div className="h-3 bg-linear-to-r from-sky-600 via-indigo-600 to-amber-500" />
          <div className="p-6 sm:p-7 flex flex-col gap-3">
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Formulir Registrasi Penonton ASTRO Got Talent
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckIcon className="size-5 shrink-0 text-emerald-600" />
              <span>Tanggapan Anda telah direkam. Terima kasih telah mendaftar sebagai penonton.</span>
            </div>
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50/90 p-3.5 text-xs text-gray-700">
              <span className="text-gray-500">Data pendaftaran tercatat: </span>
              <strong className="text-gray-900">{state.name}</strong>
              <span className="text-gray-400"> • </span>
              <span className="text-gray-500">NIM: </span>
              <strong className="font-mono text-gray-900">{state.nim}</strong>
            </div>
          </div>
        </div>

        {/* Card Ajakan Masuk Grup WhatsApp (Clean, Non-AI-Slop) */}
        <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white p-6 shadow-xs sm:p-7 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <WhatsAppIcon className="size-5 text-[#25D366]" />
              <h2 className="font-sans text-base sm:text-lg font-semibold text-gray-900">
                Grup WhatsApp Penonton
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Silakan bergabung ke grup WhatsApp resmi penonton untuk menerima jadwal rundown penampilan, informasi voting suara penonton, dan doorprize.
            </p>
          </div>

          <a
            href={WA_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#20ba59] active:bg-[#1da850]"
          >
            <WhatsAppIcon className="size-5 shrink-0" />
            <span>Gabung Grup WhatsApp Penonton</span>
          </a>
        </div>
      </div>
    );
  }

  // ── Layar Formulir (Google Form Style dengan Tema Astro) ────────────
  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3.5"
    >
      {/* 1. Header Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-xs">
        <div className="h-3 bg-linear-to-r from-sky-600 via-indigo-600 to-amber-500" />

        <div className="p-6 sm:p-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-sky-700">ASTRO 2026</span>
            <span>STT Terpadu Nurul Fikri</span>
          </div>

          <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Formulir Registrasi Penonton ASTRO Got Talent
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Formulir ini digunakan untuk mendata kehadiran penonton pada acara ASTRO Got Talent 2026.
          </p>

          <div className="mt-2 border-t border-gray-200 pt-3 text-xs text-red-600 font-medium">
            * Menunjukkan pertanyaan yang wajib diisi
          </div>
        </div>
      </div>

      {state?.error && (
        <Alert tone="error">{state.error}</Alert>
      )}

      {/* 2. Question Card 1: Nama Lengkap Penonton */}
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-xs transition-all focus-within:border-l-[5px] focus-within:border-l-sky-600 focus-within:pl-[calc(1.5rem-5px)] focus-within:shadow-md">
        <label htmlFor="reg-name" className="block text-base font-normal text-gray-900">
          Nama Lengkap Penonton <span className="text-red-600">*</span>
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Tuliskan nama lengkap Anda sesuai KTM / identitas mahasiswa
        </p>

        <div className="mt-5">
          <input
            id="reg-name"
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={100}
            disabled={isPending}
            placeholder="Jawaban Anda"
            className="w-full sm:max-w-md border-0 border-b border-gray-300 bg-transparent pb-1.5 pt-1 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-b-2 focus:border-sky-600 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Question Card 2: NIM Penonton */}
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-xs transition-all focus-within:border-l-[5px] focus-within:border-l-sky-600 focus-within:pl-[calc(1.5rem-5px)] focus-within:shadow-md">
        <label htmlFor="reg-nim" className="block text-base font-normal text-gray-900">
          Nomor Induk Mahasiswa (NIM) <span className="text-red-600">*</span>
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Masukkan NIM mahasiswa Anda yang masih aktif
        </p>

        <div className="mt-5">
          <input
            id="reg-nim"
            type="text"
            name="nim"
            required
            minLength={3}
            maxLength={30}
            disabled={isPending}
            placeholder="Jawaban Anda"
            className="w-full sm:max-w-md border-0 border-b border-gray-300 bg-transparent pb-1.5 pt-1 font-mono text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-b-2 focus:border-sky-600 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 4. Action Row */}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50"
        >
          {isPending ? "Mengirim..." : "Kirim"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50 hover:text-sky-900 disabled:opacity-50"
        >
          Kosongkan formulir
        </button>
      </div>

      <p className="mt-3 text-center text-2xs text-gray-400">
        Formulir Registrasi Penonton ASTRO Got Talent 2026
      </p>
    </form>
  );
}
