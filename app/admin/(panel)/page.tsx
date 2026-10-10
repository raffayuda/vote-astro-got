import { toggleVoting } from "@/app/actions/vote";
import { LiveResults } from "@/components/live-results";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getResults } from "@/lib/results";

export const metadata = { title: "Panel Panitia — ASTRO Got Talent" };

export default async function AdminHomePage() {
  const results = await getResults();

  return (
    <>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Sesi Voting</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Buka saat MC mengumumkan voting resmi dimulai. Jika ditutup, tombol vote penonton tidak bisa ditekan.
          </p>
          <Badge tone={results.isOpen ? "success" : "danger"} className="mt-3">
            {results.isOpen ? "Sedang dibuka" : "Sedang ditutup"}
          </Badge>
        </div>
        <form action={toggleVoting}>
          <Button type="submit" size="lg" variant={results.isOpen ? "danger" : "primary"} full>
            {results.isOpen ? "Tutup Voting" : "Buka Voting"}
          </Button>
        </form>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Hasil &amp; Skor Akhir</CardTitle>
            <p className="text-sm text-muted">Skor Akhir = (Nilai Juri × 50%) + (Nilai Voting × 50%). Diperbarui otomatis.</p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/api/export?format=csv" variant="secondary" size="sm" prefetch={false}>
              Unduh CSV
            </ButtonLink>
            <ButtonLink href="/api/export?format=xlsx" variant="secondary" size="sm" prefetch={false}>
              Unduh Excel
            </ButtonLink>
          </div>
        </div>
        <LiveResults initial={results} />
        <p className="text-xs text-muted">
          Nilai Voting dinormalisasi: tim dengan suara terbanyak = 100, lainnya proporsional. Nilai Juri = rata-rata
          nilai berbobot semua juri.
        </p>
      </section>
    </>
  );
}
