import { prisma } from "@/lib/prisma";

export function getVotingSession() {
  return prisma.votingSession.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isOpen: false },
  });
}
