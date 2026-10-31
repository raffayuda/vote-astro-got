import { prisma } from "@/lib/prisma";

export const DEFAULT_STAGES = ["Penyisihan", "Semi Final", "Final"] as const;

export async function getVotingSession() {
  return prisma.votingSession.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isOpen: false, stage: "Penyisihan" },
  });
}
