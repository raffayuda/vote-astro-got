import Link from "next/link";
import { createTeam, deleteTeam, updateTeam } from "@/app/actions/admin";
import { TeamAvatar } from "@/components/team-card";
import { ActionForm } from "@/components/ui/action-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { MembersField } from "@/components/ui/members-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { photoSrc } from "@/lib/asset";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kelola Penampilan — ASTRO Got Talent" };

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
      <span className="text-sm font-semibold text-astro-navy">Foto Penampilan</span>
      {current ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc(current)} alt="Foto penampilan saat ini" className="size-16 shrink-0 rounded-xl object-cover" />
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
      <Input id={`${idPrefix}-name`} name="name" label="Nama Penampilan" required defaultValue={team?.name} />
      <Input id={`${idPrefix}-order`} name="order" label="Urutan tampil" type="number" defaultValue={team?.order ?? 0} />
      <div className="sm:col-span-2">
        <MembersField
          id={`${idPrefix}-members`}
          name="members"
          label="Anggota Penampilan"
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
    include: { _count: { select: { ballots: { where: { votedAt: { not: null } } } } } },
  });

  return (
    <>
      <Card>
        <CardTitle>Tambah Penampilan</CardTitle>
        <ActionForm action={createTeam} className="mt-4 flex flex-col gap-4">
          <TeamFields idPrefix="new" />
          <SubmitButton className="self-start">Tambah Penampilan</SubmitButton>
        </ActionForm>
      </Card>

      <section className="flex flex-col gap-3">
        <CardTitle>Daftar Penampilan ({teams.length})</CardTitle>
        {teams.map((team) => (
          <Card key={team.id} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <TeamAvatar name={team.name} photoUrl={team.photoUrl} className="size-16 shrink-0 rounded-xl text-xl" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/penampilan/${team.id}`}
                    className="truncate font-display font-bold text-astro-navy hover:text-astro-blue hover:underline"
                  >
                    {team.name}
                  </Link>
                  {team.members && <p className="truncate text-sm text-astro-blue">{team.members.split("\n")[0]}</p>}
                  <p className="text-sm text-muted">
                    Urutan #{team.order} · {team._count.ballots} suara masuk
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ButtonLink href={`/admin/penampilan/${team.id}`} variant="secondary" size="sm">
                  Lihat Detail Suara &amp; Nilai →
                </ButtonLink>
              </div>
            </div>

            <details className="mt-2 rounded-xl border border-line/40 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-astro-blue">
                Ubah / Hapus Penampilan Ini
              </summary>
              <ActionForm action={updateTeam} className="mt-4 flex flex-col gap-4">
                <input type="hidden" name="id" value={team.id} />
                <TeamFields team={team} idPrefix={`team-${team.id}`} />
                <SubmitButton className="self-start" variant="secondary">Simpan Perubahan</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteTeam} className="mt-3">
                <input type="hidden" name="id" value={team.id} />
                <SubmitButton variant="danger" size="sm">Hapus Penampilan (suara &amp; nilai ikut terhapus)</SubmitButton>
              </ActionForm>
            </details>
          </Card>
        ))}
      </section>
    </>
  );
}

