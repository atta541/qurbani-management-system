/**
 * Validation for `AnimalPool` admin mutations.
 * Intentionally strict caps to reduce abuse and bad data (even for trusted admins).
 */
import { z } from "zod";

/** Upper bound for `totalAnimals` per kind per season (sanity / DoS guard). */
export const TOTAL_ANIMALS_MAX = 1_000_000;

const positiveInt = z.coerce.number().int().positive();

export const upsertAnimalPoolFormSchema = z.object({
  yearId: positiveInt,
  animalConfigId: positiveInt,
  totalAnimals: z.coerce
    .number()
    .int("Whole animals only.")
    .min(0, "Cannot be negative.")
    .max(TOTAL_ANIMALS_MAX, `Cannot exceed ${TOTAL_ANIMALS_MAX.toLocaleString()} animals.`),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be at most 2000 characters.")
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
});

export type UpsertAnimalPoolFormValues = z.infer<typeof upsertAnimalPoolFormSchema>;
