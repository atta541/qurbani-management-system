/**
 * `TimeSlot` — collection windows per `(Year, AnimalConfig, EidDay)`.
 *
 * - `animalsAssigned` drives `totalPortions` / `totalPayas` from `AnimalConfig`.
 * - Sum of `animalsAssigned` across slots for a day/kind must not exceed
 *   `SlaughterSchedule.animalsCount` for that day (validated on create/update).
 */
import type { EidDay } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ANIMAL_CONFIGS_DATA_TAG } from "@/lib/services/animal-config";
import { animalPoolsCacheTag } from "@/lib/services/animal-pool";
import { slaughterSchedulesCacheTag } from "@/lib/services/slaughter-schedule";
import type {
  CreateTimeSlotFormValues,
  UpdateTimeSlotFormValues,
} from "@/lib/validations/time-slot";

const EID_ORDER: EidDay[] = ["DAY_1", "DAY_2", "DAY_3"];

export function timeSlotsCacheTag(yearId: number): string {
  return `admin-time-slots-year-${yearId}`;
}

export type TimeSlotRowVm = {
  id: number;
  slotLabel: string;
  startTimeIso: string;
  endTimeIso: string;
  /** `HH:MM` UTC for `<input type="time" />` */
  startHHMM: string;
  endHHMM: string;
  animalsAssigned: number;
  totalPortions: number;
  totalPayas: number;
  bookedPortions: number;
  bookedPayas: number;
  isActive: boolean;
  updatedAt: string;
};

export type TimeSlotDayGroupVm = {
  eidDay: EidDay;
  scheduleAnimals: number;
  assignedSum: number;
  remainingAnimals: number;
  slots: TimeSlotRowVm[];
};

export type TimeSlotAnimalGroupVm = {
  animalConfig: {
    id: number;
    code?: string;
    label: string;
    portionsPerAnimal: number;
    payasPerAnimal: number;
  };
  poolTotalAnimals: number;
  days: TimeSlotDayGroupVm[];
};

function utcHHMM(d: Date): string {
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function slotToVm(s: {
  id: number;
  slotLabel: string;
  startTime: Date;
  endTime: Date;
  animalsAssigned: number;
  totalPortions: number;
  totalPayas: number;
  bookedPortions: number;
  bookedPayas: number;
  isActive: boolean;
  updatedAt: Date;
}): TimeSlotRowVm {
  const start = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
  const end = s.endTime instanceof Date ? s.endTime : new Date(s.endTime);
  return {
    id: s.id,
    slotLabel: s.slotLabel,
    startTimeIso: start.toISOString(),
    endTimeIso: end.toISOString(),
    startHHMM: utcHHMM(start),
    endHHMM: utcHHMM(end),
    animalsAssigned: s.animalsAssigned,
    totalPortions: s.totalPortions,
    totalPayas: s.totalPayas,
    bookedPortions: s.bookedPortions,
    bookedPayas: s.bookedPayas,
    isActive: s.isActive,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
  };
}

function eidBaseDateUtc(year: { eidDay1: Date; eidDay2: Date; eidDay3: Date }, eidDay: EidDay): Date {
  const pick =
    eidDay === "DAY_1" ? year.eidDay1 : eidDay === "DAY_2" ? year.eidDay2 : year.eidDay3;
  const d = pick instanceof Date ? pick : new Date(pick);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

export function combineEidDateAndUtcHHMM(baseUtcMidnight: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const y = baseUtcMidnight.getUTCFullYear();
  const mo = baseUtcMidnight.getUTCMonth();
  const day = baseUtcMidnight.getUTCDate();
  return new Date(Date.UTC(y, mo, day, h, m, 0, 0));
}

async function listTimeSlotAdminVmUncached(yearId: number): Promise<TimeSlotAnimalGroupVm[]> {
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

  if (pools.length === 0) return [];

  const configIds = pools.map((p) => p.animalConfig.id);

  const [slots, slaughterRows] = await Promise.all([
    prisma.timeSlot.findMany({
      where: { yearId, animalConfigId: { in: configIds } },
      orderBy: [{ animalConfigId: "asc" }, { eidDay: "asc" }, { startTime: "asc" }],
    }),
    prisma.slaughterSchedule.findMany({
      where: { yearId, animalConfigId: { in: configIds } },
      select: { animalConfigId: true, eidDay: true, animalsCount: true },
    }),
  ]);

  const slaughterMap = new Map<string, number>();
  for (const r of slaughterRows) {
    if (r.eidDay === "DAY_1" || r.eidDay === "DAY_2" || r.eidDay === "DAY_3") {
      slaughterMap.set(`${r.animalConfigId}:${r.eidDay}`, r.animalsCount);
    }
  }

  const slotsByKey = new Map<string, typeof slots>();
  for (const s of slots) {
    const k = `${s.animalConfigId}:${s.eidDay}`;
    let arr = slotsByKey.get(k);
    if (!arr) {
      arr = [];
      slotsByKey.set(k, arr);
    }
    arr.push(s);
  }

  return pools.map((p) => {
    const c = p.animalConfig;
    const days: TimeSlotDayGroupVm[] = EID_ORDER.map((eidDay) => {
      const key = `${c.id}:${eidDay}`;
      const scheduleAnimals = slaughterMap.get(key) ?? 0;
      const daySlots = slotsByKey.get(key) ?? [];
      const assignedSum = daySlots.reduce((acc, s) => acc + s.animalsAssigned, 0);
      return {
        eidDay,
        scheduleAnimals,
        assignedSum,
        remainingAnimals: scheduleAnimals - assignedSum,
        slots: daySlots.map(slotToVm),
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
      poolTotalAnimals: p.totalAnimals,
      days,
    };
  });
}

const timeSlotListCacheByYear = new Map<number, () => Promise<TimeSlotAnimalGroupVm[]>>();

function getCachedTimeSlotList(yearId: number): () => Promise<TimeSlotAnimalGroupVm[]> {
  let cached = timeSlotListCacheByYear.get(yearId);
  if (!cached) {
    const yid = yearId;
    cached = unstable_cache(
      async () => listTimeSlotAdminVmUncached(yid),
      ["admin-time-slots", String(yid), "v1"],
      {
        tags: [
          timeSlotsCacheTag(yid),
          animalPoolsCacheTag(yid),
          slaughterSchedulesCacheTag(yid),
          ANIMAL_CONFIGS_DATA_TAG,
        ],
      },
    );
    timeSlotListCacheByYear.set(yearId, cached);
  }
  return cached;
}

export async function listTimeSlotAdminGroupsForYear(yearId: number): Promise<TimeSlotAnimalGroupVm[]> {
  return getCachedTimeSlotList(yearId)();
}

export type MutateTimeSlotResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "NO_POOL"
        | "EXCEEDS_SLAUGHTER"
        | "BOOKINGS_BLOCK_DELETE"
        | "BOOKINGS_BLOCK_SHRINK"
        | "UNKNOWN";
      message: string;
    };

async function sumAnimalsAssignedForDay(
  yearId: number,
  animalConfigId: number,
  eidDay: EidDay,
  excludeSlotId?: number,
): Promise<number> {
  const rows = await prisma.timeSlot.findMany({
    where: {
      yearId,
      animalConfigId,
      eidDay,
      ...(excludeSlotId != null ? { id: { not: excludeSlotId } } : {}),
    },
    select: { animalsAssigned: true },
  });
  return rows.reduce((a, r) => a + r.animalsAssigned, 0);
}

export async function createTimeSlotRecord(
  input: CreateTimeSlotFormValues,
  yearRow: { id: number; eidDay1: Date; eidDay2: Date; eidDay3: Date },
): Promise<MutateTimeSlotResult> {
  try {
    const pool = await prisma.animalPool.findUnique({
      where: {
        yearId_animalConfigId: { yearId: input.yearId, animalConfigId: input.animalConfigId },
      },
      select: { id: true },
    });
    if (!pool) {
      return {
        ok: false,
        code: "NO_POOL",
        message: "This animal type has no pool for this season.",
      };
    }

    const config = await prisma.animalConfig.findUnique({
      where: { id: input.animalConfigId },
      select: { id: true, portionsPerAnimal: true, payasPerAnimal: true },
    });
    if (!config) {
      return { ok: false, code: "NOT_FOUND", message: "Animal type was not found." };
    }

    const slaughter = await prisma.slaughterSchedule.findUnique({
      where: {
        yearId_animalConfigId_eidDay: {
          yearId: input.yearId,
          animalConfigId: input.animalConfigId,
          eidDay: input.eidDay,
        },
      },
      select: { animalsCount: true },
    });
    const cap = slaughter?.animalsCount ?? 0;
    const currentSum = await sumAnimalsAssignedForDay(input.yearId, input.animalConfigId, input.eidDay);
    if (currentSum + input.animalsAssigned > cap) {
      return {
        ok: false,
        code: "EXCEEDS_SLAUGHTER",
        message: `Animals in slots (${currentSum + input.animalsAssigned}) would exceed the slaughter plan for this day (${cap}). Add slaughter capacity or reduce slot sizes.`,
      };
    }

    const base = eidBaseDateUtc(yearRow, input.eidDay);
    const startTime = combineEidDateAndUtcHHMM(base, input.startTime);
    const endTime = combineEidDateAndUtcHHMM(base, input.endTime);

    const totalPortions = input.animalsAssigned * config.portionsPerAnimal;
    const totalPayas = input.animalsAssigned * config.payasPerAnimal;

    await prisma.timeSlot.create({
      data: {
        yearId: input.yearId,
        animalConfigId: input.animalConfigId,
        eidDay: input.eidDay,
        slotLabel: input.slotLabel,
        startTime,
        endTime,
        animalsAssigned: input.animalsAssigned,
        totalPortions,
        totalPayas,
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("[createTimeSlotRecord]", e);
    return { ok: false, code: "UNKNOWN", message: "Could not create the time slot." };
  }
}

export async function updateTimeSlotRecord(
  input: UpdateTimeSlotFormValues,
  yearRow: { id: number; eidDay1: Date; eidDay2: Date; eidDay3: Date },
): Promise<MutateTimeSlotResult> {
  try {
    const existing = await prisma.timeSlot.findFirst({
      where: { id: input.timeSlotId, yearId: input.yearId },
      select: {
        id: true,
        animalConfigId: true,
        eidDay: true,
        bookedPortions: true,
        bookedPayas: true,
      },
    });
    if (!existing) {
      return { ok: false, code: "NOT_FOUND", message: "That time slot no longer exists." };
    }

    const config = await prisma.animalConfig.findUnique({
      where: { id: existing.animalConfigId },
      select: { portionsPerAnimal: true, payasPerAnimal: true },
    });
    if (!config) {
      return { ok: false, code: "NOT_FOUND", message: "Animal type was not found." };
    }

    const minAnimalsForPortions = Math.ceil(existing.bookedPortions / config.portionsPerAnimal);
    const minAnimalsForPayas = Math.ceil(existing.bookedPayas / config.payasPerAnimal);
    const minAnimals = Math.max(minAnimalsForPortions, minAnimalsForPayas, 0);
    if (input.animalsAssigned < minAnimals) {
      return {
        ok: false,
        code: "BOOKINGS_BLOCK_SHRINK",
        message: `This slot already has bookings. You need at least ${minAnimals} animals assigned to cover booked portions/payas.`,
      };
    }

    const slaughter = await prisma.slaughterSchedule.findUnique({
      where: {
        yearId_animalConfigId_eidDay: {
          yearId: input.yearId,
          animalConfigId: existing.animalConfigId,
          eidDay: existing.eidDay,
        },
      },
      select: { animalsCount: true },
    });
    const cap = slaughter?.animalsCount ?? 0;
    const otherSum = await sumAnimalsAssignedForDay(
      input.yearId,
      existing.animalConfigId,
      existing.eidDay,
      existing.id,
    );
    if (otherSum + input.animalsAssigned > cap) {
      return {
        ok: false,
        code: "EXCEEDS_SLAUGHTER",
        message: `Total animals in slots for this day would exceed the slaughter plan (${cap}).`,
      };
    }

    const base = eidBaseDateUtc(yearRow, existing.eidDay);
    const startTime = combineEidDateAndUtcHHMM(base, input.startTime);
    const endTime = combineEidDateAndUtcHHMM(base, input.endTime);
    const totalPortions = input.animalsAssigned * config.portionsPerAnimal;
    const totalPayas = input.animalsAssigned * config.payasPerAnimal;

    await prisma.timeSlot.update({
      where: { id: existing.id },
      data: {
        slotLabel: input.slotLabel,
        startTime,
        endTime,
        animalsAssigned: input.animalsAssigned,
        totalPortions,
        totalPayas,
        isActive: input.isActive === "true",
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("[updateTimeSlotRecord]", e);
    return { ok: false, code: "UNKNOWN", message: "Could not update the time slot." };
  }
}

export async function deleteTimeSlotRecord(
  yearId: number,
  timeSlotId: number,
): Promise<MutateTimeSlotResult> {
  try {
    const existing = await prisma.timeSlot.findFirst({
      where: { id: timeSlotId, yearId },
      select: { id: true, bookedPortions: true, bookedPayas: true },
    });
    if (!existing) {
      return { ok: false, code: "NOT_FOUND", message: "That time slot no longer exists." };
    }
    if (existing.bookedPortions > 0 || existing.bookedPayas > 0) {
      return {
        ok: false,
        code: "BOOKINGS_BLOCK_DELETE",
        message: "Remove or move bookings before deleting a slot that has reservations.",
      };
    }

    await prisma.timeSlot.delete({ where: { id: existing.id } });
    return { ok: true };
  } catch (e) {
    console.error("[deleteTimeSlotRecord]", e);
    return { ok: false, code: "UNKNOWN", message: "Could not delete the time slot." };
  }
}
