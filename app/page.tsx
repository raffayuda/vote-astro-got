import Image from "next/image";
import { redirect } from "next/navigation";
import { verifyVoter } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { SwirlAccents } from "@/components/decor";
import { Footer } from "@/components/footer";
import { LoginCard } from "@/components/login-card";
import { Badge } from "@/components/ui/badge";
import { getSessionFor } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

export default async function HomePage() {
  if (await getSessionFor("voter")) redirect("/vote");
  const { isOpen } = await getVotingSession();

  return (
    <>
      <main className="relative isolate flex flex-1 flex-col overflow-x-clip">
        <SwirlAccents />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-4 px-4 py-10 sm:gap-6 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:pb-24">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Badge tone={isOpen ? "open" : "neutral"} className="px-3 py-1">
              {isOpen ? "Voting Dibuka" : "Voting Belum Dibuka"}
            </Badge>
            <div className="mt-4">
              <BrandLogo height={120} href={null} priority className="drop-shadow-lg" />
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-astro-navy sm:text-4xl">
              Astro Got Talent
            </h1>
            <p className="mt-2 max-w-md text-pretty text-base font-medium leading-relaxed text-astro-navy/75 sm:text-lg">
              Pilih penampilan favoritmu. Satu penonton, satu suara.
            </p>
            <div className="mt-6 w-full max-w-md text-left">
              <LoginCard
                title="Verifikasi Penonton"
                description="Masukkan NIM atau Email yang kamu daftarkan di formulir kehadiran."
                action={verifyVoter}
                submitLabel="Lanjut Voting"
                fields={[
                  {
                    name: "identity",
                    label: "NIM atau Email",
                    placeholder: "contoh: 1234567 atau nama@email.com",
                    autoComplete: "off",
                  },
                ]}
                footer="Hanya penonton yang sudah mengisi formulir kehadiran yang bisa voting."
              />
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-center">
            <div className="animate-float relative mx-auto w-[min(14rem,60vw)] sm:w-[min(20rem,48vw)] lg:w-[26rem]">
              <Image
                src="/assets/mascots/wave.svg"
                alt="Maskot ASTRO 2026"
                width={785}
                height={940}
                unoptimized
                priority
                className="h-auto w-full object-contain drop-shadow-[0_18px_28px_rgba(19,26,61,0.22)]"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
