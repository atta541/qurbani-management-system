"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  createYearAction,
  type CreateYearActionState,
  setActiveYearAction,
} from "@/app/admin/(protected)/season/years/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { YEAR_NUMBER_MAX, YEAR_NUMBER_MIN } from "@/lib/validations/year";
import type { YearListItem } from "@/lib/services/year";

/**
 * Renders Eid calendar dates as stored (UTC date-only).
 * Accepts `Date` or ISO string — RSC → client props serialize dates as strings, which would throw
 * `RangeError: Invalid time value` if passed raw to `Intl` without parsing.
 */
function formatUtcDate(d: Date | string) {
  const time = d instanceof Date ? d.getTime() : new Date(d).getTime();
  if (Number.isNaN(time)) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(time);
}

/**
 * Sets active season via server action. Uses `useTransition` instead of `useFormStatus` so it
 * works reliably with Next/Turbopack client boundaries (see prior `useFormStatus` runtime error).
 */
function SetActiveSeasonButton({ yearId }: { yearId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("yearId", String(yearId));
          const r = await setActiveYearAction(fd);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          toast.success("Active season updated.");
          router.refresh();
        });
      }}
    >
      {pending ? "Updating…" : "Set as active season"}
    </Button>
  );
}

type Props = {
  years: YearListItem[];
  hasActiveYear: boolean;
};

const createInitialState: CreateYearActionState = { status: "idle" };

/**
 * Admin UI: create Eid seasons and choose which one is active for the whole app.
 */
export function YearsManager({ years, hasActiveYear }: Props) {
  const router = useRouter();
  const [createState, createFormAction, createPending] = useActionState(
    createYearAction,
    createInitialState,
  );
  /** Bump `key` on the create form after each successful create so fields reset. */
  const [createFormKey, setCreateFormKey] = useState(0);
  const handledSuccessAt = useRef<number | null>(null);

  useEffect(() => {
    if (createState.status !== "success") return;
    if (handledSuccessAt.current === createState.at) return;
    handledSuccessAt.current = createState.at;
    setCreateFormKey((k) => k + 1);
    router.refresh();
  }, [createState, router]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Eid seasons</h1>
        <p className="mt-2 text-muted-foreground">
          Create a row per Eid ul Adha cycle. Only one season can be <strong>active</strong> at a
          time — bookings and stock in later steps will use the active season.
        </p>
      </div>

      {!hasActiveYear ? (
        <div
          role="status"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-50"
        >
          <strong>No active season.</strong> Create a year below, then click &quot;Set as active
          season&quot; so the rest of the admin tools know which Eid you are preparing for.
        </div>
      ) : null}

      {/* ——— Create season ——— */}
      <Card>
        <CardHeader>
          <CardTitle>Add season</CardTitle>
          <CardDescription>
            Gregorian year number (e.g. 2026), display label, and the three Eid days. Dates must be
            in order: Day 1 → Day 2 → Day 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={createFormKey} action={createFormAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="year">Year number</Label>
              <Input
                id="year"
                name="year"
                type="number"
                required
                min={YEAR_NUMBER_MIN}
                max={YEAR_NUMBER_MAX}
                placeholder="2026"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Unique key for this season ({YEAR_NUMBER_MIN}–{YEAR_NUMBER_MAX}).
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                name="label"
                type="text"
                required
                maxLength={200}
                placeholder="Eid ul Adha 2026"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Eid calendar dates</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="eidDay1">Day 1</Label>
                  <Input id="eidDay1" name="eidDay1" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eidDay2">Day 2</Label>
                  <Input id="eidDay2" name="eidDay2" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eidDay3">Day 3</Label>
                  <Input id="eidDay3" name="eidDay3" type="date" required />
                </div>
              </div>
            </div>

            {createState.status === "error" ? (
              <p className="text-sm text-destructive sm:col-span-2" role="alert">
                {createState.message}
              </p>
            ) : null}

            {createState.status === "success" ? (
              <p
                className="text-sm font-medium text-emerald-700 dark:text-emerald-400 sm:col-span-2"
                role="status"
              >
                {createState.message}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={createPending}>
                {createPending ? "Creating…" : "Create season"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ——— List + activate ——— */}
      <Card>
        <CardHeader>
          <CardTitle>All seasons</CardTitle>
          <CardDescription>Newest first. Activate the one you are operating for.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {years.length === 0 ? (
            <p className="text-sm text-muted-foreground">No seasons yet. Create one above.</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Year</th>
                  <th className="py-2 pr-4 font-medium">Label</th>
                  <th className="py-2 pr-4 font-medium">Eid days (UTC)</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.id} className="border-b border-border/80">
                    <td className="py-3 pr-4 font-medium tabular-nums">{y.year}</td>
                    <td className="py-3 pr-4">{y.label}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatUtcDate(y.eidDay1)} · {formatUtcDate(y.eidDay2)} ·{" "}
                      {formatUtcDate(y.eidDay3)}
                    </td>
                    <td className="py-3 pr-4">
                      {y.isActive ? (
                        <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {y.isActive ? (
                        <span className="text-xs text-muted-foreground">Current season</span>
                      ) : (
                        <SetActiveSeasonButton yearId={y.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
