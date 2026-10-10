import { prisma } from "../lib/prisma";
import { createCredentialUser } from "../lib/users";

async function main() {
  await prisma.votingSession.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isOpen: false },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD belum diisi di .env — akun admin tidak dibuat.");
  } else if (!(await prisma.user.findUnique({ where: { email: adminEmail } }))) {
    await createCredentialUser({ name: "Panitia", email: adminEmail, password: adminPassword, role: "admin" });
    console.log(`Admin dibuat: ${adminEmail}`);
  }

  // Data contoh hanya dibuat jika SEED_SAMPLE=1 dan belum ada tim.
  if (process.env.SEED_SAMPLE === "1" && (await prisma.team.count()) === 0) {
    await prisma.team.createMany({
      data: [
        { name: "Tim Contoh A", order: 1, description: "Penampilan musik" },
        { name: "Tim Contoh B", order: 2, description: "Penampilan tari" },
        { name: "Tim Contoh C", order: 3, description: "Penampilan stand-up" },
      ],
    });
    await prisma.voter.createMany({
      data: [
        { nim: "1234567", name: "Penonton Contoh" },
        { email: "contoh@example.com", name: "Penonton Email" },
      ],
      skipDuplicates: true,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
