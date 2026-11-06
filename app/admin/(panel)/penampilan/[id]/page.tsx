import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamAvatar } from "@/components/team-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatTile } from "@/components/ui/stat-tile";
import { prisma } from "@/lib/prisma";
import { getResults } from "@/lib/results";
import { CRITERIA, JUDGE_SHARE, VOTE_SHARE, weightedJudgeScore } from "@/lib/scoring";
import { getVotingSession } from "@/lib/voting-session";

export const metadata = { title: "Detail Penampilan — ASTRO Got Talent" };

export default async function AdminTeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { id: rawId } = await params;
  const teamId = Number(rawId);
  if (!Number.isInteger(teamId) || teamId <= 0) notFound();

  const { stage: stageParam } = await searchParams;

  const [team, session, teamStages, openStages, ballotStages, scoreStages] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
    }),
    getVotingSession(),
    prisma.stageTeam.findMany({
      where: { teamId },
      include: { stage: { select: { name: true } } },
    }),
    prisma.stage.findMany({
      where: { teams: { none: {} } },
      select: { name: true },
    }),
    prisma.ballot.findMany({
      where: { teamId, votedAt: { not: null } },
      distinct: ["stage"],
      select: { stage: true },
    }),
    prisma.judgeScore.findMany({
      where: { teamId },
      distinct: ["stage"],
      select: { stage: true },
    }),
  ]);

  if (!team) notFound();

  const activeStage = session.stage ?? "Penyisihan";

  // Hanya tampilkan babak yang diikuti penampilan ini (atau babak yang sudah ada suara/nilainya)
  const participantStages = [
    ...new Set([
      ...teamStages.map((st) => st.stage.name),
      ...openStages.map((os) => os.name),
      ...ballotStages.map((b) => b.stage),
      ...scoreStages.map((s) => s.stage),
    ]),
  ].filter(Boolean);

  const availableStages = ["Semua", ...participantStages];

  // Tentukan selectedStage yang valid
  let selectedStage = stageParam === "Semua" ? undefined : (stageParam || activeStage);
  if (selectedStage && !participantStages.includes(selectedStage)) {
    selectedStage = participantStages.includes(activeStage) ? activeStage : participantStages[0] || undefined;
  }

  // Ambil data hasil kalkulasi
  const results = await getResults(selectedStage);
  const teamResult = results.teams.find((t) => t.id === teamId);
  const rank = teamResult ? results.teams.indexOf(teamResult) + 1 : "-";

  // Ambil detail suara masuk untuk penampilan ini
  const ballots = await prisma.ballot.findMany({
    where: {
      teamId,
      votedAt: { not: null },
      ...(selectedStage ? { stage: selectedStage } : {}),
    },
    include: {
      qr: { select: { tableName: true, label: true } },
    },
    orderBy: { votedAt: "desc" },
  });

  // Ambil detail penilaian juri untuk penampilan ini
  const judgeScores = await prisma.judgeScore.findMany({
    where: {
      teamId,
      ...(selectedStage ? { stage: selectedStage } : {}),
    },
    include: {
      judge: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ stage: "asc" }, { updatedAt: "desc" }],
  });

  const totalVotes = results.totalVotes;
  const teamVotes = teamResult?.votes ?? ballots.length;
  const votePercent = totalVotes > 0 ? (teamVotes / totalVotes) * 100 : 0;
  const judgeScore = teamResult?.judgeScore ?? 0;
  const votingScore = teamResult?.votingScore ?? 0;
  const finalScore = teamResult?.finalScore ?? 0;

  const exportUrl = `/api/export?format=xlsx&teamId=${teamId}${selectedStage ? `&stage=${encodeURIComponent(selectedStage)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Tombol Navigasi Balik & Ekspor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href="/admin" variant="ghost" size="sm" className="gap-1.5 pl-2 text-astro-navy">
          ← Kembali ke Ringkasan
        </ButtonLink>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={exportUrl} variant="secondary" size="sm">
            Unduh Excel Penampilan Ini
          </ButtonLink>
          <ButtonLink href="/admin/penampilan" variant="secondary" size="sm">
            Kelola Penampilan
          </ButtonLink>
          <ButtonLink href="/admin/sesi" variant="secondary" size="sm">
            Kelola Sesi &amp; Babak
          </ButtonLink>
        </div>
      </div>

      {/* Profil Penampilan & Filter Babak */}
      <Card className="flex flex-col gap-5 border-2 border-astro-blue/20 bg-linear-to-r from-white via-white to-astro-sky/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <TeamAvatar
              name={team.name}
              photoUrl={team.photoUrl}
              className="size-20 shrink-0 rounded-2xl text-2xl shadow-soft"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-2xl font-extrabold text-astro-navy">{team.name}</span>
                <Badge tone="accent">Urutan #{team.order}</Badge>
                {rank !== "-" && (
                  <Badge tone={rank === 1 ? "accent" : "neutral"} className="font-bold">
                    Peringkat #{rank}
                  </Badge>
                )}
              </div>
              {team.members && (
                <p className="mt-1 whitespace-pre-line text-sm font-semibold text-astro-blue">
                  {team.members}
                </p>
              )}
              {team.description && (
                <p className="mt-1 text-xs text-muted">{team.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Babak (Hanya babak yang diikuti penampilan ini) */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Filter Babak:</span>
          {availableStages.map((st) => {
            const isSelected = (selectedStage ?? "Semua") === st;
            const query = st === "Semua" ? "?stage=Semua" : `?stage=${encodeURIComponent(st)}`;
            return (
              <Link
                key={st}
                href={`/admin/penampilan/${teamId}${query}`}
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

      {/* Statistik Keseluruhan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Skor Akhir"
          value={finalScore.toFixed(2)}
          hint="(Juri × 50%) + (Voting × 50%)"
        />
        <StatTile
          label="Suara Masuk"
          value={`${teamVotes} suara`}
          hint={`${votePercent.toFixed(1)}% dari total ${totalVotes} suara`}
        />
        <StatTile
          label="Nilai Voting"
          value={votingScore.toFixed(2)}
          hint="Dinormalisasi thd suara terbanyak"
        />
        <StatTile
          label="Nilai Rata-rata Juri"
          value={judgeScore.toFixed(2)}
          hint={`Dari ${judgeScores.length} juri`}
        />
      </div>

      {/* Formula Kalkulasi Skor Akhir */}
      <div className="flex flex-col gap-3 rounded-3xl border-2 border-astro-blue/30 bg-astro-blue/5 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-astro-blue/20 pb-2">
          <p className="font-display text-base font-extrabold text-astro-navy">
            Formula Perhitungan Skor Akhir
          </p>
          <Badge tone="accent" className="text-xs">
            Babak: {selectedStage || "Semua Babak"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm font-semibold text-astro-navy">
          <span>Skor Akhir =</span>
          <span className="rounded-xl border border-astro-blue/30 bg-white px-3 py-1.5 text-astro-blue shadow-2xs">
            (Juri: {judgeScore.toFixed(2)} × 50%)
          </span>
          <span>+</span>
          <span className="rounded-xl border border-astro-sky/40 bg-white px-3 py-1.5 text-astro-sky shadow-2xs">
            (Voting: {votingScore.toFixed(2)} × 50%)
          </span>
          <span>=</span>
          <span className="rounded-xl bg-astro-navy px-3.5 py-1.5 text-base font-bold text-astro-gold shadow-xs">
            {finalScore.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-muted">
          Bobot: 50% Nilai Juri (rata-rata nilai berbobot semua juri) + 50% Nilai Voting Penonton (dinormalisasi terhadap suara terbanyak).
        </p>
      </div>

      {/* BAGIAN 1: DETAIL PENILAIAN JURI */}
      <Card className="flex flex-col gap-4 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 p-5 pb-4">
          <div>
            <CardTitle>Rincian Penilaian Juri ({judgeScores.length} Juri)</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Bobot: Kreativitas &amp; Orisinalitas (30%), Teknis &amp; Kualitas (30%), Penguasaan Panggung (25%), Kostum (15%)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={judgeScores.length > 0 ? "success" : "neutral"}>
              {judgeScores.length > 0 ? "Sudah Ada Nilai" : "Belum Dinilai"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line/60 bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Nama Juri</th>
                <th className="px-4 py-3">Babak</th>
                <th className="px-4 py-3 text-right">Kreativitas (30%)</th>
                <th className="px-4 py-3 text-right">Teknis (30%)</th>
                <th className="px-4 py-3 text-right">Panggung (25%)</th>
                <th className="px-4 py-3 text-right">Kostum (15%)</th>
                <th className="px-4 py-3 text-right font-extrabold text-astro-navy">Nilai Berbobot</th>
                <th className="px-4 py-3 text-left">Catatan Komentar</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {judgeScores.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">
                    Belum ada juri yang memberikan nilai untuk penampilan ini di babak ini.
                  </td>
                </tr>
              ) : (
                judgeScores.map((js) => {
                  const weighted = weightedJudgeScore(js);
                  return (
                    <tr key={`${js.judgeId}-${js.stage}`} className="transition-colors hover:bg-astro-cyan-1/20">
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/juri/${js.judgeId}${selectedStage ? `?stage=${encodeURIComponent(selectedStage)}` : ""}`}
                          className="font-bold text-astro-navy hover:text-astro-blue hover:underline"
                        >
                          {js.judge.name}
                        </Link>
                        <p className="text-xs text-muted">{js.judge.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone="neutral" className="text-xs">
                          {js.stage}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">{js.kreativitas}</td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">{js.teknis}</td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">{js.panggung}</td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">{js.kostum}</td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                        <span className="text-base text-astro-blue">{weighted.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {js.notes ? (
                          <p className="max-w-[200px] truncate text-ink font-medium" title={js.notes}>
                            {js.notes}
                          </p>
                        ) : (
                          <span className="text-muted/60 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ButtonLink
                          href={`/admin/juri/${js.judgeId}${selectedStage ? `?stage=${encodeURIComponent(selectedStage)}` : ""}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-astro-blue"
                        >
                          Lihat Lembar Juri →
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

      {/* BAGIAN 2: DETAIL SUARA MASUK DARI PENONTON */}
      <Card className="flex flex-col gap-4 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 p-5 pb-4">
          <div>
            <CardTitle>Rincian Suara Penonton ({ballots.length} Suara)</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Daftar setiap perangkat/QR penonton yang memilih penampilan ini
            </p>
          </div>
          <div className="w-40">
            <ProgressBar value={teamVotes} max={Math.max(totalVotes, 1)} label="Persentase Suara" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line/60 bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-center">No</th>
                <th className="px-4 py-3">Waktu Vote</th>
                <th className="px-4 py-3">Lokasi / Baris Kursi Penonton</th>
                <th className="px-4 py-3">Babak / Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {ballots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    Belum ada suara voting masuk untuk penampilan ini di babak ini.
                  </td>
                </tr>
              ) : (
                ballots.map((b, idx) => (
                  <tr key={b.id} className="transition-colors hover:bg-astro-cyan-1/20">
                    <td className="px-4 py-3 text-center font-bold text-muted tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-astro-navy">
                      {b.votedAt ? new Date(b.votedAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-astro-navy">
                        {b.qr.label ?? b.qr.tableName ?? "Penonton"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral" className="text-xs">
                        {b.stage}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
