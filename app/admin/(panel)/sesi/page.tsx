import { activateStage, createStage, deleteStage, updateStageTeams } from "@/app/actions/stage";
import { toggleVoting } from "@/app/actions/vote";
import { StageTeamSelector } from "@/components/stage-team-selector";
import { TeamAvatar } from "@/components/team-card";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";
import { ensureDefaultStages, getActiveStage } from "@/lib/stages";
import { getVotingSession } from "@/lib/voting-session";

export const metadata = { title: "Kelola Sesi & Babak — ASTRO Got Talent" };

export default async function AdminStagesPage() {
  await ensureDefaultStages();

  const [stages, allTeams, activeStage, votingSession] = await Promise.all([
    prisma.stage.findMany({
      include: { teams: { include: { team: true }, orderBy: { team: { order: "asc" } } } },
      orderBy: { id: "asc" },
    }),
    prisma.team.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, order: true, photoUrl: true, members: true },
    }),
    getActiveStage(),
    getVotingSession(),
  ]);

  const activeStageName = activeStage?.name ?? votingSession.stage ?? "Penyisihan";
  const activeTeamsCount = activeStage?.teams.length ?? 0;

  return (
    <>
      {/* BANNER SESI AKTIF */}
      <Card className="flex flex-col gap-4 border-2 border-astro-blue/30 bg-linear-to-r from-white via-white to-astro-sky/15">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Sesi Berjalan</span>
              <Badge tone="success" className="animate-pulse">
                SEDANG AKTIF
              </Badge>
            </div>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-astro-navy">{activeStageName}</h1>
            <p className="mt-1 text-sm text-muted">
              {activeTeamsCount > 0
                ? `${activeTeamsCount} penampilan bertanding di babak ini. Penonton & Juri hanya melihat penampilan tersebut.`
                : "Semua penampilan terdaftar dapat dinilai & dipilih."}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge tone={votingSession.isOpen ? "success" : "danger"} className="text-sm">
              Status: {votingSession.isOpen ? "Voting Dibuka" : "Voting Ditutup"}
            </Badge>
            <form action={toggleVoting}>
              <Button type="submit" size="md" variant={votingSession.isOpen ? "danger" : "primary"}>
                {votingSession.isOpen ? "Tutup Voting" : "Buka Voting"}
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {/* BUAT SESI BARU */}
      <Card>
        <CardTitle>Tambah Sesi Baru</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Buat babak baru (contoh: <strong>Babak Final</strong>, <strong>Semi Final</strong>, dsb), lalu pilih penampilan mana saja yang lolos ke babak tersebut.
        </p>

        <ActionForm action={createStage} className="mt-5 flex flex-col gap-5">
          <div className="max-w-md">
            <Input
              id="new-stage-name"
              name="name"
              label="Nama Sesi / Babak"
              placeholder="Contoh: Babak Final (3 Besar)"
              required
              maxLength={40}
            />
          </div>

          <StageTeamSelector
            teams={allTeams}
            defaultSelectedIds={[]}
            idPrefix="new-stage"
          />

          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-astro-navy">
            <input type="checkbox" name="makeActive" value="1" className="size-4 accent-astro-blue" />
            Langsung jadikan sesi ini aktif sekarang
          </label>

          <SubmitButton className="self-start">Buat Sesi Baru</SubmitButton>
        </ActionForm>
      </Card>

      {/* DAFTAR SESI */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle>Daftar Sesi ({stages.length})</CardTitle>
          <span className="text-xs text-muted">Klik &quot;Aktifkan Sesi Ini&quot; untuk berpindah babak</span>
        </div>

        {stages.map((stage) => {
          const isActive = stage.isActive || stage.name === activeStageName;
          const stageTeams = stage.teams.map((st) => st.team);

          return (
            <Card
              key={stage.id}
              className={`flex flex-col gap-4 transition-all ${
                isActive ? "border-2 border-astro-blue bg-white shadow-soft-lg" : "bg-white/90"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-astro-navy">{stage.name}</h3>
                    {isActive ? (
                      <Badge tone="success">✓ Aktif Sekarang</Badge>
                    ) : (
                      <Badge tone="neutral">Tidak Aktif</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {stageTeams.length > 0
                      ? `${stageTeams.length} penampilan peserta terpilih`
                      : "Belum ada penampilan dipilih (semua penampilan akan tampil)"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <form
                      action={async () => {
                        "use server";
                        await activateStage(stage.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="primary">
                        Aktifkan Sesi Ini
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* Ringkasan Penampilan Peserta */}
              {stageTeams.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-astro-cyan-1/40 p-3">
                  <span className="text-xs font-bold text-astro-navy">Penampilan Peserta:</span>
                  {stageTeams.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-astro-cyan-2 bg-white px-2.5 py-1 text-xs font-semibold text-astro-navy shadow-2xs"
                    >
                      <TeamAvatar name={t.name} photoUrl={t.photoUrl} className="size-5 rounded-full text-2xs" />
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Accordion Kelola Penampilan & Hapus */}
              <details className="mt-1 rounded-2xl border border-line/50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-astro-blue hover:underline">
                  Kelola Penampilan Peserta di Sesi &quot;{stage.name}&quot;
                </summary>

                <div className="mt-4 flex flex-col gap-4">
                  <ActionForm action={updateStageTeams} className="flex flex-col gap-4">
                    <input type="hidden" name="stageId" value={stage.id} />
                    <StageTeamSelector
                      teams={allTeams}
                      defaultSelectedIds={stage.teams.map((st) => st.teamId)}
                      idPrefix={`edit-stage-${stage.id}`}
                    />
                    <SubmitButton variant="secondary" className="self-start">
                      Simpan Penampilan Peserta
                    </SubmitButton>
                  </ActionForm>

                  {stages.length > 1 && (
                    <div className="border-t border-line/40 pt-3">
                      <ActionForm action={deleteStage}>
                        <input type="hidden" name="stageId" value={stage.id} />
                        <SubmitButton variant="danger" size="sm">
                          Hapus Sesi &quot;{stage.name}&quot;
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  )}
                </div>
              </details>
            </Card>
          );
        })}
      </section>
    </>
  );
}
