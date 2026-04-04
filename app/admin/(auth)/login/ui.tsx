"use client";

import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction } from "./actions";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="mx-auto w-full max-w-md space-y-10">
      <div className="flex items-center gap-4">
        <Image
          src="/mask-icon.svg"
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-xl border border-border bg-card p-1.5 shadow-sm"
          priority
        />
        <div className="min-w-0 space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Qurbani Management</h1>
          <p className="text-sm text-muted-foreground">Admin portal</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-sm text-muted-foreground">Use your admin email and password to continue.</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/admin"} />

          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@example.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              className="h-11"
            />
          </div>

          {state?.error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="h-11 w-full text-base font-medium">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
