"use client";

import { Monitor, Moon, Paintbrush, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  applyColorTheme,
  colorThemes,
  readStoredColorTheme,
  type ColorThemeId,
} from "@/lib/color-themes";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

export function ThemeSettingsSheet() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [colorTheme, setColorTheme] = React.useState<ColorThemeId>("zinc");

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!mounted) return;
    setColorTheme(readStoredColorTheme());
  }, [mounted, open]);

  const appearance = theme ?? "system";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Theme and appearance"
        >
          <Paintbrush className="size-4" />
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Theme</SheetTitle>
          <SheetDescription>
            Choose accent colors and light or dark appearance. Settings are saved in this browser.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-8 pt-2">
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "light" as const, label: "Light", icon: Sun },
                  { id: "dark" as const, label: "Dark", icon: Moon },
                  { id: "system" as const, label: "System", icon: Monitor },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  type="button"
                  variant={appearance === id ? "default" : "outline"}
                  size="sm"
                  className="flex h-auto flex-col gap-1 py-3"
                  disabled={!mounted}
                  onClick={() => {
                    setTheme(id);
                    toast(`Appearance: ${label}`, { description: "Theme preference saved." });
                  }}
                >
                  <Icon className="size-4" />
                  <span className="text-xs font-normal">{label}</span>
                </Button>
              ))}
            </div>
            {mounted ? (
              <p className="text-xs text-muted-foreground">
                Active: {appearance === "system" ? `System (${resolvedTheme})` : appearance}
              </p>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Accent color</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {colorThemes.map((t) => {
                const selected = colorTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      applyColorTheme(t.id);
                      setColorTheme(t.id === "zinc" ? "zinc" : t.id);
                      toast(`Accent: ${t.label}`, { description: "Color theme updated." });
                    }}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                      "hover:bg-accent/50",
                      selected && "border-primary bg-accent/40 ring-2 ring-ring ring-offset-2 ring-offset-background",
                    )}
                  >
                    <span
                      className={cn("size-8 rounded-full ring-2 ring-background shadow-sm", t.swatchClass)}
                    />
                    <span className="text-sm font-medium leading-none">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
