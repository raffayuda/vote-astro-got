import Image from "next/image";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SwirlAccents } from "@/components/decor";
import { Footer } from "@/components/footer";
import { Alert } from "@/components/ui/alert";
import { assetUrl } from "@/lib/asset";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { getSessionFor } from "@/lib/session";
import { getVotingSession } from "@/lib/voting-session";

const MESSAGES: Record<string, string> = {
  invalid: "QR tidak dikenali. Pastikan kamu scan QR yang ada di mejamu.",
  used: "Suara dari QR ini sudah dipakai. Satu QR hanya bisa memilih satu kali.",
  blocked: "Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.",
  error: "Gagal membuka sesi voting. Scan ulang QR di mejamu.",
};

const STEPS = [
  "Cari QR code di mejamu",
  "Scan dengan kamera HP atau Google Lens",
  "Pilih tim favoritmu dan kirim suara",
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await getSessionFor("voter")) redirect("/vote");
  const [{ e }, { isOpen }] = await Promise.all([searchParams, getVotingSession()]);
  const message = e ? MESSAGES[e] : undefined;

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
              Pilih penampilan favoritmu. Satu QR, satu suara.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 text-left">
              {message && <Alert tone="error">{message}</Alert>}
              <Card className="p-6">
                <CardTitle className="text-xl">Scan QR di Mejamu</CardTitle>
                <ol className="mt-4 flex flex-col gap-3">
                  {STEPS.map((step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm font-medium text-ink">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-astro-gold font-display font-extrabold text-astro-navy shadow-gloss">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-xs text-muted">
                  Tidak perlu daftar atau memasukkan NIM. Voting hanya bisa dilakukan saat MC membuka sesi.
                </p>
              </Card>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-center">
            <div className="animate-float relative mx-auto w-[min(14rem,60vw)] sm:w-[min(20rem,48vw)] lg:w-[26rem]">
              <Image
                src={assetUrl("/assets/mascots/wave.svg")}
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
