import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto bg-astro-navy text-white print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-8 sm:px-8 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <span className="inline-flex h-14 items-center rounded-full border border-white bg-linear-to-b from-white via-white/50 to-white px-4 shadow-soft-sm">
            <BrandLogo height={34} />
          </span>
          <p className="max-w-xs text-center text-xs font-medium text-white/70 md:text-left">
            Ruang Tanpa Sekat, Tumpukan Bakat. Persembahan ASTRO STT-NF dan BEM STT-NF.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 md:items-end">
          <Image src="/assets/agt/logo-bem-sttnf.png" alt="BEM STT-NF" width={44} height={44} />
          <p className="text-center text-xs text-white/70 md:text-right">
            © 2026 ASTRO — Sekolah Tinggi Teknologi Terpadu Nurul Fikri
          </p>
        </div>
      </div>
    </footer>
  );
}
