"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createTimeSlotRecord,
  deleteTimeSlotRecord,
  timeSlotsCacheTag,
  updateTimeSlotRecord,
} from "@/lib/services/time-slot";
import { getActiveYear } from "@/lib/services/year";
import {
  createTimeSlotFormSchema,
  deleteTimeSlotFormSchema,
  updateTimeSlotFormSchema,
} from "@/lib/validations/time-slot";

const TIME_SLOTS_PATH = "/admin/season/time-slots";

function yearRowForCombine(active: NonNullable<Awaited<ReturnType<typeof getActiveYear>>>) {
  return {
    id: active.id,
    eidDay1: active.eidDay1 instanceof Date ? active.eidDay1 : new Date(active.eidDay1),
    eidDay2: active.eidDay2 instanceof Date ? active.eidDay2 : new Date(active.eidDay2),
    eidDay3: active.eidDay3 instanceof Date ? active.eidDay3 : new Date(active.eidDay3),
  };
}

export type TimeSlotActionResult = { ok: true } | { ok: false; error: string };

export async function createTimeSlotAction(formData: FormData): Promise<TimeSlotActionResult> {
  await requireAdmin();

  const parsed = createTimeSlotFormSchema.safeParse({
    yearId: formData.get("yearId"),
    animalConfigId: formData.get("animalConfigId"),
    eidDay: formData.get("eidDay"),
    slotLabel: formData.get("slotLabel"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    animalsAssigned: formData.get("animalsAssigned"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const active = await getActiveYear();
  if (!active || active.id !== parsed.data.yearId) {
    return {
      ok: false,
      error: "This season is not active anymore. Refresh the page and try again.",
    };
  }

  const result = await createTimeSlotRecord(parsed.data, yearRowForCombine(active));
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateTag(timeSlotsCacheTag(parsed.data.yearId), "max");
  revalidatePath(TIME_SLOTS_PATH);
  return { ok: true };
}

export async function updateTimeSlotAction(formData: FormData): Promise<TimeSlotActionResult> {
  await requireAdmin();

  const parsed = updateTimeSlotFormSchema.safeParse({
    yearId: formData.get("yearId"),
    timeSlotId: formData.get("timeSlotId"),
    slotLabel: formData.get("slotLabel"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    animalsAssigned: formData.get("animalsAssigned"),
    isActive: formData.get("isActive") ?? "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const active = await getActiveYear();
  if (!active || active.id !== parsed.data.yearId) {
    return {
      ok: false,
      error: "This season is not active anymore. Refresh the page and try again.",
    };
  }

  const result = await updateTimeSlotRecord(parsed.data, yearRowForCombine(active));
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateTag(timeSlotsCacheTag(parsed.data.yearId), "max");
  revalidatePath(TIME_SLOTS_PATH);
  return { ok: true };
}

export async function deleteTimeSlotAction(formData: FormData): Promise<TimeSlotActionResult> {
  await requireAdmin();

  const parsed = deleteTimeSlotFormSchema.safeParse({
    yearId: formData.get("yearId"),
    timeSlotId: formData.get("timeSlotId"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const active = await getActiveYear();
  if (!active || active.id !== parsed.data.yearId) {
    return {
      ok: false,
      error: "This season is not active anymore. Refresh the page and try again.",
    };
  }

  const result = await deleteTimeSlotRecord(parsed.data.yearId, parsed.data.timeSlotId);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateTag(timeSlotsCacheTag(parsed.data.yearId), "max");
  revalidatePath(TIME_SLOTS_PATH);
  return { ok: true };
}
