"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { upsertAnimalPoolAction } from "@/app/admin/(protected)/season/pools/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { AnimalPoolRowVm } from "@/lib/services/animal-pool";
import { cn } from "@/lib/utils";

/**
 * RSC JSON + older Data Cache entries may still expose `kind` instead of `code`; handle both.
 */
function resolveAnimalCode(config: AnimalPoolRowVm["animalConfig"]): string {
  const any = config as AnimalPoolRowVm["animalConfig"] & { kind?: string };
  const raw = any.code ?? any.kind;
  return typeof raw === "string" && raw.length > 0 ? raw : "";
}

function formatCodeLabel(code: string) {
  if (!code) return "—";
  return code.replaceAll("_", " ");
}

type PoolsManagerProps = {
  yearId: number;
  yearLabel: string;
  calendarYear: number;
  rows: AnimalPoolRowVm[];
};

/**
 * One row per animal config. Memoized to limit rerenders when siblings save.
 * Local state tracks drafts; syncs from server props after `router.refresh()`.
 */
const PoolConfigRow = memo(function PoolConfigRow({
  yearId,
  row,
}: {
  yearId: number;
  row: AnimalPoolRowVm;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [totalAnimalsStr, setTotalAnimalsStr] = useState(() =>
    String(row.pool?.totalAnimals ?? 0),
  );
  const [notes, setNotes] = useState(() => row.pool?.notes ?? "");

  const updatedKey =
    row.pool == null
      ? "none"
      : typeof row.pool.updatedAt === "string"
        ? row.pool.updatedAt
        : row.pool.updatedAt.toISOString();

  useEffect(() => {
    setTotalAnimalsStr(String(row.pool?.totalAnimals ?? 0));
    setNotes(row.pool?.notes ?? "");
  }, [row.pool?.totalAnimals, row.pool?.notes, updatedKey, row.animalConfig.id]);

  const preview = useMemo(() => {
    const n = Number.parseInt(totalAnimalsStr, 10);
    if (!Number.isFinite(n) || n < 0) {
      return { portions: null as number | null, payas: null as number | null };
    }
    return {
      portions: n * row.animalConfig.portionsPerAnimal,
      payas: n * row.animalConfig.payasPerAnimal,
    };
  }, [totalAnimalsStr, row.animalConfig.portionsPerAnimal, row.animalConfig.payasPerAnimal]);

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      startTransition(async () => {
        const fd = new FormData(form);
        const result = await upsertAnimalPoolAction(fd);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Pool saved.");
        router.refresh();
      });
    },
    [router],
  );

  const { animalConfig: c } = row;
  const configCode = resolveAnimalCode(c);

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 border-b border-border py-4 last:border-b-0 sm:grid-cols-12 sm:items-end"
    >
      <input type="hidden" name="yearId" value={yearId} />
      <input type="hidden" name="animalConfigId" value={c.id} />

      <div className="sm:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatCodeLabel(configCode)}
        </p>
        <p className="font-semibold text-foreground">{c.label}</p>
        <p className="text-xs text-muted-foreground">
          {c.portionsPerAnimal} portions / animal · {c.payasPerAnimal} payas / animal
        </p>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={`total-${c.id}`}>Total animals</Label>
        <Input
          id={`total-${c.id}`}
          name="totalAnimals"
          type="number"
          min={0}
          required
          inputMode="numeric"
          autoComplete="off"
          value={totalAnimalsStr}
          onChange={(e) => setTotalAnimalsStr(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <span className="text-sm font-medium text-foreground">Total portions</span>
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums">
          {preview.portions == null ? "—" : preview.portions.toLocaleString()}
        </p>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <span className="text-sm font-medium text-foreground">Total payas</span>
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums">
          {preview.payas == null ? "—" : preview.payas.toLocaleString()}
        </p>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={`notes-${c.id}`}>Notes</Label>
        <Input
          id={`notes-${c.id}`}
          name="notes"
          type="text"
          maxLength={2000}
          placeholder="Optional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="sm:col-span-1 sm:flex sm:justify-end">
        <Button type="submit" size="sm" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
});

export function PoolsManager({ yearId, yearLabel, calendarYear, rows }: PoolsManagerProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Animal pools</h1>
        <p className="mt-2 text-muted-foreground">
          Set how many animals of each type are planned for the active season. Portions and payas
          are calculated from masjid rules (fixed per animal type). Only four rows — no pagination.
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {yearLabel}{" "}
          <span className="tabular-nums text-muted-foreground">({calendarYear})</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pools by animal type</CardTitle>
          <CardDescription>
            Save each row after editing. Slaughter schedules (next step) must add up to these totals.
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(rows.length === 0 && "py-8 text-center text-muted-foreground")}>
          {rows.length === 0 ? (
            <p className="text-pretty">
              No animal types yet.{" "}
              <Link href="/admin/season/animal-types" className="font-medium text-primary underline-offset-2 hover:underline">
                Add animal types
              </Link>{" "}
              or run the database seed.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <PoolConfigRow
                  key={row.animalConfig.id}
                  yearId={yearId}
                  row={row}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
