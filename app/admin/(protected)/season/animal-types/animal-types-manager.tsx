"use client";

import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  createAnimalConfigAction,
  deleteAnimalConfigAction,
  updateAnimalConfigAction,
} from "@/app/admin/(protected)/season/animal-types/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { AnimalConfigListItem } from "@/lib/services/animal-config";
import { cn } from "@/lib/utils";

function usageTotal(c: AnimalConfigListItem["_count"]) {
  return (
    c.animalPools +
    c.slaughterSchedules +
    c.dayPricing +
    c.timeSlots +
    c.bookings
  );
}

function formatCodeForDisplay(code: string) {
  return code.replaceAll("_", " ");
}

const ConfigRow = memo(function ConfigRow({ row }: { row: AnimalConfigListItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(row.label);
  const [portions, setPortions] = useState(String(row.portionsPerAnimal));
  const [payas, setPayas] = useState(String(row.payasPerAnimal));
  const [description, setDescription] = useState(row.description ?? "");

  const updatedKey =
    typeof row.updatedAt === "string" ? row.updatedAt : row.updatedAt.toISOString();

  useEffect(() => {
    setLabel(row.label);
    setPortions(String(row.portionsPerAnimal));
    setPayas(String(row.payasPerAnimal));
    setDescription(row.description ?? "");
  }, [row.label, row.portionsPerAnimal, row.payasPerAnimal, row.description, updatedKey]);

  const inUse = useMemo(() => usageTotal(row._count) > 0, [row._count]);

  const onUpdate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      startTransition(async () => {
        const fd = new FormData(form);
        const r = await updateAnimalConfigAction(fd);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Animal type updated.");
        router.refresh();
      });
    },
    [router],
  );

  const onDelete = useCallback(() => {
    if (!window.confirm(`Delete "${row.code}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(row.id));
      const r = await deleteAnimalConfigAction(fd);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Animal type removed.");
      router.refresh();
    });
  }, [row.code, row.id, router]);

  return (
    <tr className="border-b border-border/80">
      <td className="py-3 pr-3 align-top">
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{row.code}</code>
        <p className="mt-1 text-xs text-muted-foreground">{formatCodeForDisplay(row.code)}</p>
      </td>
      <td className="py-3 pr-3 align-top" colSpan={4}>
        <form onSubmit={onUpdate} className="grid gap-3 sm:grid-cols-12 sm:items-end">
          <input type="hidden" name="id" value={row.id} />
          <div className="space-y-1 sm:col-span-3">
            <Label className="text-xs">Label</Label>
            <Input
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={pending}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Portions / animal</Label>
            <Input
              name="portionsPerAnimal"
              type="number"
              min={1}
              required
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Payas / animal</Label>
            <Input
              name="payasPerAnimal"
              type="number"
              min={0}
              required
              value={payas}
              onChange={(e) => setPayas(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1 sm:col-span-3">
            <Label className="text-xs">Description</Label>
            <Input
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              maxLength={5000}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2 sm:justify-end">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || inUse}
              title={
                inUse
                  ? "Remove pools, schedules, pricing, slots, and bookings that use this type first."
                  : undefined
              }
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        </form>
        {inUse ? (
          <p className="mt-2 text-xs text-muted-foreground">
            In use: pools {row._count.animalPools}, bookings {row._count.bookings}, schedules{" "}
            {row._count.slaughterSchedules}, pricing {row._count.dayPricing}, slots{" "}
            {row._count.timeSlots}. Changing portions/payas affects new pool math; existing pool rows
            keep stored totals until you re-save them on the Pools page.
          </p>
        ) : null}
      </td>
    </tr>
  );
});

export function AnimalTypesManager({
  initialConfigs,
}: {
  initialConfigs: AnimalConfigListItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onCreate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      startTransition(async () => {
        const fd = new FormData(form);
        const r = await createAnimalConfigAction(fd);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Animal type added.");
        form.reset();
        router.refresh();
      });
    },
    [router],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Animal types</h1>
        <p className="mt-2 text-muted-foreground">
          Each type has a permanent <strong>code</strong> (UPPER_SNAKE_CASE, stored as{" "}
          <code className="rounded bg-muted px-1 text-sm">kind</code> in the database). Add types
          here without deployments. Use the Pools page to set counts per season.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add type</CardTitle>
          <CardDescription>
            Example codes: <code className="text-xs">BUFFALO</code>,{" "}
            <code className="text-xs">COW_MALE</code>. Codes cannot be changed after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-12 sm:items-end">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="new-code">Code</Label>
              <Input
                id="new-code"
                name="code"
                required
                autoComplete="off"
                placeholder="BUFFALO"
                className="font-mono uppercase"
                disabled={pending}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="new-label">Label</Label>
              <Input id="new-label" name="label" required maxLength={200} disabled={pending} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="new-portions">Portions / animal</Label>
              <Input
                id="new-portions"
                name="portionsPerAnimal"
                type="number"
                min={1}
                defaultValue={1}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="new-payas">Payas / animal</Label>
              <Input
                id="new-payas"
                name="payasPerAnimal"
                type="number"
                min={0}
                defaultValue={4}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="new-desc">Description</Label>
              <Input id="new-desc" name="description" maxLength={5000} disabled={pending} />
            </div>
            <div className="sm:col-span-1">
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All types ({initialConfigs.length})</CardTitle>
          <CardDescription>Edit labels and rules; delete only when nothing references this type.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {initialConfigs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No types yet. Add one above.</p>
          ) : (
            <table className={cn("w-full min-w-[720px] text-sm")}>
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 font-medium" colSpan={4}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialConfigs.map((row) => (
                  <ConfigRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
