/** Lightweight placeholder while session + shell data resolve inside `<Suspense>`. */
export function AdminShellFallback() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Loading admin…</p>
    </div>
  );
}
