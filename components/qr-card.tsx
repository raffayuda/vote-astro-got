import { BrandLogo } from "@/components/brand-logo";

/** Kartu cetak 1 QR = 1 kursi / baris tanpa border dan tanpa link URL (format 9 QR per halaman penuh). */
export function QrCard({ label, svg }: { label: string; svg: string; url?: string }) {
  return (
    <div className="flex h-full break-inside-avoid flex-col items-center justify-center rounded-2xl bg-white p-3 text-center text-ink print:p-0.5 print:gap-1 print:shadow-none">
      <BrandLogo height={34} href={null} className="print:h-7.5" />
      <div
        role="img"
        aria-label={`QR code ${label}`}
        className="aspect-square w-full max-w-44 [&>svg]:h-full [&>svg]:w-full print:w-[52mm] print:max-w-[52mm]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex flex-col items-center gap-0.5">
        <p className="font-display text-base font-extrabold leading-tight text-astro-navy print:text-[13px]">{label}</p>
        <p className="text-xs font-semibold text-astro-navy/70 print:text-[9.5px]">Scan untuk vote Astro Got Talent</p>
      </div>
    </div>
  );
}
