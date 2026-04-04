import { AdminAppShell } from "@/components/admin/admin-app-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveYear, listYearsForAdmin } from "@/lib/services/year";

/**
 * Async shell: reads session (`cookies`) + active year. Must render inside `<Suspense>` so the
 * route is not fully blocked (Next.js 16 — see blocking-route message).
 */
export async function AdminProtectedShell({ children }: { children: React.ReactNode }) {
  const [admin, activeYearRow, years] = await Promise.all([
    requireAdmin(),
    getActiveYear(),
    listYearsForAdmin(),
  ]);

  const activeSeason = activeYearRow
    ? { id: activeYearRow.id, seasonYear: activeYearRow.year, label: activeYearRow.label }
    : null;

  const seasonOptions = years.map((y) => ({
    id: y.id,
    year: y.year,
    label: y.label,
  }));

  return (
    <AdminAppShell
      adminEmail={admin.email}
      activeSeason={activeSeason}
      seasonOptions={seasonOptions}
    >
      {children}
    </AdminAppShell>
  );
}
