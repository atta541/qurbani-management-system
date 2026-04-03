import { AdminAppShell } from "@/components/admin/admin-app-shell";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return <AdminAppShell adminEmail={admin.email}>{children}</AdminAppShell>;
}
