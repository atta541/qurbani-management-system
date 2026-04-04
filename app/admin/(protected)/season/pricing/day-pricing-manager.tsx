"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { saveDayPricingForTypeAction } from "@/app/admin/(protected)/season/pricing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { DayPricingDayVm, DayPricingRowVm } from "@/lib/services/day-pricing";
import {
  portionPriceFromTotalString,
  totalFromPortionPriceString,
  validateMoneyInput,
} from "@/lib/validations/day-pricing";
import { cn } from "@/lib/utils";

const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPkrSample(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return pkrFormatter.format(n);
}

function resolveAnimalCode(config: DayPricingRowVm["animalConfig"]): string {
  const any = config as DayPricingRowVm["animalConfig"] & { kind?: string };
  const raw = any.code ?? any.kind;
  return typeof raw === "string" && raw.length > 0 ? raw : "";
}

function formatCodeLabel(code: string) {
  if (!code) return "—";
  return code.replaceAll("_", " ");
}

type MoneyDraft = {
  day1Total: string;
  day1Price: string;
  day1PayasExtra: string;
  day2Total: string;
  day2Price: string;
  day2PayasExtra: string;
  day3Total: string;
  day3Price: string;
  day3PayasExtra: string;
};

function draftFromRow(row: DayPricingRowVm): MoneyDraft {
  const [d1, d2, d3] = row.days;
  return {
    day1Total: d1.totalPricePerAnimal,
    day1Price: d1.pricePerPortion,
    day1PayasExtra: d1.payasExtraCharge,
    day2Total: d2.totalPricePerAnimal,
    day2Price: d2.pricePerPortion,
    day2PayasExtra: d2.payasExtraCharge,
    day3Total: d3.totalPricePerAnimal,
    day3Price: d3.pricePerPortion,
    day3PayasExtra: d3.payasExtraCharge,
  };
}

function rowSyncKey(row: DayPricingRowVm): string {
  return row.days
    .map((d) => `${d.totalPricePerAnimal}:${d.pricePerPortion}:${d.payasExtraCharge}:${d.updatedAt ?? "x"}`)
    .join("|");
}

function dayLabelShort(day: DayPricingDayVm["eidDay"]): string {
  if (day === "DAY_1") return "Eid day 1";
  if (day === "DAY_2") return "Eid day 2";
  return "Eid day 3";
}

type Props = {
  yearId: number;
  yearLabel: string;
  calendarYear: number;
  rows: DayPricingRowVm[];
};

const PricingTypeCard = memo(function PricingTypeCard({
  yearId,
  row,
}: {
  yearId: number;
  row: DayPricingRowVm;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const syncKey = rowSyncKey(row);
  const [draft, setDraft] = useState(() => draftFromRow(row));

  useEffect(() => {
    setDraft(draftFromRow(row));
  }, [syncKey, row.animalConfig.id]);

  const serverDraft = useMemo(() => draftFromRow(row), [row, syncKey]);

  const isDirty = useMemo(() => {
    return (
      draft.day1Total !== serverDraft.day1Total ||
      draft.day1Price !== serverDraft.day1Price ||
      draft.day1PayasExtra !== serverDraft.day1PayasExtra ||
      draft.day2Total !== serverDraft.day2Total ||
      draft.day2Price !== serverDraft.day2Price ||
      draft.day2PayasExtra !== serverDraft.day2PayasExtra ||
      draft.day3Total !== serverDraft.day3Total ||
      draft.day3Price !== serverDraft.day3Price ||
      draft.day3PayasExtra !== serverDraft.day3PayasExtra
    );
  }, [draft, serverDraft]);

  const validation = useMemo(() => {
    const fields: (keyof MoneyDraft)[] = [
      "day1Total",
      "day1Price",
      "day1PayasExtra",
      "day2Total",
      "day2Price",
      "day2PayasExtra",
      "day3Total",
      "day3Price",
      "day3PayasExtra",
    ];
    const errors: Partial<Record<keyof MoneyDraft, string>> = {};
    let allOk = true;
    for (const key of fields) {
      const r = validateMoneyInput(draft[key]);
      if (!r.ok) {
        allOk = false;
        errors[key] = r.message;
      }
    }
    return { allOk, errors };
  }, [draft]);

  const c = row.animalConfig;
  const codeStr = resolveAnimalCode(c);
  const portions = c.portionsPerAnimal;

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validation.allOk) {
        toast.error("Fix invalid amounts before saving.");
        return;
      }

      const alignDay = (totalStr: string) => {
        const r = validateMoneyInput(totalStr);
        if (!r.ok) return null;
        const price = portionPriceFromTotalString(r.normalized, portions);
        const totalAligned = totalFromPortionPriceString(price, portions);
        return { total: totalAligned, price };
      };

      const a1 = alignDay(draft.day1Total);
      const a2 = alignDay(draft.day2Total);
      const a3 = alignDay(draft.day3Total);
      if (!a1 || !a2 || !a3) {
        toast.error("Fix invalid amounts before saving.");
        return;
      }

      const fd = new FormData();
      fd.set("yearId", String(yearId));
      fd.set("animalConfigId", String(c.id));
      fd.set("day1Total", a1.total);
      fd.set("day1Price", a1.price);
      fd.set("day1PayasExtra", draft.day1PayasExtra.trim().replace(/,/g, ""));
      fd.set("day2Total", a2.total);
      fd.set("day2Price", a2.price);
      fd.set("day2PayasExtra", draft.day2PayasExtra.trim().replace(/,/g, ""));
      fd.set("day3Total", a3.total);
      fd.set("day3Price", a3.price);
      fd.set("day3PayasExtra", draft.day3PayasExtra.trim().replace(/,/g, ""));

      startTransition(async () => {
        const result = await saveDayPricingForTypeAction(fd);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Day pricing saved for this animal type.");
        router.refresh();
      });
    },
    [c.id, draft, portions, router, validation.allOk, yearId],
  );

  const discard = useCallback(() => {
    setDraft(draftFromRow(row));
  }, [row]);

  const samplePortions = 2;
  const d1p = Number(draft.day1Price);
  const d1e = Number(draft.day1PayasExtra);
  const sampleWithPayas =
    validation.allOk && Number.isFinite(d1p) && Number.isFinite(d1e)
      ? samplePortions * d1p + samplePortions * d1e
      : null;
  const samplePortionsOnly =
    validation.allOk && Number.isFinite(d1p) ? samplePortions * d1p : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/30 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{c.label}</CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              {formatCodeLabel(codeStr)} · pool {row.pool.totalAnimals.toLocaleString()} animals ·{" "}
              {portions} portions / animal
            </CardDescription>
          </div>
          {isDirty ? (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Unsaved changes</span>
          ) : (
            <span className="text-xs text-muted-foreground">Saved</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="yearId" value={yearId} />
          <input type="hidden" name="animalConfigId" value={c.id} />

          <div className="grid gap-6 lg:grid-cols-3">
            {row.days.map((dayVm, index) => {
              const totalName =
                index === 0 ? "day1Total" : index === 1 ? "day2Total" : "day3Total";
              const priceName =
                index === 0 ? "day1Price" : index === 1 ? "day2Price" : "day3Price";
              const payasName =
                index === 0 ? "day1PayasExtra" : index === 1 ? "day2PayasExtra" : "day3PayasExtra";
              const totalVal =
                index === 0 ? draft.day1Total : index === 1 ? draft.day2Total : draft.day3Total;
              const priceVal =
                index === 0 ? draft.day1Price : index === 1 ? draft.day2Price : draft.day3Price;
              const payasVal =
                index === 0
                  ? draft.day1PayasExtra
                  : index === 1
                    ? draft.day2PayasExtra
                    : draft.day3PayasExtra;
              const totalErr =
                validation.errors[
                  index === 0 ? "day1Total" : index === 1 ? "day2Total" : "day3Total"
                ];
              const priceErr =
                validation.errors[
                  index === 0 ? "day1Price" : index === 1 ? "day2Price" : "day3Price"
                ];
              const payasErr =
                validation.errors[
                  index === 0 ? "day1PayasExtra" : index === 1 ? "day2PayasExtra" : "day3PayasExtra"
                ];
              const hasPriceOrPayas =
                Number.parseFloat(priceVal) > 0 ||
                Number.parseFloat(payasVal) > 0 ||
                Number.parseFloat(totalVal) > 0;
              const scheduleEmpty = dayVm.slaughterAnimalsOnDay === 0;
              const showScheduleWarning = scheduleEmpty && hasPriceOrPayas && validation.allOk;

              /** Full-animal total: type freely; on blur we align portion + rounded total. */
              const setTotalOnly = (v: string) => {
                if (index === 0) setDraft((d) => ({ ...d, day1Total: v }));
                else if (index === 1) setDraft((d) => ({ ...d, day2Total: v }));
                else setDraft((d) => ({ ...d, day3Total: v }));
              };

              const applyFromTotalBlur = (raw: string) => {
                const r = validateMoneyInput(raw);
                if (!r.ok) return;
                const price = portionPriceFromTotalString(r.normalized, portions);
                const totalAligned = totalFromPortionPriceString(price, portions);
                if (index === 0) {
                  setDraft((d) => ({ ...d, day1Total: totalAligned, day1Price: price }));
                } else if (index === 1) {
                  setDraft((d) => ({ ...d, day2Total: totalAligned, day2Price: price }));
                } else {
                  setDraft((d) => ({ ...d, day3Total: totalAligned, day3Price: price }));
                }
              };

              /** Per-portion: keep total in sync live (no awkward mid-typing on totals). */
              const applyFromPortion = (v: string) => {
                const total = totalFromPortionPriceString(v, portions);
                if (index === 0) {
                  setDraft((d) => ({ ...d, day1Price: v, day1Total: total }));
                } else if (index === 1) {
                  setDraft((d) => ({ ...d, day2Price: v, day2Total: total }));
                } else {
                  setDraft((d) => ({ ...d, day3Price: v, day3Total: total }));
                }
              };

              const setPayas = (v: string) => {
                if (index === 0) setDraft((d) => ({ ...d, day1PayasExtra: v }));
                else if (index === 1) setDraft((d) => ({ ...d, day2PayasExtra: v }));
                else setDraft((d) => ({ ...d, day3PayasExtra: v }));
              };

              return (
                <div
                  key={dayVm.eidDay}
                  className="rounded-lg border border-border bg-card p-3 shadow-sm"
                >
                  <p className="mb-3 text-sm font-semibold text-foreground">{dayLabelShort(dayVm.eidDay)}</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`${totalName}-${c.id}`}>
                        Full animal price ({portions} portions)
                      </Label>
                      <Input
                        id={`${totalName}-${c.id}`}
                        name={totalName}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        maxLength={16}
                        value={totalVal}
                        onChange={(e) => setTotalOnly(e.target.value)}
                        onBlur={(e) => applyFromTotalBlur(e.target.value)}
                        disabled={pending}
                        aria-invalid={Boolean(totalErr)}
                        className={cn(totalErr && "border-destructive focus-visible:ring-destructive")}
                      />
                      {totalErr ? (
                        <p className="text-xs text-destructive">{totalErr}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Enter the full animal price, then tab out — per-portion fills automatically. You can also edit
                          per-portion directly (total updates live).
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${priceName}-${c.id}`}>Price per portion</Label>
                      <Input
                        id={`${priceName}-${c.id}`}
                        name={priceName}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        maxLength={16}
                        value={priceVal}
                        onChange={(e) => applyFromPortion(e.target.value)}
                        disabled={pending}
                        aria-invalid={Boolean(priceErr)}
                        className={cn(priceErr && "border-destructive focus-visible:ring-destructive")}
                      />
                      {priceErr ? (
                        <p className="text-xs text-destructive">{priceErr}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Bookings multiply this by hissa count; total above stays in sync.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${payasName}-${c.id}`}>Payas extra / portion</Label>
                      <Input
                        id={`${payasName}-${c.id}`}
                        name={payasName}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        maxLength={16}
                        value={payasVal}
                        onChange={(e) => setPayas(e.target.value)}
                        disabled={pending}
                        aria-invalid={Boolean(payasErr)}
                        className={cn(payasErr && "border-destructive focus-visible:ring-destructive")}
                      />
                      {payasErr ? (
                        <p className="text-xs text-destructive">{payasErr}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Use 0 if payas are included at no extra charge.</p>
                      )}
                    </div>
                  </div>
                  {showScheduleWarning ? (
                    <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
                      No animals are scheduled on this day yet. Set the slaughter split before customers can book this
                      day, or confirm this price is intentional.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Quick check (day 1, {samplePortions} portions): meat only{" "}
              <span className="font-medium tabular-nums text-foreground">
                {samplePortionsOnly == null ? "—" : formatPkrSample(samplePortionsOnly)}
              </span>
              {" · "}
              with payas{" "}
              <span className="font-medium tabular-nums text-foreground">
                {sampleWithPayas == null ? "—" : formatPkrSample(sampleWithPayas)}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!isDirty || pending}
                onClick={discard}
              >
                Discard changes
              </Button>
              <Button type="submit" size="sm" disabled={pending || !validation.allOk || !isDirty}>
                {pending ? "Saving…" : "Save all three days"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

export function DayPricingManager({ yearId, yearLabel, calendarYear, rows }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Day pricing</h1>
        <p className="mt-2 max-w-3xl text-pretty text-muted-foreground">
          Set <strong>full animal price</strong> or <strong>price per portion</strong> for each Eid day — the other
          field updates automatically using this type&apos;s portion count. Both values are stored. Bookings still use{" "}
          <strong>per-portion</strong> amounts. Changing prices here does not alter existing bookings.
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {yearLabel}{" "}
          <span className="tabular-nums text-muted-foreground">({calendarYear})</span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Operational notes</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Only animal types with a <strong>pool</strong> appear — same scope as slaughter scheduling.</li>
          <li>All three days save together for each type so you never end up with partial pricing.</li>
          <li>
            If totals do not divide evenly into portions, the form rounds per-portion to 2 decimals and adjusts the
            stored total to match (within a few paisa).
          </li>
          <li>If another admin activates a different season, saves here will be rejected until you refresh.</li>
        </ul>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No pools for this season</CardTitle>
            <CardDescription>
              Create pools first; day pricing is configured per pooled animal type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default">
              <Link href="/admin/season/pools">Configure pools</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rows.map((row) => (
            <PricingTypeCard key={row.animalConfig.id} yearId={yearId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
