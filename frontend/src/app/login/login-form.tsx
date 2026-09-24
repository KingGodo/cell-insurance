"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const presets = [
  { as: "claims", label: "Claims desk", email: "claims@cellgroup.demo" },
  { as: "service", label: "Service desk", email: "service@cellgroup.demo" },
  { as: "customer", label: "John Moyo", email: "john.moyo@cellgroup.demo" },
  { as: "admin", label: "Admin", email: "admin@cellgroup.demo" },
];

export function LoginForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={defaultEmail} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required defaultValue="CustomerIQ123" />
      </div>
      {state?.error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full font-semibold">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <a
            key={preset.as}
            href={`/login?as=${preset.as}`}
            aria-current={preset.email === defaultEmail ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-center text-sm ${
              preset.email === defaultEmail
                ? "bg-foreground font-medium text-background"
                : "border border-border hover:bg-secondary"
            }`}
          >
            {preset.label}
          </a>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Demo password for every account: CustomerIQ123</p>
    </form>
  );
}
