import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Season, masjid defaults, and notification templates — placeholder for now.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application</CardTitle>
          <CardDescription>Single-admin setup; no role matrix required.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Change password and Eid year toggles can live here in a later iteration.
        </CardContent>
      </Card>
    </div>
  );
}
