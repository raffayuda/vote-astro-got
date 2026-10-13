import Image from "next/image";
import { redirect } from "next/navigation";
import { logoutVoter } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { assetUrl } from "@/lib/asset";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Terima kasih — ASTRO Got Talent" };

export default async function VoteDonePage() {
  const session = await requireRole("voter");
  const voter = await prisma.voter.findUnique({
    where: { userId: session.user.id },
    include: { team: { select: { name: true } } },
  });
  if (!voter?.votedAt) redirect("/vote");

  return (
    <>
      <main className="flex flex-1 flex-col justify-center py-10">
        <Container size="sm">
          <Card className="p-8 text-center">
            <Image
              src={assetUrl("/assets/mascots/cheer.svg")}
              alt="Maskot ASTRO bersorak"
              width={785}
              height={940}
              unoptimized
              className="animate-float mx-auto h-auto w-40"
            />
            <h1 className="mt-4 font-display text-2xl font-extrabold text-astro-navy">
              Terima kasih, suaramu sudah masuk!
            </h1>
            {voter.team && (
              <p className="mt-2 text-muted">
                Kamu memilih <strong className="text-astro-navy">{voter.team.name}</strong>.
              </p>
            )}
            <p className="mt-1 text-sm text-muted">Identitasmu sudah terkunci dan tidak bisa vote lagi.</p>
            <form action={logoutVoter} className="mt-6">
              <Button type="submit" size="lg">Selesai</Button>
            </form>
          </Card>
        </Container>
      </main>
      <Footer />
    </>
  );
}
