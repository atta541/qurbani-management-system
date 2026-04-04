"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  dayPricingCacheTag,
  saveDayPricingForAnimalType,
} from "@/lib/services/day-pricing";
import { getActiveYear } from "@/lib/services/year";
import { saveDayPricingForTypeFormSchema } from "@/lib/validations/day-pricing";

const PRICING_PATH = "/admin/season/pricing";

export type SaveDayPricingActionResult = { ok: true } | { ok: false; error: string };

export async function saveDayPricingForTypeAction(
  formData: FormData,
): Promise<SaveDayPricingActionResult> {
  await requireAdmin();

  const parsed = saveDayPricingForTypeFormSchema.safeParse({
    yearId: formData.get("yearId"),
    animalConfigId: formData.get("animalConfigId"),
    day1Total: formData.get("day1Total"),
    day1Price: formData.get("day1Price"),
    day1PayasExtra: formData.get("day1PayasExtra"),
    day2Total: formData.get("day2Total"),
    day2Price: formData.get("day2Price"),
    day2PayasExtra: formData.get("day2PayasExtra"),
    day3Total: formData.get("day3Total"),
    day3Price: formData.get("day3Price"),
    day3PayasExtra: formData.get("day3PayasExtra"),
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

  const result = await saveDayPricingForAnimalType(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateTag(dayPricingCacheTag(parsed.data.yearId), "max");
  revalidatePath(PRICING_PATH);
  return { ok: true };
}
