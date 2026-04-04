/**
 * `DayPricing` — price per portion, stored full-animal total, and payas surcharge per `(Year, AnimalConfig, EidDay)`.
 *
 * - `pricePerPortion` is authoritative for booking line math.
 * - `totalPricePerAnimal` is persisted (rounded `pricePerPortion × portionsPerAnimal`) and edited in sync in the admin UI.
 *
 * Lists only animal types that have an **animal pool** for the year. Cached per `yearId` with tag invalidation.
 */
import type { EidDay } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ANIMAL_CONFIGS_DATA_TAG } from "@/lib/services/animal-config";
import { animalPoolsCacheTag } from "@/lib/services/animal-pool";
import { slaughterSchedulesCacheTag } from "@/lib/services/slaughter-schedule";
import type { SaveDayPricingForTypeFormValues } from "@/lib/validations/day-pricing";

const EID_DAYS: EidDay[] = ["DAY_1", "DAY_2", "DAY_3"];

/** Max |stored total − (portion × portions)| allowed after rounding (paisa slack). */
const TOTAL_PORTION_TOLERANCE = new Prisma.Decimal("0.05");

export function dayPricingCacheTag(yearId: number): string {
  return `admin-day-pricing-year-${yearId}`;
}

function decimalToString(d: Prisma.Decimal): string {
  return d.toFixed(2);
}

function eidDayLabel(eidDay: EidDay): string {
  if (eidDay === "DAY_1") return "Eid day 1";
  if (eidDay === "DAY_2") return "Eid day 2";
  return "Eid day 3";
}

export type DayPricingDayVm = {
  eidDay: "DAY_1" | "DAY_2" | "DAY_3";
  pricePerPortion: string;
  totalPricePerAnimal: string;
  payasExtraCharge: string;
  updatedAt: string | null;
  slaughterAnimalsOnDay: number;
};

export type DayPricingRowVm = {
  animalConfig: {
    id: number;
    code?: string;
    label: string;
    portionsPerAnimal: number;
    payasPerAnimal: number;
  };
  pool: { totalAnimals: number };
  days: DayPricingDayVm[];
};

async function listDayPricingRowsUncached(yearId: number): Promise<DayPricingRowVm[]> {
  const pools = await prisma.animalPool.findMany({
    where: { yearId },
    select: {
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
    orderBy: { animalConfig: { code: "asc" } },
  });

  if (pools.length === 0) {
    return [];
  }

  const configIds = pools.map((p) => p.animalConfig.id);

  const [pricingRows, slaughterRows] = await Promise.all([
    prisma.dayPricing.findMany({
      where: { yearId, animalConfigId: { in: configIds } },
      select: {
        animalConfigId: true,
        eidDay: true,
        pricePerPortion: true,
        totalPricePerAnimal: true,
        payasExtraCharge: true,
        updatedAt: true,
      },
    }),
    prisma.slaughterSchedule.findMany({
      where: { yearId, animalConfigId: { in: configIds } },
      select: { animalConfigId: true, eidDay: true, animalsCount: true },
    }),
  ]);

  const priceMap = new Map<string, (typeof pricingRows)[0]>();
  for (const row of pricingRows) {
    priceMap.set(`${row.animalConfigId}:${row.eidDay}`, row);
  }

  const slaughterMap = new Map<string, number>();
  for (const row of slaughterRows) {
    if (row.eidDay === "DAY_1" || row.eidDay === "DAY_2" || row.eidDay === "DAY_3") {
      slaughterMap.set(`${row.animalConfigId}:${row.eidDay}`, row.animalsCount);
    }
  }

  return pools.map((p) => {
    const c = p.animalConfig;
    const days: DayPricingDayVm[] = EID_DAYS.map((eidDay) => {
      const key = `${c.id}:${eidDay}`;
      const pr = priceMap.get(key);
      const slaughterAnimalsOnDay = slaughterMap.get(key) ?? 0;
      const portionStr = pr ? decimalToString(pr.pricePerPortion) : "0.00";
      const totalStr = pr ? decimalToString(pr.totalPricePerAnimal) : "0.00";
      return {
        eidDay,
        pricePerPortion: portionStr,
        totalPricePerAnimal: totalStr,
        payasExtraCharge: pr ? decimalToString(pr.payasExtraCharge) : "0.00",
        updatedAt: pr
          ? typeof pr.updatedAt === "string"
            ? pr.updatedAt
            : pr.updatedAt.toISOString()
          : null,
        slaughterAnimalsOnDay,
      };
    });
    return {
      animalConfig: {
        id: c.id,
        code: c.code,
        label: c.label,
        portionsPerAnimal: c.portionsPerAnimal,
        payasPerAnimal: c.payasPerAnimal,
      },
      pool: { totalAnimals: p.totalAnimals },
      days,
    };
  });
}

const dayPricingListCacheByYear = new Map<number, () => Promise<DayPricingRowVm[]>>();

function getCachedDayPricingList(yearId: number): () => Promise<DayPricingRowVm[]> {
  let cached = dayPricingListCacheByYear.get(yearId);
  if (!cached) {
    const yid = yearId;
    cached = unstable_cache(
      async () => listDayPricingRowsUncached(yid),
      ["admin-day-pricing", String(yid), "v2"],
      {
        tags: [
          dayPricingCacheTag(yid),
          animalPoolsCacheTag(yid),
          slaughterSchedulesCacheTag(yid),
          ANIMAL_CONFIGS_DATA_TAG,
        ],
      },
    );
    dayPricingListCacheByYear.set(yearId, cached);
  }
  return cached;
}

export async function listDayPricingRowsForYear(yearId: number): Promise<DayPricingRowVm[]> {
  return getCachedDayPricingList(yearId)();
}

export type SaveDayPricingForTypeResult =
  | { ok: true }
  | {
      ok: false;
      code: "NO_POOL" | "CONFIG_NOT_FOUND" | "TOTAL_PORTION_MISMATCH" | "UNKNOWN";
      message: string;
    };

const dayValues: Array<{
  eidDay: EidDay;
  totalKey: keyof Pick<SaveDayPricingForTypeFormValues, "day1Total" | "day2Total" | "day3Total">;
  priceKey: keyof Pick<SaveDayPricingForTypeFormValues, "day1Price" | "day2Price" | "day3Price">;
  payasKey: keyof Pick<
    SaveDayPricingForTypeFormValues,
    "day1PayasExtra" | "day2PayasExtra" | "day3PayasExtra"
  >;
}> = [
  { eidDay: "DAY_1", totalKey: "day1Total", priceKey: "day1Price", payasKey: "day1PayasExtra" },
  { eidDay: "DAY_2", totalKey: "day2Total", priceKey: "day2Price", payasKey: "day2PayasExtra" },
  { eidDay: "DAY_3", totalKey: "day3Total", priceKey: "day3Price", payasKey: "day3PayasExtra" },
];

export async function saveDayPricingForAnimalType(
  input: SaveDayPricingForTypeFormValues,
): Promise<SaveDayPricingForTypeResult> {
  try {
    const pool = await prisma.animalPool.findUnique({
      where: {
        yearId_animalConfigId: {
          yearId: input.yearId,
          animalConfigId: input.animalConfigId,
        },
      },
      select: { id: true },
    });

    if (!pool) {
      return {
        ok: false,
        code: "NO_POOL",
        message: "This animal type has no pool for this season. Set a pool first, then pricing.",
      };
    }

    const config = await prisma.animalConfig.findUnique({
      where: { id: input.animalConfigId },
      select: { id: true, portionsPerAnimal: true },
    });
    if (!config) {
      return {
        ok: false,
        code: "CONFIG_NOT_FOUND",
        message: "Animal type was not found. Refresh the page.",
      };
    }

    const portionsD = new Prisma.Decimal(config.portionsPerAnimal);

    for (const { eidDay, totalKey, priceKey } of dayValues) {
      const price = new Prisma.Decimal(input[priceKey]);
      const totalIn = new Prisma.Decimal(input[totalKey]);
      const expected = price.mul(portionsD).toDecimalPlaces(2);
      if (totalIn.minus(expected).abs().gt(TOTAL_PORTION_TOLERANCE)) {
        return {
          ok: false,
          code: "TOTAL_PORTION_MISMATCH",
          message: `${eidDayLabel(eidDay)}: full animal total must match ${config.portionsPerAnimal} × (price per portion) after rounding. Use the linked fields so they stay in sync.`,
        };
      }
    }

    await prisma.$transaction(
      dayValues.map(({ eidDay, priceKey, payasKey }) => {
        const price = new Prisma.Decimal(input[priceKey]);
        const payasExtra = new Prisma.Decimal(input[payasKey]);
        const totalStored = price.mul(portionsD).toDecimalPlaces(2);
        return prisma.dayPricing.upsert({
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
            pricePerPortion: price,
            totalPricePerAnimal: totalStored,
            payasExtraCharge: payasExtra,
          },
          update: {
            pricePerPortion: price,
            totalPricePerAnimal: totalStored,
            payasExtraCharge: payasExtra,
          },
        });
      }),
    );

    return { ok: true };
  } catch (e) {
    console.error("[saveDayPricingForAnimalType]", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Could not save pricing. Try again.",
    };
  }
}
