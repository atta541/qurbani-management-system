/**
 * Admin forms: `DayPricing` — portion price and payas surcharge per Eid day.
 * Money is validated as decimal strings (2 places max) for safe `Prisma.Decimal` conversion.
 */
import { z } from "zod";

/** Sanity cap per money field (PKR or any single currency). */
export const DAY_PRICING_MONEY_MAX = 99_999_999.99;

const positiveInt = z.coerce.number().int().positive();

export function normalizeMoneyInput(raw: string): string {
  return raw.trim().replace(/,/g, "");
}

export type MoneyValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; message: string };

/**
 * Shared client/server rules for live validation and Zod.
 */
/** Half-up round to 2 decimal places (matches typical money display). */
export function roundMoney2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Full-animal total from per-portion price × portions (for admin two-way fields).
 */
export function totalFromPortionPriceString(portionStr: string, portionsPerAnimal: number): string {
  const p = Number(portionStr);
  if (!Number.isFinite(p) || portionsPerAnimal <= 0) return "0.00";
  return roundMoney2(p * portionsPerAnimal).toFixed(2);
}

/**
 * Per-portion price from full-animal total ÷ portions (for admin two-way fields).
 */
export function portionPriceFromTotalString(totalStr: string, portionsPerAnimal: number): string {
  const t = Number(totalStr);
  if (!Number.isFinite(t) || portionsPerAnimal <= 0) return "0.00";
  return roundMoney2(t / portionsPerAnimal).toFixed(2);
}

export function validateMoneyInput(raw: string): MoneyValidationResult {
  const s = normalizeMoneyInput(raw);
  if (s === "") {
    return { ok: false, message: "Required." };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    return { ok: false, message: "Use numbers only, up to 2 decimal places." };
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > DAY_PRICING_MONEY_MAX) {
    return {
      ok: false,
      message: `Must be between 0 and ${DAY_PRICING_MONEY_MAX.toLocaleString("en-US")}.`,
    };
  }
  return { ok: true, normalized: s };
}

export const moneyFormStringSchema = z
  .string()
  .transform((s) => normalizeMoneyInput(s))
  .superRefine((s, ctx) => {
    const r = validateMoneyInput(s);
    if (!r.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message });
    }
  });

/**
 * Saves all three Eid days for one animal type in one transaction (avoids partial pricing).
 */
export const saveDayPricingForTypeFormSchema = z.object({
  yearId: positiveInt,
  animalConfigId: positiveInt,
  day1Total: moneyFormStringSchema,
  day1Price: moneyFormStringSchema,
  day1PayasExtra: moneyFormStringSchema,
  day2Total: moneyFormStringSchema,
  day2Price: moneyFormStringSchema,
  day2PayasExtra: moneyFormStringSchema,
  day3Total: moneyFormStringSchema,
  day3Price: moneyFormStringSchema,
  day3PayasExtra: moneyFormStringSchema,
});

export type SaveDayPricingForTypeFormValues = z.infer<typeof saveDayPricingForTypeFormSchema>;
