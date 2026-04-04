/**
 * `AnimalConfig` CRUD for admin. `code` is the stable id (DB column `kind`).
 * Invalidating `ANIMAL_CONFIGS_DATA_TAG` also busts animal-pool list caches (see `animal-pool.ts`).
 */
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  CreateAnimalConfigFormValues,
  UpdateAnimalConfigFormValues,
} from "@/lib/validations/animal-config";

export const ANIMAL_CONFIGS_DATA_TAG = "admin-animal-configs";

export type AnimalConfigListItem = {
  id: number;
  code: string;
  label: string;
  portionsPerAnimal: number;
  payasPerAnimal: number;
  description: string | null;
  updatedAt: Date;
  _count: {
    animalPools: number;
    slaughterSchedules: number;
    dayPricing: number;
    timeSlots: number;
    bookings: number;
  };
};

async function listAnimalConfigsUncached(): Promise<AnimalConfigListItem[]> {
  return prisma.animalConfig.findMany({
    select: {
      id: true,
      code: true,
      label: true,
      portionsPerAnimal: true,
      payasPerAnimal: true,
      description: true,
      updatedAt: true,
      _count: {
        select: {
          animalPools: true,
          slaughterSchedules: true,
          dayPricing: true,
          timeSlots: true,
          bookings: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });
}

const getCachedAnimalConfigs = unstable_cache(
  async () => listAnimalConfigsUncached(),
  ["admin-animal-configs-list", "v1"],
  { tags: [ANIMAL_CONFIGS_DATA_TAG] },
);

export async function listAnimalConfigsForAdmin(): Promise<AnimalConfigListItem[]> {
  return getCachedAnimalConfigs();
}

export type MutateAnimalConfigResult =
  | { ok: true }
  | { ok: false; code: "DUPLICATE" | "NOT_FOUND" | "IN_USE" | "UNKNOWN"; message: string };

export async function createAnimalConfigRecord(
  input: CreateAnimalConfigFormValues,
): Promise<MutateAnimalConfigResult> {
  try {
    await prisma.animalConfig.create({
      data: {
        code: input.code,
        label: input.label,
        portionsPerAnimal: input.portionsPerAnimal,
        payasPerAnimal: input.payasPerAnimal,
        description: input.description ?? null,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, code: "DUPLICATE", message: "That code is already in use. Choose another." };
    }
    console.error("[createAnimalConfigRecord]", e);
    return { ok: false, code: "UNKNOWN", message: "Could not create the animal type. Try again." };
  }
}

export async function updateAnimalConfigRecord(
  input: UpdateAnimalConfigFormValues,
): Promise<MutateAnimalConfigResult> {
  try {
    await prisma.animalConfig.update({
      where: { id: input.id },
      data: {
        label: input.label,
        portionsPerAnimal: input.portionsPerAnimal,
        payasPerAnimal: input.payasPerAnimal,
        description: input.description ?? null,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, code: "NOT_FOUND", message: "This animal type no longer exists. Refresh the page." };
    }
    console.error("[updateAnimalConfigRecord]", e);
    return { ok: false, code: "UNKNOWN", message: "Could not update the animal type. Try again." };
  }
}

export async function deleteAnimalConfigRecord(id: number): Promise<MutateAnimalConfigResult> {
  try {
    const row = await prisma.animalConfig.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            animalPools: true,
            slaughterSchedules: true,
            dayPricing: true,
            timeSlots: true,
            bookings: true,
          },
        },
      },
    });
    if (!row) {
      return { ok: false, code: "NOT_FOUND", message: "This animal type no longer exists." };
    }
    const c = row._count;
    const inUse =
      c.animalPools > 0 ||
      c.slaughterSchedules > 0 ||
      c.dayPricing > 0 ||
      c.timeSlots > 0 ||
      c.bookings > 0;
    if (inUse) {
      return {
        ok: false,
        code: "IN_USE",
        message: "This type is used by pools, schedules, pricing, slots, or bookings. Remove those first.",
      };
    }

    await prisma.animalConfig.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    console.error("[deleteAnimalConfigRecord]", e);
    return { ok: false, code: "UNKNOWN", message: "Could not delete the animal type. Try again." };
  }
}
