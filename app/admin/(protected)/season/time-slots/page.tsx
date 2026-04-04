import Link from "next/link";

import { TimeSlotsManager } from "@/app/admin/(protected)/season/time-slots/time-slots-manager";
import { listTimeSlotAdminGroupsForYear } from "@/lib/services/time-slot";
import { getActiveYear } from "@/lib/services/year";
import { Button } from "@/components/ui/button";

function utcDateLabel(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminTimeSlotsPage() {
  const active = await getActiveYear();

  if (!active) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">No active season</h1>
        <p className="text-sm text-muted-foreground">
          Activate a season first, then set pools, slaughter, and time slots.
        </p>
        <Button asChild variant="default">
          <Link href="/admin/season/years">Go to seasons</Link>
        </Button>
      </div>
    );
  }

  const groups = await listTimeSlotAdminGroupsForYear(active.id);

  const eidDateLabels = {
    DAY_1: utcDateLabel(active.eidDay1),
    DAY_2: utcDateLabel(active.eidDay2),
    DAY_3: utcDateLabel(active.eidDay3),
  } as const;

  return (
    <TimeSlotsManager
      yearId={active.id}
      yearLabel={active.label}
      calendarYear={active.year}
      eidDateLabels={eidDateLabels}
      groups={groups}
    />
  );
}
