import { createJudge, deleteJudge } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
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
        {judges.length === 0 && <p className="text-sm text-muted">Belum ada juri.</p>}
        {judges.map((judge) => (
          <Card key={judge.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display font-semibold text-astro-navy">{judge.name}</p>
              <p className="text-sm text-muted">{judge.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={judge._count.scores >= teamCount && teamCount > 0 ? "success" : "neutral"}>
                {judge._count.scores}/{teamCount} tim dinilai
              </Badge>
              <ActionForm action={deleteJudge}>
                <input type="hidden" name="id" value={judge.id} />
                <SubmitButton variant="danger" size="sm">Hapus</SubmitButton>
              </ActionForm>
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}
