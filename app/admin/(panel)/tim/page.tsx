import { createTeam, deleteTeam, updateTeam } from "@/app/actions/admin";
import { TeamAvatar } from "@/components/team-card";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kelola Tim — ASTRO Got Talent" };

type TeamRow = {
  name: string;
  members: string | null;
  photoUrl: string;
  description: string | null;
  order: number;
};

function PhotoField({ current }: { current?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-astro-navy">Foto tim</span>
      {current ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="Foto tim saat ini" className="size-16 shrink-0 rounded-xl object-cover" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="removePhoto" value="1" className="size-4 accent-astro-blue" />
            Hapus foto saat ini
          </label>
        </div>
      ) : (
        <p className="text-xs text-muted">Belum ada foto.</p>
      )}
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="w-full rounded-2xl border-2 border-astro-cyan-2 bg-white px-4 py-2.5 text-sm text-ink file:mr-3 file:rounded-xl file:border-0 file:bg-astro-blue file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
      />
      <p className="text-xs text-muted">
        Upload foto baru (jpg/png/webp/gif/svg, maksimal 3MB).
        {current ? " Jika memilih file baru, foto lama otomatis diganti." : ""}
      </p>
    </div>
  );
}

function TeamFields({ team, idPrefix }: { team?: TeamRow; idPrefix: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input id={`${idPrefix}-name`} name="name" label="Nama tim" required defaultValue={team?.name} />
      <Input id={`${idPrefix}-order`} name="order" label="Urutan tampil" type="number" defaultValue={team?.order ?? 0} />
      <div className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-members`}
          name="members"
          label="Anggota tim"
          placeholder="Contoh:&#10;Rina — vokal&#10;Bagas — gitar&#10;Sinta — drum"
          hint="Tulis nama tiap anggota, pisahkan dengan baris baru atau koma."
          defaultValue={team?.members ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <PhotoField current={team?.photoUrl || undefined} />
      </div>
      <div className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          label="Deskripsi singkat"
          defaultValue={team?.description ?? ""}
        />
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
          <TeamFields idPrefix="new" />
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
                {team.members && <p className="truncate text-sm text-astro-blue">{team.members.split("\n")[0]}</p>}
                <p className="text-sm text-muted">
                  Urutan {team.order} · {team._count.voters} suara
                </p>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-astro-blue">Ubah / hapus</summary>
              <ActionForm action={updateTeam} className="mt-4 flex flex-col gap-4">
                <input type="hidden" name="id" value={team.id} />
                <TeamFields team={team} idPrefix={`team-${team.id}`} />
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
