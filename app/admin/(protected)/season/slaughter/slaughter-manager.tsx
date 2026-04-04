"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { saveSlaughterDistributionAction } from "@/app/admin/(protected)/season/slaughter/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { SlaughterScheduleRowVm } from "@/lib/services/slaughter-schedule";
import { cn } from "@/lib/utils";

function resolveAnimalCode(config: SlaughterScheduleRowVm["animalConfig"]): string {
  const any = config as SlaughterScheduleRowVm["animalConfig"] & { kind?: string };
  const raw = any.code ?? any.kind;
  return typeof raw === "string" && raw.length > 0 ? raw : "";
}

function formatCodeLabel(code: string) {
  if (!code) return "—";
  return code.replaceAll("_", " ");
}

type Props = {
  yearId: number;
  yearLabel: string;
  calendarYear: number;
  rows: SlaughterScheduleRowVm[];
};

const SlaughterTypeRow = memo(function SlaughterTypeRow({
  yearId,
  row,
}: {
  yearId: number;
  row: SlaughterScheduleRowVm;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const target = row.pool.totalAnimals;
  const [d1, setD1] = useState(String(row.animalsByDay.DAY_1));
  const [d2, setD2] = useState(String(row.animalsByDay.DAY_2));
  const [d3, setD3] = useState(String(row.animalsByDay.DAY_3));

  const syncKey = `${row.animalsByDay.DAY_1}-${row.animalsByDay.DAY_2}-${row.animalsByDay.DAY_3}-${target}`;
  useEffect(() => {
    setD1(String(row.animalsByDay.DAY_1));
    setD2(String(row.animalsByDay.DAY_2));
    setD3(String(row.animalsByDay.DAY_3));
  }, [syncKey, row.animalConfig.id]);

  const n1 = Number.parseInt(d1, 10);
  const n2 = Number.parseInt(d2, 10);
  const n3 = Number.parseInt(d3, 10);
  const sum = useMemo(() => {
    if (![n1, n2, n3].every((n) => Number.isFinite(n) && n >= 0)) return null;
    return n1 + n2 + n3;
  }, [n1, n2, n3]);

  const sumOk = sum !== null && sum === target;
  const delta = sum !== null ? sum - target : null;

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      startTransition(async () => {
        const fd = new FormData(form);
        const r = await saveSlaughterDistributionAction(fd);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Slaughter schedule saved.");
        router.refresh();
      });
    },
    [router],
  );

  const c = row.animalConfig;
  const codeStr = resolveAnimalCode(c);

  const previewPortions =
    sum != null && [n1, n2, n3].every((n) => Number.isFinite(n) && n >= 0)
      ? n1 * c.portionsPerAnimal + n2 * c.portionsPerAnimal + n3 * c.portionsPerAnimal
      : null;
  const previewPayas =
    sum != null && [n1, n2, n3].every((n) => Number.isFinite(n) && n >= 0)
      ? n1 * c.payasPerAnimal + n2 * c.payasPerAnimal + n3 * c.payasPerAnimal
      : null;

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 border-b border-border py-5 last:border-b-0 lg:grid-cols-12 lg:items-end"
    >
      <input type="hidden" name="yearId" value={yearId} />
      <input type="hidden" name="animalConfigId" value={c.id} />

      <div className="lg:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatCodeLabel(codeStr)}
        </p>
        <p className="font-semibold text-foreground">{c.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pool total:{" "}
          <span className="font-semibold tabular-nums text-foreground">{target}</span> animals
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:col-span-5">
        <div className="space-y-1">
          <Label htmlFor={`d1-${c.id}`}>Eid day 1</Label>
          <Input
            id={`d1-${c.id}`}
            name="day1"
            type="number"
            min={0}
            required
            value={d1}
            onChange={(e) => setD1(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`d2-${c.id}`}>Eid day 2</Label>
          <Input
            id={`d2-${c.id}`}
            name="day2"
            type="number"
            min={0}
            required
            value={d2}
            onChange={(e) => setD2(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`d3-${c.id}`}>Eid day 3</Label>
          <Input
            id={`d3-${c.id}`}
            name="day3"
            type="number"
            min={0}
            required
            value={d3}
            onChange={(e) => setD3(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1 text-sm lg:col-span-2">
        <span className="font-medium text-foreground">Sum</span>
        <p
          className={cn(
            "rounded-md border px-3 py-2 tabular-nums",
            sumOk ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/40",
          )}
        >
          {sum == null ? "—" : sum}
          <span className="text-muted-foreground"> / {target}</span>
          {delta != null && delta !== 0 ? (
            <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">
              {delta > 0 ? `+${delta} over` : `${delta} under`}
            </span>
          ) : null}
        </p>
        {previewPortions != null ? (
          <p className="text-xs text-muted-foreground">
            Portions (preview): {previewPortions.toLocaleString()} · Payas (preview):{" "}
            {previewPayas?.toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="lg:col-span-2 lg:flex lg:justify-end">
        <Button type="submit" disabled={pending || !sumOk} className="w-full lg:w-auto">
          {pending ? "Saving…" : "Save schedule"}
        </Button>
      </div>
    </form>
  );
});

export function SlaughterScheduleManager({ yearId, yearLabel, calendarYear, rows }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Slaughter schedule</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          For each animal type, split the <strong>pool total</strong> across Eid day 1, 2, and 3.
          Example: 100 goats all on day 1 → <strong>100, 0, 0</strong>. 100 male cows split →{" "}
          <strong>50, 25, 25</strong>. The three numbers must add up exactly to the pool.
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {yearLabel}{" "}
          <span className="tabular-nums text-muted-foreground">({calendarYear})</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By animal type</CardTitle>
          <CardDescription>
            Only types with a pool for this season appear here. Set pools first if something is missing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-pretty text-sm text-muted-foreground">
              No pools for this season yet.{" "}
              <Link href="/admin/season/pools" className="font-medium text-primary underline-offset-2 hover:underline">
                Configure pools
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <SlaughterTypeRow key={row.animalConfig.id} yearId={yearId} row={row} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
