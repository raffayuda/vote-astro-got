import { prisma } from "@/lib/prisma";
import { getVotingSession } from "@/lib/voting-session";

export async function ensureDefaultStages() {
  const count = await prisma.stage.count();
  if (count === 0) {
    const teams = await prisma.team.findMany({ select: { id: true } });
    const teamIds = teams.map((t) => t.id);

    await prisma.stage.create({
      data: {
        name: "Penyisihan",
        isActive: true,
        teams: {
          create: teamIds.map((teamId) => ({ teamId })),
        },
      },
    });

    await prisma.stage.create({
      data: {
        name: "Semi Final",
        isActive: false,
      },
    });

    await prisma.stage.create({
      data: {
        name: "Final",
        isActive: false,
      },
    });
  }
}

export async function getActiveStage() {
  await ensureDefaultStages();
  const session = await getVotingSession();

  let stage = await prisma.stage.findFirst({
    where: { isActive: true },
    include: { teams: { include: { team: true } } },
  });

  if (!stage) {
    stage = await prisma.stage.findFirst({
      where: { name: session.stage },
      include: { teams: { include: { team: true } } },
    });
  }

  if (!stage) {
    stage = await prisma.stage.findFirst({
      include: { teams: { include: { team: true } } },
    });
  }

  return stage;
}

