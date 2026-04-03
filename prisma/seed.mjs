import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function main() {
  const adminEmail = requiredEnv("ADMIN_EMAIL").toLowerCase();
  const adminPassword = requiredEnv("ADMIN_PASSWORD");

  const passwordHash = await hash(adminPassword, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { password: passwordHash, isActive: true },
    create: {
      name: "Admin",
      email: adminEmail,
      password: passwordHash,
      isActive: true,
    },
  });

  const currentYear = new Date().getFullYear();
  const year = await prisma.year.upsert({
    where: { year: currentYear },
    update: { isActive: true },
    create: {
      year: currentYear,
      label: `Eid ul Adha ${currentYear}`,
      eidDate: new Date(`${currentYear}-06-01T00:00:00.000Z`),
      isActive: true,
    },
  });

  await prisma.year.updateMany({
    where: { id: { not: year.id } },
    data: { isActive: false },
  });

  await prisma.animalType.createMany({
    data: [
      {
        name: "Goat",
        gender: null,
        totalPortions: 1,
        payasThreshold: 0,
        description: "Single portion",
      },
      {
        name: "Cow",
        gender: null,
        totalPortions: 7,
        payasThreshold: 4,
        description: "7 portions",
      },
      {
        name: "Camel",
        gender: null,
        totalPortions: 14,
        payasThreshold: 8,
        description: "14 portions",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

