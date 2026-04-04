import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Boxes,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  Package,
  Settings2,
  Tags,
  Users,
} from "lucide-react";

export type AdminNavLink = {
  type: "link";
  title: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  type: "group";
  title: string;
  /** Hub route when the sidebar is collapsed (icon-only) or when opening the section root. */
  href: string;
  icon: LucideIcon;
  children: AdminNavLink[];
};

export type AdminNavEntry = AdminNavLink | AdminNavGroup;

export const adminNavEntries: AdminNavEntry[] = [
  { type: "link", title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    type: "group",
    title: "Season",
    href: "/admin/season/years",
    icon: CalendarRange,
    children: [
      { type: "link", title: "Years", href: "/admin/season/years", icon: Calendar },
      { type: "link", title: "Animal types", href: "/admin/season/animal-types", icon: Tags },
      { type: "link", title: "Pools", href: "/admin/season/pools", icon: Package },
      { type: "link", title: "Slaughter", href: "/admin/season/slaughter", icon: CalendarDays },
      { type: "link", title: "Pricing", href: "/admin/season/pricing", icon: Banknote },
      { type: "link", title: "Time slots", href: "/admin/season/time-slots", icon: CalendarClock },
    ],
  },
  { type: "link", title: "Customers", href: "/admin/customers", icon: Users },
  { type: "link", title: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { type: "link", title: "Stock", href: "/admin/stock", icon: Boxes },
  { type: "link", title: "Settings", href: "/admin/settings", icon: Settings2 },
];

function pathIsActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** True if this entry (link or any child of a group) matches the current path. */
export function adminNavEntryIsActive(pathname: string, entry: AdminNavEntry): boolean {
  if (entry.type === "link") {
    return pathIsActive(pathname, entry.href);
  }
  if (pathIsActive(pathname, entry.href)) return true;
  return entry.children.some((c) => pathIsActive(pathname, c.href));
}
