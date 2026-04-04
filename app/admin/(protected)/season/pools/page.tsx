import Link from "next/link";

import { PoolsManager } from "@/app/admin/(protected)/season/pools/pools-manager";
import { listAnimalPoolsWithConfigsForYear } from "@/lib/services/animal-pool";
import { getActiveYear } from "@/lib/services/year";
import { Button } from "@/components/ui/button";

/**
 * Phase 2 — Animal pools for the active Eid season (fixed small row count; no pagination).
 */
export default async function AdminSeasonPoolsPage() {
  const active = await getActiveYear();

  if (!active) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">No active season</h1>
        <p className="text-sm text-muted-foreground">
          Choose an active season first, then you can set how many animals of each type are planned.
        </p>
        <Button asChild variant="default">
          <Link href="/admin/season/years">Go to seasons</Link>
        </Button>
      </div>
    );
  }

  const rows = await listAnimalPoolsWithConfigsForYear(active.id);

  return (
    <PoolsManager
      yearId={active.id}
      yearLabel={active.label}
      calendarYear={active.year}
      rows={rows}
    />
  );
}
