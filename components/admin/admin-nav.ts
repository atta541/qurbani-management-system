import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CalendarRange,
  LayoutDashboard,
  Package,
  Settings2,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const adminNavItems: AdminNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Season", href: "/admin/season/years", icon: CalendarRange },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { title: "Stock", href: "/admin/stock", icon: Package },
  { title: "Settings", href: "/admin/settings", icon: Settings2 },
];
