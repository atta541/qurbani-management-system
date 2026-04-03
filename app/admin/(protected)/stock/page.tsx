import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Stock</h1>
        <p className="mt-2 text-muted-foreground">
          Animals per year — `AnimalStock`, `AnimalType`, and tag numbers will be managed here.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Add animals, portions booked, and availability toggles will go here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
