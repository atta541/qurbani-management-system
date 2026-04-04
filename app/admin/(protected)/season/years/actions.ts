"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { ADMIN_YEARS_CACHE_TAG, createYearRecord, setActiveYearById } from "@/lib/services/year";
import { createYearFormSchema, setActiveYearFormSchema } from "@/lib/validations/year";

const SEASON_YEARS_PATH = "/admin/season/years";

/**
 * UI state for the “Create season” form (`useActionState`).
 * Keeps messages generic on the client; detailed validation comes from Zod.
 */
export type CreateYearActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  /** `at` lets the client run a one-shot refresh / form reset after each distinct success. */
  | { status: "success"; message: string; at: number };

/**
 * Creates a new `Year` row. Requires authenticated admin (not only middleware cookie).
 */
export async function createYearAction(
  _prev: CreateYearActionState,
  formData: FormData,
): Promise<CreateYearActionState> {
  await requireAdmin();

  const parsed = createYearFormSchema.safeParse({
    year: formData.get("year"),
    label: formData.get("label"),
    eidDay1: formData.get("eidDay1"),
    eidDay2: formData.get("eidDay2"),
    eidDay3: formData.get("eidDay3"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Invalid input." };
  }

  const result = await createYearRecord(parsed.data);
  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidateTag(ADMIN_YEARS_CACHE_TAG, "max");
  revalidatePath(SEASON_YEARS_PATH);
  return {
    status: "success",
    message: "Season created. Set it as the active season when you are ready.",
    at: Date.now(),
  };
}

export type SetActiveYearActionResult = { ok: true } | { ok: false; error: string };

/**
 * Sets the given season as the only active one (all others deactivated).
 */
export async function setActiveYearAction(formData: FormData): Promise<SetActiveYearActionResult> {
  await requireAdmin();

  const parsed = setActiveYearFormSchema.safeParse({
    yearId: formData.get("yearId"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid request." };
  }

  const result = await setActiveYearById(parsed.data.yearId);
  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  revalidateTag(ADMIN_YEARS_CACHE_TAG, "max");
  revalidatePath(SEASON_YEARS_PATH);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
