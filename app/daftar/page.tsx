import { BrandLogo } from "@/components/brand-logo";
import { Footer } from "@/components/footer";
import { RegistrationForm } from "@/components/registration-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Registrasi — ASTRO Got Talent",
  description: "Formulir pendaftaran acara ASTRO Got Talent. Isi Nama dan NIM untuk mendaftar.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center py-10 px-4">
        <Container size="sm" className="flex flex-col items-center gap-6">
          <BrandLogo height={48} />

          <Card className="w-full border-2 border-astro-blue/20 p-6 sm:p-8 shadow-soft-lg bg-white/95 backdrop-blur-sm">
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="rounded-full bg-astro-blue/10 px-3 py-1 text-xs font-bold text-astro-blue">
                Formulir Pendaftaran
              </span>
              <h1 className="mt-2 font-display text-2xl font-extrabold text-astro-navy sm:text-3xl">
                ASTRO Got Talent
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                Silakan lengkapi Nama dan NIM Anda untuk registrasi kehadiran/partisipasi.
              </p>
            </div>

            <RegistrationForm />
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

