"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  saveSlaughterDistribution,
  slaughterSchedulesCacheTag,
} from "@/lib/services/slaughter-schedule";
import { timeSlotsCacheTag } from "@/lib/services/time-slot";
import { getActiveYear } from "@/lib/services/year";
import { saveSlaughterDistributionFormSchema } from "@/lib/validations/slaughter-schedule";

const SLAUGHTER_PATH = "/admin/season/slaughter";
const TIME_SLOTS_PATH = "/admin/season/time-slots";

export type SaveSlaughterActionResult = { ok: true } | { ok: false; error: string };

export async function saveSlaughterDistributionAction(
  formData: FormData,
): Promise<SaveSlaughterActionResult> {
  await requireAdmin();

  const parsed = saveSlaughterDistributionFormSchema.safeParse({
    yearId: formData.get("yearId"),
    animalConfigId: formData.get("animalConfigId"),
    day1: formData.get("day1"),
    day2: formData.get("day2"),
    day3: formData.get("day3"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const active = await getActiveYear();
  if (!active || active.id !== parsed.data.yearId) {
    return {
      ok: false,
      error: "This season is not active anymore. Refresh the page.",
    };
  }

  const result = await saveSlaughterDistribution(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateTag(slaughterSchedulesCacheTag(parsed.data.yearId), "max");
  revalidateTag(timeSlotsCacheTag(parsed.data.yearId), "max");
  revalidatePath(SLAUGHTER_PATH);
  revalidatePath(TIME_SLOTS_PATH);
  return { ok: true };
}
