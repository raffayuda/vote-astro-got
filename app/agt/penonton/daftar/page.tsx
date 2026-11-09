import { BrandLogo } from "@/components/brand-logo";
import { RegistrationForm } from "@/components/registration-form";

export const metadata = {
  title: "Registrasi Penonton — ASTRO Got Talent",
  description: "Formulir pendaftaran khusus penonton acara ASTRO Got Talent 2026. Lengkapi Nama dan NIM Anda.",
};

export default function RegisterAudiencePage() {
  return (
    <main className="min-h-screen bg-[#f0f4f9] px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {/* Logo Astro di atas formulir */}
        <div className="flex justify-center pb-1">
          <BrandLogo height={44} href={null} priority />
        </div>

        {/* Formulir Bergaya Google Form bertema Astro */}
        <RegistrationForm />
      </div>
    </main>
  );
}
