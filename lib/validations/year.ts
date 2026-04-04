/**
 * Zod schemas for Eid season (`Year`) mutations.
 *
 * We accept calendar dates as `YYYY-MM-DD` strings from `<input type="date" />` and
 * persist them as UTC midnight for that Gregorian date — consistent with the seed and
 * simple to reason about for “which calendar day is Eid”.
 */
import { z } from "zod";

/** Gregorian calendar year number stored in `Year.year` (e.g. 2026). */
export const YEAR_NUMBER_MIN = 2000;
export const YEAR_NUMBER_MAX = 2100;

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date (YYYY-MM-DD).")
  .refine((s) => {
    const t = Date.parse(`${s}T00:00:00.000Z`);
    return !Number.isNaN(t);
  }, "One or more dates are invalid.");

/**
 * Payload for creating a new season row.
 * Eid days are validated as non-decreasing (Day 1 ≤ Day 2 ≤ Day 3).
 */
export const createYearFormSchema = z
  .object({
    year: z.coerce
      .number()
      .int(`Year must be a whole number between ${YEAR_NUMBER_MIN} and ${YEAR_NUMBER_MAX}.`)
      .min(YEAR_NUMBER_MIN)
      .max(YEAR_NUMBER_MAX),
    label: z
      .string()
      .trim()
      .min(1, "Label is required.")
      .max(200, "Label must be at most 200 characters."),
    eidDay1: isoDateString,
    eidDay2: isoDateString,
    eidDay3: isoDateString,
  })
  .refine((d) => d.eidDay1 <= d.eidDay2 && d.eidDay2 <= d.eidDay3, {
    message: "Eid dates must be in order: Day 1 ≤ Day 2 ≤ Day 3.",
    path: ["eidDay3"],
  });

export type CreateYearFormValues = z.infer<typeof createYearFormSchema>;

const positiveIntId = z.coerce.number().int().positive();

/** Hidden field from “Set as active season” forms. */
export const setActiveYearFormSchema = z.object({
  yearId: positiveIntId,
});

export type SetActiveYearFormValues = z.infer<typeof setActiveYearFormSchema>;

/** Parse `YYYY-MM-DD` → `Date` at UTC midnight (start of that calendar day in UTC). */
export function parseUtcDateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
