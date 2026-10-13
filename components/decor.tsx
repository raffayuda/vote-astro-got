import Image from "next/image";
import { assetUrl } from "@/lib/asset";
import { cn } from "@/lib/cn";

/** Latar langit: gradasi biru muda → putih, awan, dan gelembung (sama seperti situs ASTRO). */
export function SkyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden">
      <div className="absolute inset-0 bg-linear-to-b from-sky-top via-sky-mid to-white" />
      <Image src={assetUrl("/assets/awan1.png")} alt="" width={220} height={220} unoptimized priority className="animate-drift absolute left-4 top-16 opacity-80" />
      <Image src={assetUrl("/assets/awan2.png")} alt="" width={170} height={170} unoptimized priority className="animate-drift absolute right-6 top-28 opacity-80" />
      <Image src={assetUrl("/assets/agt/bubble.png")} alt="" width={260} height={325} unoptimized className="absolute -left-16 top-[38%] hidden opacity-60 sm:block" />
      <Image src={assetUrl("/assets/agt/bubble.png")} alt="" width={200} height={250} unoptimized className="absolute -right-10 top-[62%] hidden opacity-60 sm:block" />
    </div>
  );
}

/** Aksen swirl kuning-biru di sisi layar (hanya desktop). */
export function SwirlAccents({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src={assetUrl("/assets/agt/swirl-left.svg")}
        alt=""
        aria-hidden
        className={cn("pointer-events-none absolute bottom-8 left-0 z-0 hidden h-[min(72%,38rem)] w-auto opacity-80 lg:block", className)}
      />
      <img
        src={assetUrl("/assets/agt/swirl-right.svg")}
        alt=""
        aria-hidden
        className={cn("pointer-events-none absolute bottom-8 right-0 z-0 hidden h-[min(72%,38rem)] w-auto opacity-80 lg:block", className)}
      />
    </>
  );
}
