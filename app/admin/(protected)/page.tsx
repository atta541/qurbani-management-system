import { CalendarCheck, Package, TrendingUp, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const stats = [
    {
      title: "Customers",
      value: "128",
      hint: "+12 this season",
      icon: Users,
    },
    {
      title: "Active bookings",
      value: "46",
      hint: "8 pending payment",
      icon: CalendarCheck,
    },
    {
      title: "Animals in stock",
      value: "22",
      hint: "4 low availability",
      icon: Package,
    },
    {
      title: "Collection (dummy)",
      value: "PKR 1.2M",
      hint: "Vs target: 94%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview for <span className="font-medium text-foreground">{admin.email}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Placeholder cards until modules are wired to Prisma.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Card className="bg-muted/40 shadow-none">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">New booking</p>
                <p className="text-xs text-muted-foreground">Coming next</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/40 shadow-none">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">Record payment</p>
                <p className="text-xs text-muted-foreground">Coming next</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/40 shadow-none sm:col-span-2">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">Distribution log</p>
                <p className="text-xs text-muted-foreground">Meat handoff on Eid day</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Season</CardTitle>
            <CardDescription>Dummy timeline block for the active Eid year.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium">Eid ul Adha season</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Stock, pricing, and bookings will appear here after we connect the Year / AnimalStock /
                DayPricing flows.
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[55%] rounded-full bg-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Placeholder progress — 55% booked (dummy)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
