import { BrandLogo } from "@/components/brand-logo";

/** Kartu cetak 1 QR = 1 penonton. `svg` adalah markup SVG QR yang dibuat server (bukan input pengguna). */
export function QrCard({ label, url, svg }: { label: string; url: string; svg: string }) {
  return (
    <div className="flex break-inside-avoid flex-col items-center gap-2 rounded-3xl border-2 border-astro-cyan-2 bg-white p-4 text-center text-ink print:rounded-2xl print:shadow-none">
      <BrandLogo height={40} href={null} />
      <div
        role="img"
        aria-label={`QR code ${label}`}
        className="aspect-square w-full max-w-44 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="font-display text-lg font-extrabold text-astro-navy">{label}</p>
      <p className="text-xs font-semibold text-astro-navy/70">Scan untuk vote Astro Got Talent</p>
      <p className="w-full break-all text-[9px] leading-tight text-muted">{url}</p>
    </div>
  );
}
