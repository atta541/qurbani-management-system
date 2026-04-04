/**
 * Admin form: distribute `AnimalPool.totalAnimals` across Eid Day 1–3.
 */
import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

const dayCount = z.coerce
  .number()
  .int("Whole animals only.")
  .min(0, "Cannot be negative.");

export const saveSlaughterDistributionFormSchema = z.object({
  yearId: positiveInt,
  animalConfigId: positiveInt,
  day1: dayCount,
  day2: dayCount,
  day3: dayCount,
});

export type SaveSlaughterDistributionFormValues = z.infer<typeof saveSlaughterDistributionFormSchema>;
