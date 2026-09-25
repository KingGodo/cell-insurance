import Link from "next/link";
import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { money } from "@/lib/format";
import { ensureRetentionReady } from "@/lib/retention-ready";

type Deployment = {
  id: string;
  title: string;
  reason: string;
  cost: number;
  channels: string[];
  valueScore: number;
  riskScore: number;
  customer: { id: string; customerCode: string; firstName: string; lastName: string; location: string };
  plan: { name: string; offer: string } | null;
  rule: { name: string } | null;
};

const channelLabel: Record<string, string> = {
  SMS: "SMS",
  EMAIL: "Email",
  SOCIALS: "Socials",
  MARKETING: "Marketing team",
  CUSTOMER_SERVICE: "Customer service",
  PORTAL: "Customer portal",
};

export default async function RetentionDeployedPage() {
  let deployed: Deployment[];
  try {
    await ensureRetentionReady();
    const payload = await api<{ data: Deployment[] }>("/retentions/deployed");
    deployed = payload.data;
  } catch (error) {
    return <Offline error={error} />;
  }

  const spend = deployed.reduce((sum, plan) => sum + Number(plan.cost), 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Deployed</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Report of customers the system placed on a plan after a rule matched their value and risk. {deployed.length} open. Combined cost {money(spend)}.
        </p>
      </header>
      {deployed.length === 0 ? (
        <p className="rounded-2xl bg-accent px-4 py-6 text-sm">No plan has been deployed. A customer has to meet the figures and the other rules first.</p>
      ) : (
        <ul className="space-y-3">
          {deployed.map((plan) => {
            const high = Number(plan.cost) >= 400;
            return (
              <li key={plan.id} className="rounded-2xl border border-border bg-card px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      <Link href={`/customers/${plan.customer.id}`} className="underline decoration-primary decoration-2 underline-offset-4">
                        {plan.customer.firstName} {plan.customer.lastName}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-foreground/75">
                      {plan.customer.customerCode} · {plan.customer.location} · {plan.title}
                    </p>
                  </div>
                  <p className={`rounded-full px-2.5 py-1 text-xs font-medium ${high ? "bg-foreground text-primary" : "bg-accent text-foreground"}`}>
                    Value {plan.valueScore} · Risk {plan.riskScore} · {money(Number(plan.cost))}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{plan.reason}</p>
                {plan.plan?.offer ? <p className="mt-2 text-sm font-medium">{plan.plan.offer}</p> : null}
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {plan.channels.map((channel) => (
                    <li key={channel} className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-foreground">
                      {channelLabel[channel] ?? channel}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
