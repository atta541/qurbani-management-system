"use client";

import { ChevronLeft, Menu, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { adminNavItems } from "@/components/admin/admin-nav";
import { ThemeSettingsSheet } from "@/components/theme-settings-sheet";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/admin/(auth)/login/actions";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminAppShell({
  adminEmail,
  children,
}: {
  adminEmail: string;
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

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-linear md:relative md:translate-x-0",
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

      <div className="flex min-w-0 flex-1 flex-col">
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

          <div className="flex-1 text-sm">
            <span className="hidden text-muted-foreground sm:inline">Signed in as </span>
            <span className="font-medium text-foreground">{adminEmail}</span>
          </div>

          <ThemeSettingsSheet />

          <form action={logoutAction}>
            <Button variant="outline" size="sm">
              Logout
            </Button>
          </form>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
