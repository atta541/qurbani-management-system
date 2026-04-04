import Link from "next/link";

import { SlaughterScheduleManager } from "@/app/admin/(protected)/season/slaughter/slaughter-manager";
import { listSlaughterScheduleRowsForYear } from "@/lib/services/slaughter-schedule";
import { getActiveYear } from "@/lib/services/year";
import { Button } from "@/components/ui/button";

export default async function AdminSlaughterSchedulePage() {
  const active = await getActiveYear();

  if (!active) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">No active season</h1>
        <p className="text-sm text-muted-foreground">Activate a season first, then set pools and slaughter days.</p>
        <Button asChild variant="default">
          <Link href="/admin/season/years">Go to seasons</Link>
        </Button>
      </div>
    );
  }

  const rows = await listSlaughterScheduleRowsForYear(active.id);

  return (
    <SlaughterScheduleManager
      yearId={active.id}
      yearLabel={active.label}
      calendarYear={active.year}
      rows={rows}
    />
  );
}
