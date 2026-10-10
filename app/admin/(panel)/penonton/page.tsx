import { addVoter, importVoters } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/ui/stat-tile";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Data Penonton — ASTRO Got Talent" };

const PREVIEW_LIMIT = 200;

export default async function AdminVotersPage() {
  const [total, voted, voters] = await Promise.all([
    prisma.voter.count(),
    prisma.voter.count({ where: { votedAt: { not: null } } }),
    prisma.voter.findMany({ orderBy: { id: "desc" }, take: PREVIEW_LIMIT }),
  ]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Terdaftar" value={total} />
        <StatTile label="Sudah vote" value={voted} />
        <StatTile label="Belum vote" value={total - voted} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Import dari Excel</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Unggah file .xlsx / .xls / .csv hasil formulir kehadiran. Baris pertama harus header:{" "}
            <code className="text-astro-blue">NIM</code>, <code className="text-astro-blue">Email</code>,{" "}
            <code className="text-astro-blue">Nama</code> (minimal salah satu dari NIM atau Email). Data yang sudah
            terdaftar dilewati.
          </p>
          <ActionForm action={importVoters} className="mt-4 flex flex-col gap-4">
            <FileDropzone name="file" accept=".xlsx,.xls,.csv" label="Pilih file Excel / CSV" hint=".xlsx, .xls, .csv" />
            <SubmitButton className="self-start" pendingText="Mengimpor...">Import Penonton</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <CardTitle>Tambah Manual</CardTitle>
          <ActionForm action={addVoter} className="mt-4 flex flex-col gap-4">
            <Input name="nim" label="NIM" />
            <Input name="email" label="Email" type="email" />
            <Input name="name" label="Nama (opsional)" />
            <SubmitButton className="self-start" variant="secondary">Tambah</SubmitButton>
          </ActionForm>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <CardTitle>
          Daftar Penonton{total > PREVIEW_LIMIT && ` (${PREVIEW_LIMIT} terbaru dari ${total})`}
        </CardTitle>
        <DataTable
          rows={voters}
          rowKey={(v) => v.id}
          empty="Belum ada penonton. Import file Excel untuk memulai."
          columns={[
            { header: "NIM", cell: (v) => v.nim ?? "—" },
            { header: "Email", cell: (v) => v.email ?? "—" },
            { header: "Nama", cell: (v) => v.name ?? "—" },
            {
              header: "Status",
              cell: (v) =>
                v.votedAt ? <Badge tone="success">Sudah vote</Badge> : <Badge>Belum vote</Badge>,
            },
          ]}
        />
      </section>
    </>
  );
}
