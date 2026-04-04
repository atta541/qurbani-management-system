import { YearsManager } from "@/app/admin/(protected)/season/years/years-manager";
import { getActiveYear, listYearsForAdmin } from "@/lib/services/year";

/**
 * Phase 2 — Step 1: Eid season (`Year`) CRUD entry point.
 * Auth is enforced by the parent `(protected)` layout + `requireAdmin` inside server actions.
 */
export default async function AdminSeasonYearsPage() {


  const [years, active] = await Promise.all([listYearsForAdmin(), getActiveYear()]);

  return <YearsManager years={years} hasActiveYear={active !== null} />;
}
