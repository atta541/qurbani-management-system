import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-2 text-muted-foreground">
          Customer CRM — list, search, and edit will connect to the `Customer` model next.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dummy list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>No rows yet. This page is a shell for the upcoming customers table.</p>
        </CardContent>
      </Card>
    </div>
  );
}
