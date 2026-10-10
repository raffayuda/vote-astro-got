import { createTeam, deleteTeam, updateTeam } from "@/app/actions/admin";
import { TeamAvatar } from "@/components/team-card";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kelola Tim — ASTRO Got Talent" };

function TeamFields({ team }: { team?: { name: string; photoUrl: string; description: string | null; order: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input name="name" label="Nama tim" required defaultValue={team?.name} />
      <Input name="order" label="Urutan tampil" type="number" defaultValue={team?.order ?? 0} />
      <div className="sm:col-span-2">
        <Input
          name="photoUrl"
          label="Foto (URL atau path)"
          placeholder="/tim/nama-tim.jpg atau https://..."
          hint="Taruh file di folder public/tim lalu isi path-nya, atau pakai URL gambar."
          defaultValue={team?.photoUrl}
        />
      </div>
      <div className="sm:col-span-2">
        <Textarea name="description" label="Deskripsi singkat" defaultValue={team?.description ?? ""} />
      </div>
    </div>
  );
}

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: { _count: { select: { voters: true } } },
  });

  return (
    <>
      <Card>
        <CardTitle>Tambah Tim Finalis</CardTitle>
        <ActionForm action={createTeam} className="mt-4 flex flex-col gap-4">
          <TeamFields />
          <SubmitButton className="self-start">Tambah Tim</SubmitButton>
        </ActionForm>
      </Card>

      <section className="flex flex-col gap-3">
        <CardTitle>Daftar Tim ({teams.length})</CardTitle>
        {teams.map((team) => (
          <Card key={team.id}>
            <div className="flex items-center gap-4">
              <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="size-16 shrink-0 rounded-xl text-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold text-astro-navy">{team.name}</p>
                <p className="text-sm text-muted">
                  Urutan {team.order} · {team._count.voters} suara
                </p>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-astro-blue">Ubah / hapus</summary>
              <ActionForm action={updateTeam} className="mt-4 flex flex-col gap-4">
                <input type="hidden" name="id" value={team.id} />
                <TeamFields team={team} />
                <SubmitButton className="self-start" variant="secondary">Simpan Perubahan</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteTeam} className="mt-3">
                <input type="hidden" name="id" value={team.id} />
                <SubmitButton variant="danger" size="sm">Hapus Tim (suara &amp; nilai ikut terhapus)</SubmitButton>
              </ActionForm>
            </details>
          </Card>
        ))}
      </section>
    </>
  );
}
