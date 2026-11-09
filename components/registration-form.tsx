"use client";

import { useActionState, useRef, useState } from "react";
import { submitRegistration, type RegistrationResult } from "@/app/actions/registration";
import { Alert } from "@/components/ui/alert";

const WA_GROUP_URL =
  "https://chat.whatsapp.com/FWOTafGrQX59KEzj8bsJmU?s=cl&p=a&iam=2";

export function RegistrationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);

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
      <div className="flex flex-col gap-4 animate-in fade-in duration-200">
        {/* Header Card Tanggapan Direkam */}
        <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-xs">
          <div className="h-3 bg-linear-to-r from-sky-600 via-indigo-600 to-amber-500" />
          <div className="p-6 sm:p-7 flex flex-col gap-3">
            <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Formulir Registrasi Penonton ASTRO Got Talent
            </h1>
            <p className="text-sm text-gray-800">
              Tanggapan Anda telah direkam. Terima kasih telah mendaftar sebagai penonton!
            </p>
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50/80 p-3.5 text-xs text-gray-700">
              <span className="text-gray-500">Data pendaftaran tercatat: </span>
              <strong className="text-gray-900">{state.name}</strong>
              <span className="text-gray-500"> • NIM: </span>
              <strong className="font-mono text-sky-700">{state.nim}</strong>
            </div>
          </div>
        </div>

        {/* Card Wajib Gabung Grup WhatsApp */}
        <div className="overflow-hidden rounded-xl border-2 border-emerald-500/70 bg-white p-6 shadow-xs sm:p-7 flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xl shadow-xs">
              WA
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-sans text-base sm:text-lg font-bold text-emerald-950">
                Langkah Wajib: Masuk ke Grup WhatsApp Penonton
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Seluruh pengumuman rundown penampilan, tata cara voting suara penonton di babak final, serta doorprize akan dibagikan langsung melalui grup resmi berikut:
              </p>
            </div>
          </div>

          <a
            href={WA_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-emerald-600 px-5 py-3.5 font-sans text-sm sm:text-base font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.99]"
          >
            <span>📱</span>
            <span>Gabung Grup WhatsApp Penonton Sekarang →</span>
          </a>
        </div>

        {/* Link Kirim Tanggapan Lain */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setResetCount((c) => c + 1)}
            className="text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline"
          >
            Kirim tanggapan lain untuk penonton lain
          </button>
        </div>
      </div>
    );
  }

  // ── Layar Formulir (Google Form Style dengan Tema Astro) ────────────
  return (
    <form
      key={resetCount}
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3.5"
    >
      {/* 1. Header Card (Top Bar Gradient Astro, Judul, Peringatan Penonton) */}
      <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-xs">
        {/* Accent Bar ala Google Form dengan warna khas ASTRO */}
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
            Selamat datang di ajang bakat <strong>ASTRO Got Talent</strong>! Formulir ini digunakan untuk mendata kehadiran penonton acara.
          </p>

          {/* Banner Peringatan: Khusus Penonton (Bukan Penampil) */}
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <div className="leading-relaxed">
              <strong className="font-bold">PEMBERITAHUAN KHUSUS PENONTON:</strong> Formulir ini hanya untuk <u>penonton / pendukung</u> (bukan untuk peserta yang tampil). Setelah mengirim formulir, pastikan bergabung ke Grup WhatsApp resmi penonton.
            </div>
          </div>

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

      {/* 4. Action Row (Kirim + Kosongkan Formulir bergaya Google Form) */}
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
        Formulir ini dibuat untuk Registrasi Penonton ASTRO Got Talent 2026.
      </p>
    </form>
  );
}
