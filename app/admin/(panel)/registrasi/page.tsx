import { deleteAllRegistrations } from "@/app/actions/registration";
import { RegistrationTable } from "@/components/registration-table";
import { ActionForm } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { SubmitButton } from "@/components/ui/submit-button";
import { assetUrl } from "@/lib/asset";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Data Registrasi — ASTRO Got Talent" };

export default async function AdminRegistrasiPage() {
  await requireRole("admin");

  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayCount = registrations.filter(
    (r) => new Date(r.createdAt) >= startOfToday,
  ).length;

  const uniqueNims = new Set(registrations.map((r) => r.nim)).size;

  const serializedItems = registrations.map((r) => ({
    id: r.id,
    name: r.name,
    nim: r.nim,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Data Registrasi Penonton / Peserta</CardTitle>
          <p className="text-sm text-muted">
            Daftar respon dari formulir registrasi publik penonton di{" "}
            <a href={assetUrl("/agt/penonton/daftar")} target="_blank" className="font-semibold text-astro-blue hover:underline">
              /agt/penonton/daftar
            </a>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/api/registrasi-export?format=xlsx" variant="secondary" size="sm" prefetch={false}>
            Unduh Excel (.xlsx)
          </ButtonLink>
          <ButtonLink href="/api/registrasi-export?format=csv" variant="secondary" size="sm" prefetch={false}>
            Unduh CSV
          </ButtonLink>
          <ButtonLink href="/agt/penonton/daftar" target="_blank" variant="secondary" size="sm" prefetch={false}>
            Buka Form Registrasi ↗
          </ButtonLink>

          {registrations.length > 0 && (
            <ActionForm action={deleteAllRegistrations} className="inline">
              <SubmitButton
                variant="danger"
                size="sm"
                pendingText="Menghapus..."
                title="Hapus seluruh data registrasi"
              >
                Hapus Semua Data
              </SubmitButton>
            </ActionForm>
          )}
        </div>
      </div>

      {/* Statistik Cepat */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total Pendaftar" value={registrations.length} />
        <StatTile label="Pendaftar Hari Ini" value={todayCount} />
        <StatTile label="NIM Unik" value={uniqueNims} />
      </div>

      {/* Tabel Data Registrasi */}
      <RegistrationTable items={serializedItems} />
    </div>
  );
}

