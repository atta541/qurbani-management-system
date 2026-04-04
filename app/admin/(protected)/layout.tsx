import { Suspense } from "react";

import { AdminProtectedShell } from "@/app/admin/(protected)/admin-protected-shell";
import { AdminShellFallback } from "@/app/admin/(protected)/admin-shell-fallback";

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminProtectedShell>{children}</AdminProtectedShell>
    </Suspense>
  );
}
