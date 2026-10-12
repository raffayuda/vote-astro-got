import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { startVoterSession } from "@/lib/voter-login";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Tujuan QR: {APP_URL}/{uuid}. Route statis (/admin, /vote, /juri, /api) selalu menang atas segmen dinamis ini.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!UUID.test(code)) return new Response("Not Found", { status: 404 });
  if (await isBlocked("voter")) redirect("/?e=blocked");

  const voter = await prisma.voter.findUnique({ where: { code: code.toLowerCase() } });
  if (!voter) {
    await registerFailure("voter");
    redirect("/?e=invalid");
  }
  if (voter.votedAt) redirect("/?e=used");

  if (!(await startVoterSession(voter))) redirect("/?e=error");
  redirect("/vote");
}
