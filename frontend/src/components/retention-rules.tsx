"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeRetentionRule, saveRetentionRule } from "@/lib/actions";

const months = [
  [1, "Jan"],
  [2, "Feb"],
  [3, "Mar"],
  [4, "Apr"],
  [5, "May"],
  [6, "Jun"],
  [7, "Jul"],
  [8, "Aug"],
  [9, "Sep"],
  [10, "Oct"],
  [11, "Nov"],
  [12, "Dec"],
] as const;

export type RulePlan = { id: string; name: string };

export type Rule = {
  id: string;
  planId: string;
  name: string;
  summary: string;
  valueMin: number | null;
  valueMax: number | null;
  riskMin: number | null;
  riskMax: number | null;
  requiresChildren: boolean;
  activeMonths: number[];
  enabled: boolean;
  priority: number;
  plan?: { id: string; name: string; enabled: boolean };
};

const blank: Rule = {
  id: "",
  planId: "",
  name: "",
  summary: "",
  valueMin: null,
  valueMax: null,
  riskMin: null,
  riskMax: null,
  requiresChildren: false,
  activeMonths: [],
  enabled: true,
  priority: 100,
};

export function RetentionRules({ rules, plans }: { rules: Rule[]; plans: RulePlan[] }) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Rules</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          A plan is not deployed until a rule here sets the value and risk figures a customer must meet. Extra conditions, such as a child on the membership or a school-reopen month, narrow the match. The system then chooses the closest rule.
        </p>
      </header>
            {plans?.length ? (
              <RuleForm rule={{ ...blank, planId: plans[0]?.id ?? "" }} plans={plans} heading="Add a rule" submitLabel="Add rule" />
            ) : (
              <p className="rounded-2xl bg-accent px-4 py-6 text-sm">Add a plan before you set a rule.</p>
            )}
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li key={rule.id}>
            <RuleForm rule={rule} plans={plans} heading={rule.name} submitLabel="Save rule" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuleForm({ rule, plans, heading, submitLabel }: { rule: Rule; plans: RulePlan[]; heading: string; submitLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaved(false);
    const result = await saveRetentionRule(formData);
    setError(result?.error ?? "");
    setSaved(!result?.error);
    if (!result?.error) router.refresh();
  }

  async function onRemove() {
    if (!rule.id) return;
    if (!window.confirm(`Remove ${rule.name}? The plan will stop using it.`)) return;
    const formData = new FormData();
    formData.set("id", rule.id);
    const result = await removeRetentionRule(formData);
    setError(result?.error ?? "");
    if (!result?.error) router.refresh();
  }

  return (
    <form action={onSubmit} className="rounded-2xl border border-border bg-card px-4 py-4">
      {rule.id ? <input type="hidden" name="id" value={rule.id} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{heading}</h2>
          {rule.plan ? <p className="mt-1 text-sm text-foreground/75">Plan · {rule.plan.name}</p> : null}
        </div>
        {rule.id ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.enabled ? "bg-foreground text-primary" : "bg-accent text-foreground"}`}>
            {rule.enabled ? "On" : "Off"}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Plan</span>
          <select name="planId" defaultValue={rule.planId} className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-3">
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <TextField label="Rule name" name="name" defaultValue={rule.name} />
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">What the rule considers</span>
          <textarea name="summary" defaultValue={rule.summary} rows={2} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" />
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <NumberField label="Value from" name="valueMin" defaultValue={rule.valueMin == null ? "" : String(rule.valueMin)} />
        <NumberField label="Value to" name="valueMax" defaultValue={rule.valueMax == null ? "" : String(rule.valueMax)} />
        <NumberField label="Risk from" name="riskMin" defaultValue={rule.riskMin == null ? "" : String(rule.riskMin)} />
        <NumberField label="Risk to" name="riskMax" defaultValue={rule.riskMax == null ? "" : String(rule.riskMax)} />
        <NumberField label="Priority" name="priority" defaultValue={String(rule.priority)} />
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="requiresChildren" defaultChecked={rule.requiresChildren} />
        Only holders with children
      </label>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Active months</legend>
        <p className="mt-1 text-sm text-foreground/75">Leave every month off and the rule can match any time. Schools reopen in January, May, and September.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {months.map(([value, label]) => (
            <label key={value} className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-3 text-sm">
              <input type="checkbox" name="activeMonths" value={value} defaultChecked={rule.activeMonths.includes(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={rule.enabled} />
          Rule is on
        </label>
        <button type="submit" className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-primary">
          {submitLabel}
        </button>
        {rule.id ? (
          <button type="button" onClick={onRemove} className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium">
            Remove
          </button>
        ) : null}
        {saved ? <p className="text-sm">Saved. The next scoring pass uses this rule.</p> : null}
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

function NumberField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} defaultValue={defaultValue} inputMode="numeric" className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-3" />
    </label>
  );
}
