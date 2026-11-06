import Link from "next/link";
import { createJudge, deleteJudge, updateJudgePasswordByAdmin } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kelola Juri — ASTRO Got Talent" };

export default async function AdminJudgesPage() {
  const [judges, teamCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "judge" },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { scores: true } } },
    }),
    prisma.team.count(),
  ]);

  return (
    <>
      <Card>
        <CardTitle>Tambah Juri</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Juri login di <code className="text-astro-blue">/juri/login</code> memakai email dan password ini.
        </p>
        <ActionForm action={createJudge} className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input name="name" label="Nama juri" required />
          <Input name="email" label="Email" type="email" required autoComplete="off" />
          <Input name="password" label="Password" type="text" required minLength={8} autoComplete="off" hint="Minimal 8 karakter." />
          <SubmitButton className="self-start sm:col-span-3">Tambah Juri</SubmitButton>
        </ActionForm>
      </Card>

      <section className="flex flex-col gap-3">
        <CardTitle>Daftar Juri ({judges.length})</CardTitle>
        {judges.length === 0 && <p className="text-sm text-muted">Belum ada juri terdaftar.</p>}
        {judges.map((judge) => (
          <Card key={judge.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  href={`/admin/juri/${judge.id}`}
                  className="font-display font-bold text-astro-navy hover:text-astro-blue hover:underline"
                >
                  {judge.name}
                </Link>
                <p className="text-sm text-muted">{judge.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={judge._count.scores >= teamCount && teamCount > 0 ? "success" : "neutral"}>
                  {judge._count.scores}/{teamCount} penampilan dinilai
                </Badge>
                <ButtonLink href={`/admin/juri/${judge.id}`} variant="secondary" size="sm">
                  Lihat Lembar Penilaian →
                </ButtonLink>
                <ActionForm action={deleteJudge}>
                  <input type="hidden" name="id" value={judge.id} />
                  <SubmitButton variant="danger" size="sm">Hapus</SubmitButton>
                </ActionForm>
              </div>
            </div>

            <details className="mt-1 w-full rounded-2xl border border-line/50 bg-astro-cyan-1/10 p-3.5">
              <summary className="cursor-pointer text-xs font-bold text-astro-blue hover:underline">
                Ubah Password Akun Juri ({judge.name})
              </summary>
              <ActionForm action={updateJudgePasswordByAdmin} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <input type="hidden" name="judgeId" value={judge.id} />
                <div className="flex-1">
                  <Input
                    name="password"
                    label={`Password Baru untuk ${judge.name}`}
                    type="text"
                    required
                    minLength={8}
                    placeholder="Masukkan password baru minimal 8 karakter..."
                    autoComplete="off"
                  />
                </div>
                <SubmitButton variant="secondary" size="md">
                  Simpan Password Baru
                </SubmitButton>
              </ActionForm>
            </details>
          </Card>
        ))}
      </section>
    </>
  );
}
