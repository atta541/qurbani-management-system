"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  animalPoolsCacheTag,
  upsertAnimalPoolRecord,
} from "@/lib/services/animal-pool";
import { slaughterSchedulesCacheTag } from "@/lib/services/slaughter-schedule";
import { timeSlotsCacheTag } from "@/lib/services/time-slot";
import { getActiveYear } from "@/lib/services/year";
import { upsertAnimalPoolFormSchema } from "@/lib/validations/animal-pool";

const POOLS_PATH = "/admin/season/pools";
const SLAUGHTER_PATH = "/admin/season/slaughter";
const TIME_SLOTS_PATH = "/admin/season/time-slots";

export type UpsertPoolActionResult = { ok: true } | { ok: false; error: string };

/**
 * Saves one `(year, animal kind)` pool. Only the **active** season can be edited (tamper guard).
 * Returns safe, user-facing strings only — no stack traces or DB details.
 */
export async function upsertAnimalPoolAction(formData: FormData): Promise<UpsertPoolActionResult> {
  await requireAdmin();

  const parsed = upsertAnimalPoolFormSchema.safeParse({
    yearId: formData.get("yearId"),
    animalConfigId: formData.get("animalConfigId"),
    totalAnimals: formData.get("totalAnimals"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input." };
  }

  const active = await getActiveYear();
  if (!active || active.id !== parsed.data.yearId) {
    return {
      ok: false,
      error: "This season is not active anymore. Refresh the page and try again.",
    };
  }

  const result = await upsertAnimalPoolRecord(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  const yid = parsed.data.yearId;
  revalidateTag(animalPoolsCacheTag(yid), "max");
  revalidateTag(slaughterSchedulesCacheTag(yid), "max");
  revalidateTag(timeSlotsCacheTag(yid), "max");
  revalidatePath(POOLS_PATH);
  revalidatePath(SLAUGHTER_PATH);
  revalidatePath(TIME_SLOTS_PATH);
  return { ok: true };
}
