"use client";

import { setActiveYearAction } from "@/app/admin/(protected)/season/years/actions";
import {
  adminNavEntries,
  adminNavEntryIsActive,
  type AdminNavEntry,
  type AdminNavLink,
} from "@/components/admin/admin-nav";
import { ThemeSettingsSheet } from "@/components/theme-settings-sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { logoutAction } from "@/app/admin/(auth)/login/actions";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

const STORAGE_KEY = "admin-sidebar-collapsed";
const SEASON_NAV_EXPANDED_KEY = "admin-sidebar-season-expanded";

/** Serializable snapshot of active `Year` (from server layout). */
export type AdminActiveSeason = {
  id: number;
  /** Same as DB `Year.year` (e.g. 2026). */
  seasonYear: number;
  label: string;
};

export type AdminSeasonOption = {
  id: number;
  year: number;
  label: string;
};

function HeaderSeasonSelect({
  activeSeason,
  seasonOptions,
}: {
  activeSeason: AdminActiveSeason | null;
  seasonOptions: AdminSeasonOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const value = activeSeason ? String(activeSeason.id) : "";

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <label className="sr-only" htmlFor="header-active-season">
        Active season
      </label>
      <select
        id="header-active-season"
        className={cn(
          "h-9 max-w-full min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:max-w-[min(280px,42vw)]",
        )}
        value={value}
        disabled={pending || seasonOptions.length === 0}
        onChange={(e) => {
          const id = Number(e.target.value);
          if (!Number.isFinite(id) || id <= 0) return;
          if (activeSeason && id === activeSeason.id) return;
          startTransition(async () => {
            const fd = new FormData();
            fd.set("yearId", String(id));
            const r = await setActiveYearAction(fd);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            toast.success("Active season updated.");
            router.refresh();
          });
        }}
      >
        {seasonOptions.length === 0 ? (
          <option value="">No seasons yet</option>
        ) : (
          <>
            {!activeSeason ? (
              <option value="" disabled>
                Select active season…
              </option>
            ) : null}
            {seasonOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({o.year})
              </option>
            ))}
          </>
        )}
      </select>
      <Link
        href="/admin/season/years"
        className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        Manage seasons
      </Link>
    </div>
  );
}

function isLink(entry: AdminNavEntry): entry is AdminNavLink {
  return entry.type === "link";
}

function pathIsActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminAppShell({
  adminEmail,
  activeSeason,
  seasonOptions,
  children,
}: {
  adminEmail: string;
  activeSeason: AdminActiveSeason | null;
  seasonOptions: AdminSeasonOption[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [seasonNavOpen, setSeasonNavOpen] = React.useState(true);

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

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(SEASON_NAV_EXPANDED_KEY);
      if (v === "false") setSeasonNavOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(SEASON_NAV_EXPANDED_KEY, seasonNavOpen ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [seasonNavOpen]);

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
          {adminNavEntries.map((entry) => {
            if (isLink(entry)) {
              const active = pathIsActive(pathname, entry.href);
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  title={collapsed ? entry.title : undefined}
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
                  {!collapsed ? <span>{entry.title}</span> : null}
                </Link>
              );
            }

            const group = entry;
            const groupActive = adminNavEntryIsActive(pathname, group);
            const GroupIcon = group.icon;

            if (collapsed) {
              return (
                <Link
                  key={group.title}
                  href={group.href}
                  title={group.title}
                  aria-current={groupActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center rounded-lg px-0 py-2 text-sm transition-colors",
                    "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    groupActive &&
                      "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring/35",
                    !groupActive && "font-medium",
                  )}
                >
                  <GroupIcon
                    className={cn("size-5 shrink-0", groupActive ? "opacity-100" : "opacity-90")}
                  />
                </Link>
              );
            }

            return (
              <div key={group.title} className="flex flex-col">
                <div className="flex min-w-0 items-center gap-0.5 rounded-lg pr-1 transition-colors hover:bg-sidebar-accent/50">
                  <Link
                    href={group.href}
                    aria-current={
                      pathIsActive(pathname, group.href) && pathname === group.href ? "page" : undefined
                    }
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      pathIsActive(pathname, group.href) &&
                        pathname === group.href &&
                        "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring/35",
                      !pathIsActive(pathname, group.href) && "font-medium",
                    )}
                  >
                    <GroupIcon
                      className={cn(
                        "size-5 shrink-0",
                        pathIsActive(pathname, group.href) && pathname === group.href
                          ? "opacity-100"
                          : "opacity-90",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-left">{group.title}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSeasonNavOpen((o) => !o)}
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/80 transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    aria-expanded={seasonNavOpen}
                    aria-controls="admin-nav-season-sub"
                    title={seasonNavOpen ? "Collapse Season" : "Expand Season"}
                  >
                    <ChevronRight
                      className={cn(
                        "size-4 transition-transform duration-300 ease-out",
                        seasonNavOpen && "rotate-90",
                      )}
                      aria-hidden
                    />
                  </button>
                </div>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                    seasonNavOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div id="admin-nav-season-sub" className="min-h-0 overflow-hidden">
                    <div className="ml-2 space-y-0.5 border-l border-sidebar-border/50 py-0.5 pl-2">
                      {group.children.map((child) => {
                        const active = pathIsActive(pathname, child.href);
                        const CIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                              "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              active &&
                                "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring/35",
                              !active && "font-medium",
                            )}
                          >
                            <CIcon className={cn("size-4 shrink-0", active ? "opacity-100" : "opacity-90")} />
                            <span className="truncate">{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
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
        <header className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex-nowrap md:py-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 shrink-0 px-0 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden size-9 shrink-0 px-0 md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar (⌘B / Ctrl+B)"
          >
            <PanelLeft className="size-5" />
          </Button>

          <div className="min-w-0 flex-1 text-sm">
            <div className="flex flex-col gap-2 sm:gap-1.5">
              <div className="truncate">
                <span className="hidden text-muted-foreground sm:inline">Signed in as </span>
                <span className="font-medium text-foreground">{adminEmail}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-2 border-t border-border/60 pt-2 sm:flex-row sm:items-center sm:border-t-0 sm:pt-0 md:gap-3">
                <span className="hidden shrink-0 text-muted-foreground md:inline">Season</span>
                <HeaderSeasonSelect activeSeason={activeSeason} seasonOptions={seasonOptions} />
              </div>
            </div>
          </div>

          <ThemeSettingsSheet />

          <form action={logoutAction} className="shrink-0">
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
