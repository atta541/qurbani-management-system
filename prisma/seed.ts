import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function requiredEnv(name: string): string {
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

  await prisma.animalConfig.createMany({
    data: [
      {
        kind: "GOAT",
        label: "Goat",
        portionsPerAnimal: 1,
        payasPerAnimal: 4,
        description: "1 portion, 4 payas per animal",
      },
      {
        kind: "COW_MALE",
        label: "Male Cow",
        portionsPerAnimal: 7,
        payasPerAnimal: 4,
        description: "7 portions, 4 payas per animal",
      },
      {
        kind: "COW_FEMALE",
        label: "Female Cow",
        portionsPerAnimal: 7,
        payasPerAnimal: 4,
        description: "7 portions, 4 payas per animal",
      },
      {
        kind: "CAMEL",
        label: "Camel",
        portionsPerAnimal: 14,
        payasPerAnimal: 4,
        description: "14 portions, 4 payas per animal",
      },
    ],
    skipDuplicates: true,
  });

  const currentYear = new Date().getFullYear();
  const eidDay1 = new Date(`${currentYear}-06-16T00:00:00.000Z`);
  const eidDay2 = new Date(`${currentYear}-06-17T00:00:00.000Z`);
  const eidDay3 = new Date(`${currentYear}-06-18T00:00:00.000Z`);

  const year = await prisma.year.upsert({
    where: { year: currentYear },
    update: { isActive: true },
    create: {
      year: currentYear,
      label: `Eid ul Adha ${currentYear}`,
      eidDay1,
      eidDay2,
      eidDay3,
      isActive: true,
    },
  });

  await prisma.year.updateMany({
    where: { id: { not: year.id } },
    data: { isActive: false },
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
