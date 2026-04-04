/**
 * Admin `TimeSlot` forms — collection windows per `(year, animalConfig, eidDay)`.
 * Times are `HH:MM` 24h (UTC on the season’s Eid calendar date).
 */
import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

/** `HH:MM` 24-hour, stored/combined as UTC on the Eid date. */
export const hhmmUtcSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time (HH:MM), e.g. 21:00.");

export const createTimeSlotFormSchema = z
  .object({
    yearId: positiveInt,
    animalConfigId: positiveInt,
    eidDay: z.enum(["DAY_1", "DAY_2", "DAY_3"]),
    slotLabel: z.string().trim().min(1, "Label is required.").max(120, "Label must be at most 120 characters."),
    startTime: hhmmUtcSchema,
    endTime: hhmmUtcSchema,
    animalsAssigned: z.coerce
      .number()
      .int("Whole animals only.")
      .min(1, "Assign at least one animal for a new slot.")
      .max(1_000_000, "Value is too large."),
  })
  .superRefine((data, ctx) => {
    const [sh, sm] = data.startTime.split(":").map((x) => parseInt(x, 10));
    const [eh, em] = data.endTime.split(":").map((x) => parseInt(x, 10));
    if (sh * 60 + sm >= eh * 60 + em) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time must be before end time.",
        path: ["endTime"],
      });
    }
  });

export type CreateTimeSlotFormValues = z.infer<typeof createTimeSlotFormSchema>;

export const updateTimeSlotFormSchema = z.object({
  yearId: positiveInt,
  timeSlotId: positiveInt,
  slotLabel: z.string().trim().min(1, "Label is required.").max(120, "Label must be at most 120 characters."),
  startTime: hhmmUtcSchema,
  endTime: hhmmUtcSchema,
  animalsAssigned: z.coerce
    .number()
    .int("Whole animals only.")
    .min(0, "Cannot be negative.")
    .max(1_000_000, "Value is too large."),
  isActive: z.enum(["true", "false"]),
});

export type UpdateTimeSlotFormValues = z.infer<typeof updateTimeSlotFormSchema>;

export const deleteTimeSlotFormSchema = z.object({
  yearId: positiveInt,
  timeSlotId: positiveInt,
});

export type DeleteTimeSlotFormValues = z.infer<typeof deleteTimeSlotFormSchema>;
