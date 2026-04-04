import { AdminAppShell } from "@/components/admin/admin-app-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveYear } from "@/lib/services/year";

/**
 * Async shell: reads session (`cookies`) + active year. Must render inside `<Suspense>` so the
 * route is not fully blocked (Next.js 16 — see blocking-route message).
 */
export async function AdminProtectedShell({ children }: { children: React.ReactNode }) {
  const [admin, activeYearRow] = await Promise.all([requireAdmin(), getActiveYear()]);

  const activeSeason = activeYearRow
    ? { seasonYear: activeYearRow.year, label: activeYearRow.label }
    : null;

  return (
    <AdminAppShell adminEmail={admin.email} activeSeason={activeSeason}>
      {children}
    </AdminAppShell>
  );
}
