/**
 * Admin forms for `AnimalConfig` (`code` stored in DB column `kind`).
 */
import { z } from "zod";

/** UPPER_SNAKE_CASE, stable for APIs and exports (2–64 chars). */
export const animalConfigCodeSchema = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z][A-Z0-9_]{1,63}$/,
        "Use UPPER_SNAKE_CASE (e.g. BUFFALO, COW_MALE). Letters, digits, underscore only.",
      ),
  );

export const createAnimalConfigFormSchema = z.object({
  code: animalConfigCodeSchema,
  label: z.string().trim().min(1, "Label is required.").max(200),
  portionsPerAnimal: z.coerce
    .number()
    .int()
    .min(1, "At least 1 portion per animal.")
    .max(10_000, "Value too large."),
  payasPerAnimal: z.coerce
    .number()
    .int()
    .min(0, "Payas cannot be negative.")
    .max(1_000, "Value too large."),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
});

export type CreateAnimalConfigFormValues = z.infer<typeof createAnimalConfigFormSchema>;

export const updateAnimalConfigFormSchema = z.object({
  id: z.coerce.number().int().positive(),
  label: z.string().trim().min(1, "Label is required.").max(200),
  portionsPerAnimal: z.coerce.number().int().min(1).max(10_000),
  payasPerAnimal: z.coerce.number().int().min(0).max(1_000),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
});

export type UpdateAnimalConfigFormValues = z.infer<typeof updateAnimalConfigFormSchema>;

const positiveId = z.coerce.number().int().positive();

export const deleteAnimalConfigFormSchema = z.object({
  id: positiveId,
});
