import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appPath } from "@/lib/app-url";
import { assetUrl } from "@/lib/asset";
import { prisma } from "@/lib/prisma";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { getSessionFor } from "@/lib/session";
import { BALLOT_COOKIE, startVoterSession } from "@/lib/voter-login";
import { getVotingSession } from "@/lib/voting-session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function renderNoticeScreen({
  title,
  badgeText,
  badgeBg,
  badgeColor,
  description,
  infoBox,
}: {
  title: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  infoBox?: string;
}) {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — ASTRO Got Talent</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(180deg, #cbe8fb 0%, #edf6fd 60%, #ffffff 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #1e293b;
    }
    .card {
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid rgba(14, 165, 233, 0.2);
      box-shadow: 0 10px 30px -5px rgba(14, 116, 144, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      max-width: 440px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    }
    .accent-bar {
      height: 8px;
      background: linear-gradient(90deg, #0284c7 0%, #4f46e5 50%, #f59e0b 100%);
    }
    .content {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .logo {
      height: 48px;
      width: auto;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      background: ${badgeBg};
      color: ${badgeColor};
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
    }
    .desc {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
    }
    .desc strong {
      color: #0f172a;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      width: 100%;
    }
    .btn-refresh {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .btn-refresh:hover {
      background: #0369a1;
    }
    .btn-refresh:active {
      transform: scale(0.99);
    }
    .footer-text {
      margin-top: 20px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="accent-bar"></div>
    <div class="content">
      <img src="${assetUrl("/assets/agt/logo-astro-agt.png")}" alt="ASTRO Got Talent" class="logo" />
      <span class="badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        ${badgeText}
      </span>
      <h1 class="title">${title}</h1>
      <p class="desc">${description}</p>
      <div class="info-box">
        ${infoBox ?? "Silakan dengarkan arahan dari MC di panggung. Saat sesi voting resmi dibuka, Anda dapat menekan tombol di bawah untuk memeriksa status."}
      </div>
      <button type="button" class="btn-refresh" onclick="window.location.reload()">
        Periksa Status Voting
      </button>
    </div>
  </div>
  <p class="footer-text">ASTRO Got Talent 2026 • STT Terpadu Nurul Fikri</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

/**
 * Tujuan QR: {APP_URL}/{uuid}.
 * Saat voting ditutup: QR tidak melakukan redirect dan menampilkan status voting ditutup.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!UUID.test(code)) return new Response("Not Found", { status: 404 });

  if (await isBlocked("voter")) {
    return renderNoticeScreen({
      title: "Akses Dibatasi Sementara",
      badgeText: "Rate Limit",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      description: "Terlalu banyak percobaan yang gagal. Silakan tunggu beberapa menit sebelum mencoba lagi.",
    });
  }

  const qr = await prisma.qrCode.findUnique({ where: { code: code.toLowerCase() } });
  if (!qr) {
    await registerFailure("voter");
    return renderNoticeScreen({
      title: "QR Code Tidak Valid",
      badgeText: "Tidak Terdaftar",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      description: "QR Code ini tidak terdaftar di sistem. Pastikan Anda melakukan scan pada QR Code resmi yang disediakan panitia di lokasi acara.",
    });
  }

  const votingSession = await getVotingSession();
  const currentStage = votingSession.stage ?? "Penyisihan";
  const isShowcase = currentStage.toLowerCase() === "showcase";
  const isFinal = currentStage.toLowerCase() === "final";
  const isVotingClosed = !votingSession.isOpen || !isFinal;

  // JIKA VOTING DITUTUP: Jangan redirect, jangan buat ballot/sesi voter, tampilkan status langsung
  if (isVotingClosed) {
    const title = isShowcase
      ? "Babak Showcase — Khusus Penilaian Juri"
      : isFinal
        ? "Sesi Voting Sedang Ditutup"
        : "Voting Khusus Babak Final";
    const badgeText = isShowcase ? "Babak Showcase" : isFinal ? "Voting Ditutup" : "Final Only";
    const badgeBg = isShowcase || !isFinal ? "#e0f2fe" : "#fee2e2";
    const badgeColor = isShowcase || !isFinal ? "#0369a1" : "#b91c1c";
    const description = isShowcase
      ? "Saat ini acara sedang berlangsung pada <strong>Babak Showcase</strong>. Penilaian babak ini sepenuhnya dilakukan oleh Dewan Juri (bobot 30%). Voting suara penonton akan dibuka pada <strong>Babak Final</strong> (bobot 70%)."
      : isFinal
        ? "Sesi voting penonton saat ini belum dibuka atau sedang ditutup oleh panitia / MC. QR Code ini <strong>tidak aktif</strong> dan belum dapat digunakan."
        : "Voting penonton hanya dibuka pada <strong>Babak Final</strong> (bobot 70%). QR Code ini belum dapat digunakan pada babak ini.";
    const infoBox = isShowcase
      ? "Selamat menikmati penampilan peserta di babak Showcase! Siapkan dukungan Anda untuk babak Final nanti."
      : isFinal
        ? "Silakan dengarkan arahan dari MC di panggung. Saat MC mengumumkan sesi voting resmi dibuka, Anda dapat menekan tombol di bawah untuk memperbarui status."
        : "Silakan tunggu hingga Babak Final dimulai. Simpan QR Code ini untuk digunakan pada sesi voting Final.";

    return renderNoticeScreen({
      title,
      badgeText,
      badgeBg,
      badgeColor,
      description,
      infoBox,
    });
  }

  // ── VOTING DIBUKA: Proses registrasi ballot & sesi penonton ─────────
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(BALLOT_COOKIE)?.value;
  const session = await getSessionFor("voter");

  function rememberDevice(token: string) {
    cookieStore.set(BALLOT_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  // Kuota QR bersifat sekali pakai / lifetime (usedCount tidak direset per babak).

  // Sudah login sebagai penonton: cari ballot miliknya untuk babak aktif ini
  if (session) {
    const ballot = await prisma.ballot.findFirst({
      where: { userId: session.user.id, stage: currentStage },
    });
    if (ballot) {
      rememberDevice(ballot.deviceToken);
      if (ballot.votedAt) redirect(appPath("/vote/selesai"));
      if (qr.usedCount >= qr.maxUses) {
        return renderNoticeScreen({
          title: "Kuota Suara QR Penuh",
          badgeText: "Kuota Habis",
          badgeBg: "#fef3c7",
          badgeColor: "#92400e",
          description: `Kuota suara QR ini (${qr.maxUses} suara) sudah habis terpakai.`,
        });
      }
      if (ballot.qrId !== qr.id) {
        await prisma.ballot.update({ where: { id: ballot.id }, data: { qrId: qr.id } });
      }
      redirect(appPath("/vote"));
    }
    // Jika belum punya ballot untuk babak baru ini, buat ballot baru
    if (qr.usedCount < qr.maxUses) {
      const newBallot = await prisma.ballot.create({
        data: { qrId: qr.id, stage: currentStage, userId: session.user.id },
      });
      rememberDevice(newBallot.deviceToken);
      redirect(appPath("/vote"));
    } else {
      return renderNoticeScreen({
        title: "Kuota Suara QR Penuh",
        badgeText: "Kuota Habis",
        badgeBg: "#fef3c7",
        badgeColor: "#92400e",
        description: `Kuota suara QR ini (${qr.maxUses} suara) sudah habis terpakai.`,
      });
    }
  }

  // Perangkat yang sama pernah scan: cari ballot miliknya untuk babak aktif ini
  if (deviceToken) {
    const ballot = await prisma.ballot.findFirst({
      where: { deviceToken, stage: currentStage },
    });
    if (ballot) {
      rememberDevice(ballot.deviceToken);
      if (ballot.votedAt) {
        if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
        redirect(appPath("/vote/selesai"));
      }
      if (qr.usedCount >= qr.maxUses) {
        return renderNoticeScreen({
          title: "Kuota Suara QR Penuh",
          badgeText: "Kuota Habis",
          badgeBg: "#fef3c7",
          badgeColor: "#92400e",
          description: `Kuota suara QR ini (${qr.maxUses} suara) sudah habis terpakai.`,
        });
      }
      if (ballot.qrId !== qr.id) {
        await prisma.ballot.update({ where: { id: ballot.id }, data: { qrId: qr.id } });
      }
      if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
      redirect(appPath("/vote"));
    }
  }

  if (qr.usedCount >= qr.maxUses) {
    return renderNoticeScreen({
      title: "Kuota Suara QR Penuh",
      badgeText: "Kuota Habis",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      description: `Kuota suara QR ini (${qr.maxUses} suara) sudah habis terpakai.`,
    });
  }

  const ballot = await prisma.ballot.create({
    data: {
      qrId: qr.id,
      stage: currentStage,
      ...(deviceToken ? { deviceToken } : {}),
    },
  });
  rememberDevice(ballot.deviceToken);
  if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
  redirect(appPath("/vote"));
}
