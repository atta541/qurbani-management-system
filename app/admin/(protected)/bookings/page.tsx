import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-2 text-muted-foreground">
          Bookings, portions, and day pricing — will use `Booking`, `AnimalStock`, and `DayPricing`.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dummy pipeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {["Pending", "Confirmed", "Distributed"].map((s) => (
            <div key={s} className="rounded-lg border bg-muted/30 p-4 text-center text-sm font-medium">
              {s}
              <div className="mt-2 text-2xl font-bold text-muted-foreground">—</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
