"use client";

import { Calendar, ChevronLeft, Menu, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { adminNavItems } from "@/components/admin/admin-nav";
import { ThemeSettingsSheet } from "@/components/theme-settings-sheet";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/admin/(auth)/login/actions";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "admin-sidebar-collapsed";

/** Serializable snapshot of `Year` where `isActive` is true (from server layout). */
export type AdminActiveSeason = {
  /** Same as DB `Year.year` (e.g. 2026). */
  seasonYear: number;
  label: string;
};

export function AdminAppShell({
  adminEmail,
  activeSeason,
  children,
}: {
  adminEmail: string;
  /** Null when no season is marked active — prompt admin to choose one. */
  activeSeason: AdminActiveSeason | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleSidebar = () => setCollapsed((c) => !c);

  return (
    <div className="flex min-h-svh w-full bg-background text-foreground">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Fixed full viewport height so main scroll does not move the rail (md+). Mobile: off-canvas overlay. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-linear",
          collapsed ? "w-14" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border px-3",
            collapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 truncate font-semibold tracking-tight text-sidebar-foreground",
              collapsed && "justify-center",
            )}
            title="Qurbani Admin"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
              Q
            </span>
            {!collapsed ? <span className="truncate">Qurbani Admin</span> : null}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {adminNavItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring/35",
                  !active && "font-medium",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className={cn("size-5 shrink-0", active ? "opacity-100" : "opacity-90")} />
                {!collapsed ? <span>{item.title}</span> : null}
              </Link>
            );
          })}
        </nav>

        {/* Active Eid season — mirrors Phase 2 `Year.isActive`; links to change it */}
        <div
          className={cn(
            "border-t border-sidebar-border p-2",
            !activeSeason && "bg-amber-500/5",
          )}
        >
          {activeSeason ? (
            collapsed ? (
              <Link
                href="/admin/season/years"
                className="flex size-10 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                title={`Active season: ${activeSeason.label} (${activeSeason.seasonYear})`}
                aria-label={`Active season: ${activeSeason.label}, year ${activeSeason.seasonYear}. Change season.`}
              >
                <Calendar className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              </Link>
            ) : (
              <Link
                href="/admin/season/years"
                className="block rounded-lg bg-sidebar-accent/60 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                  Active season
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-sidebar-foreground">
                  {activeSeason.label}
                </p>
                <p className="text-xs tabular-nums text-sidebar-foreground/70">{activeSeason.seasonYear}</p>
              </Link>
            )
          ) : collapsed ? (
            <Link
              href="/admin/season/years"
              className="flex size-10 items-center justify-center rounded-lg text-amber-700 dark:text-amber-400"
              title="No active season — select one"
              aria-label="No active season. Open season settings."
            >
              <Calendar className="size-5 shrink-0" />
            </Link>
          ) : (
            <Link
              href="/admin/season/years"
              className="block rounded-lg border border-dashed border-amber-500/40 px-3 py-2 text-sm font-medium text-amber-900 dark:text-amber-100"
            >
              No active season — select one
            </Link>
          )}
        </div>

        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeft className="size-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="size-5 shrink-0" />
                <span className="text-left">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Reserve horizontal space on md+ so content sits beside fixed sidebar; width tracks collapse. */}
      <div
        className={cn(
          "flex min-h-svh min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-linear",
          collapsed ? "md:pl-14" : "md:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 px-0 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden size-9 px-0 md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar (⌘B / Ctrl+B)"
          >
            <PanelLeft className="size-5" />
          </Button>

          <div className="min-w-0 flex-1 text-sm">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3">
              <span className="truncate">
                <span className="hidden text-muted-foreground sm:inline">Signed in as </span>
                <span className="font-medium text-foreground">{adminEmail}</span>
              </span>
              {activeSeason ? (
                <span className="hidden items-baseline gap-1.5 text-muted-foreground md:inline-flex">
                  <span className="shrink-0">·</span>
                  <span className="shrink-0">Season</span>
                  <span
                    className="truncate font-medium text-foreground"
                    title={`${activeSeason.label} (${activeSeason.seasonYear})`}
                  >
                    {activeSeason.label}
                    <span className="ml-1 tabular-nums font-normal text-muted-foreground">
                      ({activeSeason.seasonYear})
                    </span>
                  </span>
                  <Link
                    href="/admin/season/years"
                    className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Change
                  </Link>
                </span>
              ) : (
                <Link
                  href="/admin/season/years"
                  className="hidden text-xs font-semibold text-amber-700 underline-offset-2 hover:underline dark:text-amber-400 md:inline"
                >
                  Select active season
                </Link>
              )}
            </div>
          </div>

          {/* Compact season chip on small screens (full details stay in sidebar + md+ header) */}
          {activeSeason ? (
            <Link
              href="/admin/season/years"
              className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-semibold tabular-nums text-foreground md:hidden"
              title={`${activeSeason.label} (${activeSeason.seasonYear})`}
            >
              <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {activeSeason.seasonYear}
            </Link>
          ) : (
            <Link
              href="/admin/season/years"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 md:hidden"
            >
              Season
            </Link>
          )}

          <ThemeSettingsSheet />

          <form action={logoutAction}>
            <Button variant="outline" size="sm">
              Logout
            </Button>
          </form>
        </header>

        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
