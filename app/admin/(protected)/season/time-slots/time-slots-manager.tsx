"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState, useTransition } from "react";

import {
  createTimeSlotAction,
  deleteTimeSlotAction,
  updateTimeSlotAction,
} from "@/app/admin/(protected)/season/time-slots/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { EidDay } from "@prisma/client";
import type {
  TimeSlotAnimalGroupVm,
  TimeSlotDayGroupVm,
  TimeSlotRowVm,
} from "@/lib/services/time-slot";
import { cn } from "@/lib/utils";

function resolveAnimalCode(config: TimeSlotAnimalGroupVm["animalConfig"]): string {
  const any = config as TimeSlotAnimalGroupVm["animalConfig"] & { kind?: string };
  const raw = any.code ?? any.kind;
  return typeof raw === "string" && raw.length > 0 ? raw : "";
}

function formatCodeLabel(code: string) {
  if (!code) return "—";
  return code.replaceAll("_", " ");
}

function eidDayTitle(eidDay: EidDay): string {
  if (eidDay === "DAY_1") return "Eid day 1";
  if (eidDay === "DAY_2") return "Eid day 2";
  return "Eid day 3";
}

type EidDateLabels = { DAY_1: string; DAY_2: string; DAY_3: string };

type ManagerProps = {
  yearId: number;
  yearLabel: string;
  calendarYear: number;
  eidDateLabels: EidDateLabels;
  groups: TimeSlotAnimalGroupVm[];
};

const SlotRow = memo(function SlotRow({
  yearId,
  eidDateLabel,
  slot,
  onEdit,
  onDeleted,
}: {
  yearId: number;
  eidDateLabel: string;
  slot: TimeSlotRowVm;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const onDelete = useCallback(() => {
    if (!window.confirm("Delete this time slot? This cannot be undone.")) return;
    const fd = new FormData();
    fd.set("yearId", String(yearId));
    fd.set("timeSlotId", String(slot.id));
    startTransition(async () => {
      const r = await deleteTimeSlotAction(fd);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Time slot removed.");
      onDeleted();
    });
  }, [onDeleted, slot.id, yearId]);

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-foreground">{slot.slotLabel}</p>
        <p className="text-sm text-muted-foreground">
          {slot.startHHMM}–{slot.endHHMM} UTC · calendar {eidDateLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {slot.animalsAssigned} animals → {slot.totalPortions.toLocaleString()} portions,{" "}
          {slot.totalPayas.toLocaleString()} payas capacity · booked {slot.bookedPortions} portions /{" "}
          {slot.bookedPayas} payas
        </p>
        {!slot.isActive ? (
          <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Hidden from new bookings
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onEdit}>
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
});

const SlotEditForm = memo(function SlotEditForm({
  yearId,
  portionsPerAnimal,
  eidDay,
  eidDateLabel,
  slot,
  onCancel,
  onSaved,
}: {
  yearId: number;
  portionsPerAnimal: number;
  eidDay: EidDay;
  eidDateLabel: string;
  slot: TimeSlotRowVm;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      startTransition(async () => {
        const fd = new FormData(form);
        const r = await updateTimeSlotAction(fd);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Time slot updated.");
        onSaved();
        router.refresh();
      });
    },
    [onSaved, router],
  );

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      <input type="hidden" name="yearId" value={yearId} />
      <input type="hidden" name="timeSlotId" value={slot.id} />
      <p className="text-xs font-medium text-muted-foreground">
        Edit slot · {eidDayTitle(eidDay)} ({eidDateLabel})
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`label-${slot.id}`}>Label</Label>
          <Input
            id={`label-${slot.id}`}
            name="slotLabel"
            defaultValue={slot.slotLabel}
            maxLength={120}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`st-${slot.id}`}>Start (UTC)</Label>
          <Input
            id={`st-${slot.id}`}
            name="startTime"
            type="time"
            defaultValue={slot.startHHMM}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`et-${slot.id}`}>End (UTC)</Label>
          <Input
            id={`et-${slot.id}`}
            name="endTime"
            type="time"
            defaultValue={slot.endHHMM}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`an-${slot.id}`}>Animals assigned</Label>
          <Input
            id={`an-${slot.id}`}
            name="animalsAssigned"
            type="number"
            min={0}
            defaultValue={slot.animalsAssigned}
            required
            inputMode="numeric"
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Portions = animals × {portionsPerAnimal}
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`act-${slot.id}`}>Visibility</Label>
          <select
            id={`act-${slot.id}`}
            name="isActive"
            defaultValue={slot.isActive ? "true" : "false"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
            disabled={pending}
          >
            <option value="true">Active (bookable)</option>
            <option value="false">Hidden</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
});

const DayColumn = memo(function DayColumn({
  yearId,
  animalConfigId,
  portionsPerAnimal,
  day,
  eidDateLabel,
}: {
  yearId: number;
  animalConfigId: number;
  portionsPerAnimal: number;
  day: TimeSlotDayGroupVm;
  eidDateLabel: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingAdd, startAdd] = useTransition();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const overAssigned = day.assignedSum > day.scheduleAnimals;
  const noCapacity = day.scheduleAnimals === 0;

  const onAddSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      startAdd(async () => {
        const fd = new FormData(form);
        const r = await createTimeSlotAction(fd);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Time slot added.");
        form.reset();
        router.refresh();
      });
    },
    [router],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="mb-3 border-b border-border pb-2">
        <p className="text-sm font-semibold text-foreground">{eidDayTitle(day.eidDay)}</p>
        <p className="text-xs text-muted-foreground">{eidDateLabel}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            Slaughter plan:{" "}
            <span className="font-semibold tabular-nums text-foreground">{day.scheduleAnimals}</span> animals
          </span>
          <span className="text-muted-foreground">
            In slots:{" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                overAssigned ? "text-destructive" : "text-foreground",
              )}
            >
              {day.assignedSum}
            </span>
          </span>
          <span className="text-muted-foreground">
            Remaining:{" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                day.remainingAnimals < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {day.remainingAnimals}
            </span>
          </span>
        </div>
        {noCapacity ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
            No animals on this day in the slaughter plan — set the split on the Slaughter page before assigning slots.
          </p>
        ) : null}
        {overAssigned ? (
          <p className="mt-2 text-xs text-destructive">
            Slots exceed slaughter for this day. Reduce animals in slots or increase the slaughter split.
          </p>
        ) : null}
      </div>

      <div className="min-h-[1rem]">
        {day.slots.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No slots yet.</p>
        ) : (
          day.slots.map((slot) =>
            editingId === slot.id ? (
              <SlotEditForm
                key={slot.id}
                yearId={yearId}
                portionsPerAnimal={portionsPerAnimal}
                eidDay={day.eidDay}
                eidDateLabel={eidDateLabel}
                slot={slot}
                onCancel={() => setEditingId(null)}
                onSaved={() => setEditingId(null)}
              />
            ) : (
              <SlotRow
                key={slot.id}
                yearId={yearId}
                eidDateLabel={eidDateLabel}
                slot={slot}
                onEdit={() => setEditingId(slot.id)}
                onDeleted={refresh}
              />
            )
          )
        )}
      </div>

      <form onSubmit={onAddSubmit} className="mt-4 space-y-2 border-t border-border pt-3">
        <input type="hidden" name="yearId" value={yearId} />
        <input type="hidden" name="animalConfigId" value={animalConfigId} />
        <input type="hidden" name="eidDay" value={day.eidDay} />
        <p className="text-xs font-medium text-foreground">Add slot</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`add-label-${animalConfigId}-${day.eidDay}`}>Label</Label>
            <Input
              id={`add-label-${animalConfigId}-${day.eidDay}`}
              name="slotLabel"
              placeholder='e.g. 9:00 PM – 10:00 PM'
              maxLength={120}
              required
              disabled={pendingAdd}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`add-st-${animalConfigId}-${day.eidDay}`}>Start (UTC)</Label>
            <Input id={`add-st-${animalConfigId}-${day.eidDay}`} name="startTime" type="time" required disabled={pendingAdd} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`add-et-${animalConfigId}-${day.eidDay}`}>End (UTC)</Label>
            <Input id={`add-et-${animalConfigId}-${day.eidDay}`} name="endTime" type="time" required disabled={pendingAdd} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`add-an-${animalConfigId}-${day.eidDay}`}>Animals in this slot</Label>
            <Input
              id={`add-an-${animalConfigId}-${day.eidDay}`}
              name="animalsAssigned"
              type="number"
              min={1}
              defaultValue={1}
              required
              inputMode="numeric"
              disabled={pendingAdd}
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pendingAdd || noCapacity}>
          {pendingAdd ? "Adding…" : "Add slot"}
        </Button>
      </form>
    </div>
  );
});

const AnimalCard = memo(function AnimalCard({
  yearId,
  group,
  eidDateLabels,
}: {
  yearId: number;
  group: TimeSlotAnimalGroupVm;
  eidDateLabels: EidDateLabels;
}) {
  const c = group.animalConfig;
  const codeStr = resolveAnimalCode(c);

  return (
    <Card>
      <CardHeader className="border-b border-border bg-muted/30 py-4">
        <CardTitle className="text-base">{c.label}</CardTitle>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {formatCodeLabel(codeStr)} · pool {group.poolTotalAnimals.toLocaleString()} animals · {c.portionsPerAnimal}{" "}
          portions / animal · {c.payasPerAnimal} payas / animal
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {group.days.map((day) => (
            <DayColumn
              key={day.eidDay}
              yearId={yearId}
              animalConfigId={c.id}
              portionsPerAnimal={c.portionsPerAnimal}
              day={day}
              eidDateLabel={eidDateLabels[day.eidDay]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export function TimeSlotsManager({ yearId, yearLabel, calendarYear, eidDateLabels, groups }: ManagerProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Time slots</h1>
        <p className="mt-2 max-w-3xl text-pretty text-muted-foreground">
          Define collection windows per <strong>animal type</strong> and <strong>Eid day</strong>. Animals assigned
          across all slots for that day cannot exceed the <strong>slaughter plan</strong> for that day. Times use{" "}
          <strong>UTC</strong> on each Eid calendar date from the season.
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {yearLabel}{" "}
          <span className="tabular-nums text-muted-foreground">({calendarYear})</span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Before you start</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Complete <Link href="/admin/season/slaughter" className="font-medium text-primary underline-offset-2 hover:underline">slaughter day splits</Link>{" "}
            so each day has an animal count to allocate into slots.
          </li>
          <li>Slot capacity uses the same portion and payas rules as pools (from animal types).</li>
          <li>Deleting a slot is blocked if any portions or payas are already booked.</li>
        </ul>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No pools</CardTitle>
            <CardDescription>Add animal pools for this season first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/season/pools">Configure pools</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <AnimalCard key={g.animalConfig.id} yearId={yearId} group={g} eidDateLabels={eidDateLabels} />
          ))}
        </div>
      )}
    </div>
  );
}
