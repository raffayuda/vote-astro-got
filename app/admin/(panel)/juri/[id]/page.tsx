import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { prisma } from "@/lib/prisma";
import { CRITERIA, weightedJudgeScore } from "@/lib/scoring";
import { getVotingSession } from "@/lib/voting-session";

export const metadata = { title: "Detail Penilaian Juri — ASTRO Got Talent" };

export default async function AdminJudgeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { id } = await params;
  const { stage: stageParam } = await searchParams;

  const [judge, session, dbStages] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "judge" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    getVotingSession(),
    prisma.stage.findMany({ select: { name: true }, orderBy: { id: "asc" } }),
  ]);

  if (!judge) notFound();

  const activeStage = session.stage ?? "Penyisihan";
  const selectedStage = stageParam === "Semua" ? undefined : (stageParam || activeStage);

  const availableStages = [
    "Semua",
    ...new Set([...dbStages.map((s) => s.name), activeStage]),
  ];

  // Ambil penampilan yang bertanding di babak ini
  let teamWhere = {};
  if (selectedStage) {
    const stageRecord = await prisma.stage.findUnique({
      where: { name: selectedStage },
      include: { teams: true },
    });
    if (stageRecord && stageRecord.teams.length > 0) {
      teamWhere = { id: { in: stageRecord.teams.map((st) => st.teamId) } };
    }
  }

  const [teams, scores] = await Promise.all([
    prisma.team.findMany({
      where: teamWhere,
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, order: true, photoUrl: true, members: true },
    }),
    prisma.judgeScore.findMany({
      where: {
        judgeId: id,
        ...(selectedStage ? { stage: selectedStage } : {}),
      },
    }),
  ]);

  const scoreMap = new Map(scores.map((s) => [s.teamId, s]));

  // Hitung statistik penilaian juri ini
  const scoredTeamsCount = teams.filter((t) => scoreMap.has(t.id)).length;
  const weightedScores = teams
    .map((t) => {
      const s = scoreMap.get(t.id);
      return s ? weightedJudgeScore(s) : null;
    })
    .filter((w): w is number => w !== null);

  const avgScore =
    weightedScores.length > 0
      ? (weightedScores.reduce((a, b) => a + b, 0) / weightedScores.length).toFixed(2)
      : "-";
  const maxScore = weightedScores.length > 0 ? Math.max(...weightedScores).toFixed(2) : "-";
  const minScore = weightedScores.length > 0 ? Math.min(...weightedScores).toFixed(2) : "-";

  const exportUrl = `/api/export?format=xlsx&judgeId=${id}${selectedStage ? `&stage=${encodeURIComponent(selectedStage)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Tombol Kembali, Unduh & Navigasi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href="/admin" variant="ghost" size="sm" className="gap-1.5 pl-2 text-astro-navy">
          ← Kembali ke Ringkasan
        </ButtonLink>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={exportUrl} variant="secondary" size="sm">
            Unduh Excel Lembar Juri Ini
          </ButtonLink>
          <ButtonLink href="/admin/juri" variant="secondary" size="sm">
            Kelola Semua Juri
          </ButtonLink>
        </div>
      </div>

      {/* Profil Juri & Filter Babak */}
      <Card className="flex flex-col gap-5 border-2 border-astro-blue/20 bg-linear-to-r from-white via-white to-astro-sky/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-astro-navy to-astro-blue text-xl font-extrabold text-white shadow-soft">
              {judge.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-extrabold text-astro-navy">{judge.name}</span>
                <Badge tone="accent">Juri</Badge>
              </div>
              <p className="text-sm text-muted">{judge.email}</p>
            </div>
          </div>
        </div>

        {/* Filter Babak */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Filter Babak:</span>
          {availableStages.map((st) => {
            const isSelected = (selectedStage ?? "Semua") === st;
            const query = st === "Semua" ? "?stage=Semua" : `?stage=${encodeURIComponent(st)}`;
            return (
              <Link
                key={st}
                href={`/admin/juri/${id}${query}`}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-astro-blue text-white shadow-sm"
                    : "bg-surface-2 text-astro-navy/70 hover:bg-surface-3 hover:text-astro-navy"
                }`}
              >
                {st}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Statistik Penilaian */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Penampilan Dinilai" value={`${scoredTeamsCount} / ${teams.length}`} />
        <StatTile label="Rata-rata Nilai" value={avgScore} hint="Dari nilai berbobot" />
        <StatTile label="Nilai Tertinggi" value={maxScore} />
        <StatTile label="Nilai Terendah" value={minScore} />
      </div>

      {/* Tabel Blanko Penilaian Juri */}
      <Card className="flex flex-col gap-4 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 p-5 pb-4">
          <div>
            <CardTitle>Lembar Penilaian Juri — {judge.name}</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Babak: <strong className="text-astro-navy">{selectedStage || "Semua Babak"}</strong> · Bobot: Kreativitas (30%), Teknis (30%), Panggung (25%), Kostum (15%)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={scoredTeamsCount === teams.length && teams.length > 0 ? "success" : "neutral"}>
              {scoredTeamsCount === teams.length && teams.length > 0
                ? "Semua Penampilan Selesai Dinilai"
                : `${teams.length - scoredTeamsCount} Belum Dinilai`}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line/60 bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-center">No</th>
                <th className="px-4 py-3">Nama Penampilan</th>
                <th className="px-4 py-3 text-right">Kreativitas (30%)</th>
                <th className="px-4 py-3 text-right">Teknis (30%)</th>
                <th className="px-4 py-3 text-right">Panggung (25%)</th>
                <th className="px-4 py-3 text-right">Kostum (15%)</th>
                <th className="px-4 py-3 text-right font-extrabold text-astro-navy">Nilai Berbobot</th>
                <th className="px-4 py-3 text-left">Catatan Komentar</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted">
                    Belum ada penampilan di babak ini.
                  </td>
                </tr>
              ) : (
                teams.map((t, idx) => {
                  const s = scoreMap.get(t.id);
                  const isScored = Boolean(s);
                  const weighted = s ? weightedJudgeScore(s) : null;

                  return (
                    <tr key={t.id} className="transition-colors hover:bg-astro-cyan-1/20">
                      <td className="px-4 py-3.5 text-center font-bold text-muted tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/penampilan/${t.id}${selectedStage ? `?stage=${encodeURIComponent(selectedStage)}` : ""}`}
                          className="group flex items-center gap-3"
                        >
                          <TeamAvatar
                            name={t.name}
                            photoUrl={t.photoUrl}
                            className="size-10 rounded-xl text-sm"
                          />
                          <div>
                            <p className="font-bold text-astro-navy group-hover:text-astro-blue group-hover:underline">
                              {t.name}
                            </p>
                            {t.members && (
                              <p className="max-w-44 truncate text-xs text-muted">
                                {t.members.split("\n")[0]}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {isScored ? s!.kreativitas : <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {isScored ? s!.teknis : <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {isScored ? s!.panggung : <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {isScored ? s!.kostum : <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                        {weighted !== null ? (
                          <span className="text-base text-astro-blue">{weighted.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {s?.notes ? (
                          <p className="max-w-[200px] truncate text-ink font-medium" title={s.notes}>
                            {s.notes}
                          </p>
                        ) : (
                          <span className="text-muted/60 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge tone={isScored ? "success" : "neutral"} className="text-xs">
                          {isScored ? "Sudah Dinilai" : "Belum"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ButtonLink
                          href={`/admin/penampilan/${t.id}${selectedStage ? `?stage=${encodeURIComponent(selectedStage)}` : ""}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-astro-blue"
                        >
                          Detail Penampilan →
                        </ButtonLink>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
