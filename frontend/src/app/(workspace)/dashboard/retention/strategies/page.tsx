import { api } from "@/lib/api";
import { MiniBars } from "@/components/mini-bars";
import { Offline } from "@/components/offline";
import { money } from "@/lib/format";
import { ensureRetentionReady } from "@/lib/retention-ready";

type Rule = {
  name: string;
  summary: string;
  enabled: boolean;
  valueMin: number | null;
  valueMax: number | null;
  riskMin: number | null;
  riskMax: number | null;
};

type Plan = {
  id: string;
  name: string;
  enabled: boolean;
  cost: number;
  rules: Rule[];
  _count: { deployments: number };
};

function ready(plan: Plan) {
  return plan.enabled && plan.rules.some((rule) => rule.enabled && [rule.valueMin, rule.valueMax, rule.riskMin, rule.riskMax].some((value) => value != null));
}

export default async function RetentionStrategiesPage() {
  let plans: Plan[];
  try {
    await ensureRetentionReady();
    const payload = await api<{ data: Plan[] }>("/retentions/plans");
    plans = payload.data;
  } catch (error) {
    return <Offline error={error} />;
  }

  const evaluated = plans.map((plan) => {
    const state = !plan.enabled ? "Deactivated" : ready(plan) ? "Ready" : "Needs a rule";
    return { ...plan, state, spend: plan._count.deployments * Number(plan.cost) };
  });
  const deployed = evaluated.reduce((sum, plan) => sum + plan._count.deployments, 0);
  const spend = evaluated.reduce((sum, plan) => sum + plan.spend, 0);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Strategies</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Each plan is evaluated against its rules before anyone is placed on it. {evaluated.filter((plan) => plan.state === "Ready").length} ready, {evaluated.filter((plan) => plan.state === "Needs a rule").length} waiting on a rule, {deployed} customers deployed, combined cost {money(spend)}.
        </p>
      </header>
      <section className="rounded-2xl border border-border bg-card px-4 py-4">
        <MiniBars
          wide
          title="Customers deployed by plan"
          rows={evaluated.map((plan) => ({ label: plan.name, value: plan._count.deployments }))}
        />
      </section>
      <section className="grid gap-3 lg:grid-cols-3">
        <Report title="Readiness" rows={evaluated.map((plan) => ({ label: plan.name, detail: plan.state }))} />
        <Report title="Spend" rows={evaluated.map((plan) => ({ label: plan.name, detail: money(plan.spend) }))} />
        <Report
          title="Rules in force"
          rows={evaluated.map((plan) => ({
            label: plan.name,
            detail: plan.rules.filter((rule) => rule.enabled).map((rule) => rule.name).join(", ") || "None",
          }))}
        />
      </section>
      <ul className="space-y-3">
        {evaluated.map((plan) => (
          <li key={plan.id} className="rounded-2xl border border-border bg-card px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{plan.name}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.state === "Ready" ? "bg-foreground text-primary" : "bg-accent text-foreground"}`}>
                {plan.state}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              {plan.state === "Needs a rule"
                ? "This plan has no value or risk threshold, so the system will not deploy it."
                : plan.state === "Deactivated"
                  ? "This plan is off. Open placements close on the next scoring pass."
                  : `${plan._count.deployments} customers are on it at ${money(Number(plan.cost))} each.`}
            </p>
            {plan.rules.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {plan.rules.map((rule) => (
                  <li key={rule.name} className="text-sm">
                    {rule.name}. {rule.summary}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Report({ title, rows }: { title: string; rows: Array<{ label: string; detail: string }> }) {
  return (
    <article className="rounded-2xl border border-border bg-card px-4 py-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <span>{row.label}</span>
            <span className="text-right font-medium">{row.detail}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
