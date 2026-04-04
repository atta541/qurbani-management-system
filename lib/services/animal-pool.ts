/**
 * `AnimalPool` — total animals per `(Year, AnimalConfig)` with derived portions / payas.
 *
 * - Reads are cached per `yearId` (Next.js Data Cache + tag invalidation on write).
 * - Writes recompute `totalPortions` / `totalPayas` from `AnimalConfig` (single source of truth).
 */
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ANIMAL_CONFIGS_DATA_TAG } from "@/lib/services/animal-config";
import type { UpsertAnimalPoolFormValues } from "@/lib/validations/animal-pool";

/** Tag pattern for `revalidateTag` after pool writes. */
export function animalPoolsCacheTag(yearId: number): string {
  return `admin-animal-pools-year-${yearId}`;
}

export type AnimalPoolRowVm = {
  animalConfig: {
    id: number;
    /** Machine id (DB column `kind`). Optional in types for legacy cached RSC payloads. */
    code?: string;
    label: string;
    portionsPerAnimal: number;
    payasPerAnimal: number;
  };
  pool: null | {
    id: number;
    totalAnimals: number;
    totalPortions: number;
    totalPayas: number;
    notes: string | null;
    updatedAt: Date;
  };
};

async function listAnimalPoolsWithConfigsUncached(yearId: number): Promise<AnimalPoolRowVm[]> {
  const [configs, pools] = await Promise.all([
    prisma.animalConfig.findMany({
      select: {
        id: true,
        code: true,
        label: true,
        portionsPerAnimal: true,
        payasPerAnimal: true,
      },
      orderBy: { code: "asc" },
    }),
    prisma.animalPool.findMany({
      where: { yearId },
      select: {
        id: true,
        animalConfigId: true,
        totalAnimals: true,
        totalPortions: true,
        totalPayas: true,
        notes: true,
        updatedAt: true,
      },
    }),
  ]);

  const byConfig = new Map(pools.map((p) => [p.animalConfigId, p]));

  return configs.map((c) => {
    const p = byConfig.get(c.id);
    return {
      animalConfig: {
        id: c.id,
        code: c.code,
        label: c.label,
        portionsPerAnimal: c.portionsPerAnimal,
        payasPerAnimal: c.payasPerAnimal,
      },
      pool: p
        ? {
            id: p.id,
            totalAnimals: p.totalAnimals,
            totalPortions: p.totalPortions,
            totalPayas: p.totalPayas,
            notes: p.notes,
            updatedAt: p.updatedAt,
          }
        : null,
    };
  });
}

/**
 * Stable `unstable_cache` wrapper per `yearId` (dynamic cache key). Map avoids recreating
 * the cache factory on every request.
 */
const poolListCacheByYear = new Map<number, () => Promise<AnimalPoolRowVm[]>>();

function getCachedPoolList(yearId: number): () => Promise<AnimalPoolRowVm[]> {
  let cached = poolListCacheByYear.get(yearId);
  if (!cached) {
    const yid = yearId;
    cached = unstable_cache(
      async () => listAnimalPoolsWithConfigsUncached(yid),
      ["admin-animal-pools", String(yid), "v2"],
      { tags: [animalPoolsCacheTag(yid), ANIMAL_CONFIGS_DATA_TAG] },
    );
    poolListCacheByYear.set(yearId, cached);
  }
  return cached;
}

/** Merged view for the pools admin table (typically 4 rows — no pagination). */
export async function listAnimalPoolsWithConfigsForYear(yearId: number): Promise<AnimalPoolRowVm[]> {
  return getCachedPoolList(yearId)();
}

export type UpsertAnimalPoolResult =
  | { ok: true }
  | { ok: false; code: "CONFIG_NOT_FOUND" | "UNKNOWN"; message: string };

/**
 * Creates or updates a pool row; derived columns always follow `AnimalConfig`.
 */
export async function upsertAnimalPoolRecord(
  input: UpsertAnimalPoolFormValues,
): Promise<UpsertAnimalPoolResult> {
  try {
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

    const totalPortions = input.totalAnimals * config.portionsPerAnimal;
    const totalPayas = input.totalAnimals * config.payasPerAnimal;

    await prisma.animalPool.upsert({
      where: {
        yearId_animalConfigId: {
          yearId: input.yearId,
          animalConfigId: input.animalConfigId,
        },
      },
      create: {
        yearId: input.yearId,
        animalConfigId: input.animalConfigId,
        totalAnimals: input.totalAnimals,
        totalPortions,
        totalPayas,
        notes: input.notes ?? null,
      },
      update: {
        totalAnimals: input.totalAnimals,
        totalPortions,
        totalPayas,
        notes: input.notes ?? null,
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("[upsertAnimalPoolRecord]", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Could not save the pool. Try again or contact support.",
    };
  }
}
