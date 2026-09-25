"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeRetentionPlan, saveRetentionPlan } from "@/lib/actions";

const channels = [
  { id: "SMS", label: "SMS" },
  { id: "EMAIL", label: "Email" },
  { id: "SOCIALS", label: "Socials" },
  { id: "MARKETING", label: "Marketing team" },
  { id: "CUSTOMER_SERVICE", label: "Customer service" },
  { id: "PORTAL", label: "Customer portal" },
] as const;

export type Plan = {
  id: string;
  name: string;
  summary: string;
  offer: string;
  cost: number;
  channels: string[];
  enabled: boolean;
  _count?: { deployments: number };
};

const blank: Plan = {
  id: "",
  name: "",
  summary: "",
  offer: "",
  cost: 0,
  channels: ["SMS", "EMAIL"],
  enabled: true,
};

export function RetentionPlans({ plans }: { plans: Plan[] }) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Plans</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Add the offer, its cost, and the channels it uses. A plan stays off the book until a rule on the Rules page gives it a value and risk threshold. Deactivate a plan to stop new sends, or remove it.
        </p>
      </header>
      <PlanForm plan={blank} heading="Add a plan" submitLabel="Add plan" />
      <ul className="space-y-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <PlanForm plan={plan} heading={plan.name} submitLabel="Save plan" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanForm({ plan, heading, submitLabel }: { plan: Plan; heading: string; submitLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const high = Number(plan.cost) >= 400;
  const onBook = plan._count?.deployments ?? 0;

  async function onSubmit(formData: FormData) {
    setSaved(false);
    const result = await saveRetentionPlan(formData);
    setError(result?.error ?? "");
    setSaved(!result?.error);
    if (!result?.error) router.refresh();
  }

  async function onRemove() {
    if (!plan.id) return;
    if (!window.confirm(`Remove ${plan.name}? Open deployments on it will close.`)) return;
    const formData = new FormData();
    formData.set("id", plan.id);
    const result = await removeRetentionPlan(formData);
    setError(result?.error ?? "");
    if (!result?.error) router.refresh();
  }

  return (
    <form action={onSubmit} className="rounded-2xl border border-border bg-card px-4 py-4">
      {plan.id ? <input type="hidden" name="id" value={plan.id} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">{heading}</h2>
        {plan.id ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.enabled ? "bg-foreground text-primary" : "bg-accent text-foreground"}`}>
            {plan.enabled ? (high ? "High cost" : "Standard cost") : "Deactivated"}
            {onBook ? ` · ${onBook} deployed` : ""}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={plan.name} />
        <TextField label="Offer" name="offer" defaultValue={plan.offer} />
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">What this plan is for</span>
          <textarea name="summary" defaultValue={plan.summary} rows={2} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Cost</span>
          <input name="cost" defaultValue={plan.id ? String(plan.cost) : ""} inputMode="numeric" className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-3" />
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Deploy through</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {channels.map((channel) => (
            <label key={channel.id} className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-3 text-sm">
              <input type="checkbox" name="channels" value={channel.id} defaultChecked={plan.channels.includes(channel.id)} />
              {channel.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={plan.enabled} />
          Plan is on
        </label>
        <button type="submit" className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-primary">
          {submitLabel}
        </button>
        {plan.id ? (
          <button type="button" onClick={onRemove} className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium">
            Remove
          </button>
        ) : null}
        {saved ? <p className="text-sm">Saved.</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}

function TextField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} defaultValue={defaultValue} className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-3" />
    </label>
  );
}
