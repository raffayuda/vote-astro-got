import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appPath } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { getSessionFor, signOutCurrent } from "@/lib/session";
import { BALLOT_COOKIE, startVoterSession } from "@/lib/voter-login";

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

  // Sudah login sebagai penonton: lanjutkan ballot miliknya.
  if (session) {
    const ballot = await prisma.ballot.findUnique({ where: { userId: session.user.id } });
    if (ballot) {
      rememberDevice(ballot.deviceToken);
      if (ballot.votedAt) redirect(appPath("/vote/selesai"));
      if (qr.usedCount >= qr.maxUses) redirect(appPath("/?e=full"));
      if (ballot.qrId !== qr.id) {
        await prisma.ballot.update({ where: { id: ballot.id }, data: { qrId: qr.id } });
      }
      redirect(appPath("/vote"));
    }
    // Sesi voter lama tanpa ballot (mis. akun dibuat sebelum migrasi).
    await signOutCurrent();
  }

  // Perangkat yang sama pernah scan: lanjutkan ballot itu, jangan buat ballot baru.
  if (deviceToken) {
    const ballot = await prisma.ballot.findUnique({ where: { deviceToken } });
    if (ballot) {
      rememberDevice(ballot.deviceToken);
      if (ballot.votedAt) {
        if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
        redirect(appPath("/vote/selesai"));
      }
      if (qr.usedCount >= qr.maxUses) redirect(appPath("/?e=full"));
      if (ballot.qrId !== qr.id) {
        await prisma.ballot.update({ where: { id: ballot.id }, data: { qrId: qr.id } });
      }
      if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
      redirect(appPath("/vote"));
    }
  }

  if (qr.usedCount >= qr.maxUses) redirect(appPath("/?e=full"));

  const ballot = await prisma.ballot.create({ data: { qrId: qr.id } });
  rememberDevice(ballot.deviceToken);
  if (!(await startVoterSession(ballot))) redirect(appPath("/?e=error"));
  redirect(appPath("/vote"));
}
