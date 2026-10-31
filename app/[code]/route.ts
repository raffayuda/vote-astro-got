import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appPath } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { getSessionFor, signOutCurrent } from "@/lib/session";
import { BALLOT_COOKIE, startVoterSession } from "@/lib/voter-login";
import { getVotingSession } from "@/lib/voting-session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Tujuan QR: {APP_URL}/vote/{uuid}. URL lama {APP_URL}/{uuid} dialihkan oleh next.config.
 * Route statis (/admin, /vote, /juri, /api) selalu menang atas segmen dinamis ini.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!UUID.test(code)) return new Response("Not Found", { status: 404 });
  if (await isBlocked("voter")) redirect(appPath("/?e=blocked"));

  const qr = await prisma.qrCode.findUnique({ where: { code: code.toLowerCase() } });
  if (!qr) {
    await registerFailure("voter");
    redirect(appPath("/?e=invalid"));
  }

  const votingSession = await getVotingSession();
  const currentStage = votingSession.stage ?? "Penyisihan";

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

  // Hitung pemakaian kuota pada QR ini khusus untuk babak/sesi aktif
  const usedInStage = await prisma.ballot.count({
    where: { qrId: qr.id, stage: currentStage, votedAt: { not: null } },
  });

  // Sudah login sebagai penonton: cari ballot miliknya untuk babak aktif ini
  if (session) {
    const ballot = await prisma.ballot.findFirst({
      where: { userId: session.user.id, stage: currentStage },
    });
    if (ballot) {
      rememberDevice(ballot.deviceToken);
      if (ballot.votedAt) redirect(appPath("/vote/selesai"));
      if (usedInStage >= qr.maxUses) redirect(appPath("/?e=full"));
      if (ballot.qrId !== qr.id) {
        await prisma.ballot.update({ where: { id: ballot.id }, data: { qrId: qr.id } });
      }
      redirect(appPath("/vote"));
    }
    // Jika belum punya ballot untuk babak baru ini, buat ballot baru
    if (usedInStage < qr.maxUses) {
      const newBallot = await prisma.ballot.create({
        data: { qrId: qr.id, stage: currentStage, userId: session.user.id },
      });
      rememberDevice(newBallot.deviceToken);
      redirect(appPath("/vote"));
    } else {
      redirect(appPath("/?e=full"));
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
      if (usedInStage >= qr.maxUses) redirect(appPath("/?e=full"));
      if (ballot.qrId !== qr.id) {
        await prisma.ballot.update({ where: { id: ballot.id }, data: { qrId: qr.id } });
      }
      if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
      redirect(appPath("/vote"));
    }
  }

  if (usedInStage >= qr.maxUses) redirect(appPath("/?e=full"));

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
