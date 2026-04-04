/**
 * `SlaughterSchedule` — how many animals of each type are slaughtered on each Eid day.
 * Invariant: DAY_1 + DAY_2 + DAY_3 = `AnimalPool.totalAnimals` for the same year + type.
 */
import type { EidDay } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { animalPoolsCacheTag } from "@/lib/services/animal-pool";
import type { SaveSlaughterDistributionFormValues } from "@/lib/validations/slaughter-schedule";

const EID_DAYS: EidDay[] = ["DAY_1", "DAY_2", "DAY_3"];

export function slaughterSchedulesCacheTag(yearId: number): string {
  return `admin-slaughter-year-${yearId}`;
}

export type SlaughterScheduleRowVm = {
  animalConfig: {
    id: number;
    code?: string;
    label: string;
    portionsPerAnimal: number;
    payasPerAnimal: number;
  };
  pool: {
    id: number;
    totalAnimals: number;
  };
  /** Counts per day (defaults 0 if no row yet). */
  animalsByDay: Record<"DAY_1" | "DAY_2" | "DAY_3", number>;
};

async function listSlaughterScheduleRowsUncached(yearId: number): Promise<SlaughterScheduleRowVm[]> {
  const [pools, schedules] = await Promise.all([
    prisma.animalPool.findMany({
      where: { yearId },
      select: {
        id: true,
        animalConfigId: true,
        totalAnimals: true,
        animalConfig: {
          select: {
            id: true,
            code: true,
            label: true,
            portionsPerAnimal: true,
            payasPerAnimal: true,
          },
        },
      },
      orderBy: { animalConfigId: "asc" },
    }),
    prisma.slaughterSchedule.findMany({
      where: { yearId },
      select: {
        animalConfigId: true,
        eidDay: true,
        animalsCount: true,
      },
    }),
  ]);

  const byConfig = new Map<number, Record<"DAY_1" | "DAY_2" | "DAY_3", number>>();
  for (const s of schedules) {
    let m = byConfig.get(s.animalConfigId);
    if (!m) {
      m = { DAY_1: 0, DAY_2: 0, DAY_3: 0 };
      byConfig.set(s.animalConfigId, m);
    }
    if (s.eidDay === "DAY_1" || s.eidDay === "DAY_2" || s.eidDay === "DAY_3") {
      m[s.eidDay] = s.animalsCount;
    }
  }

  return pools.map((p) => {
    const c = p.animalConfig;
    const animalsByDay = byConfig.get(c.id) ?? { DAY_1: 0, DAY_2: 0, DAY_3: 0 };
    return {
      animalConfig: {
        id: c.id,
        code: c.code,
        label: c.label,
        portionsPerAnimal: c.portionsPerAnimal,
        payasPerAnimal: c.payasPerAnimal,
      },
      pool: { id: p.id, totalAnimals: p.totalAnimals },
      animalsByDay,
    };
  });
}

const slaughterListCacheByYear = new Map<number, () => Promise<SlaughterScheduleRowVm[]>>();

function getCachedSlaughterList(yearId: number): () => Promise<SlaughterScheduleRowVm[]> {
  let cached = slaughterListCacheByYear.get(yearId);
  if (!cached) {
    const yid = yearId;
    cached = unstable_cache(
      async () => listSlaughterScheduleRowsUncached(yid),
      ["admin-slaughter-schedule", String(yid), "v1"],
      {
        tags: [slaughterSchedulesCacheTag(yid), animalPoolsCacheTag(yid)],
      },
    );
    slaughterListCacheByYear.set(yearId, cached);
  }
  return cached;
}

/** One row per `AnimalPool` for the season (types with no pool are omitted). */
export async function listSlaughterScheduleRowsForYear(yearId: number): Promise<SlaughterScheduleRowVm[]> {
  return getCachedSlaughterList(yearId)();
}

export type SaveSlaughterDistributionResult =
  | { ok: true }
  | {
      ok: false;
      code: "NO_POOL" | "SUM_MISMATCH" | "CONFIG_NOT_FOUND" | "UNKNOWN";
      message: string;
    };

/**
 * Upserts three `SlaughterSchedule` rows. Recomputes portions/payas from `AnimalConfig`.
 */
export async function saveSlaughterDistribution(
  input: SaveSlaughterDistributionFormValues,
): Promise<SaveSlaughterDistributionResult> {
  const dayMap: Record<EidDay, number> = {
    DAY_1: input.day1,
    DAY_2: input.day2,
    DAY_3: input.day3,
  };

  try {
    const pool = await prisma.animalPool.findUnique({
      where: {
        yearId_animalConfigId: {
          yearId: input.yearId,
          animalConfigId: input.animalConfigId,
        },
      },
      select: { id: true, totalAnimals: true },
    });

    if (!pool) {
      return {
        ok: false,
        code: "NO_POOL",
        message: "No pool exists for this animal type. Set totals on the Pools page first.",
      };
    }

    const sum = input.day1 + input.day2 + input.day3;
    if (sum !== pool.totalAnimals) {
      return {
        ok: false,
        code: "SUM_MISMATCH",
        message: `Day 1–3 must add up to ${pool.totalAnimals} (pool total). Currently ${sum}.`,
      };
    }

    const config = await prisma.animalConfig.findUnique({
      where: { id: input.animalConfigId },
      select: { id: true, portionsPerAnimal: true, payasPerAnimal: true },
    });
    if (!config) {
      return {
        ok: false,
        code: "CONFIG_NOT_FOUND",
        message: "Animal type was not found. Refresh the page.",
      };
    }

    await prisma.$transaction(
      EID_DAYS.map((eidDay) => {
        const n = dayMap[eidDay];
        return prisma.slaughterSchedule.upsert({
          where: {
            yearId_animalConfigId_eidDay: {
              yearId: input.yearId,
              animalConfigId: input.animalConfigId,
              eidDay,
            },
          },
          create: {
            yearId: input.yearId,
            animalConfigId: input.animalConfigId,
            eidDay,
            animalsCount: n,
            portionsCount: n * config.portionsPerAnimal,
            payasCount: n * config.payasPerAnimal,
          },
          update: {
            animalsCount: n,
            portionsCount: n * config.portionsPerAnimal,
            payasCount: n * config.payasPerAnimal,
          },
        });
      }),
    );

    return { ok: true };
  } catch (e) {
    console.error("[saveSlaughterDistribution]", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Could not save the schedule. Try again.",
    };
  }
}
