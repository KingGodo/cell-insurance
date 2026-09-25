import Link from "next/link";
import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { AskPanel } from "@/app/(workspace)/account/ask-panel";
import { type CustomerRecordData } from "@/components/customer-record";
import { labelize, money, when } from "@/lib/format";

type Me = { data: { customerId: string | null } };

export async function CustomerOverview() {
  try {
    const me = await api<Me>("/auth/me");
    if (!me.data.customerId) return null;

    const profile = await api<{ data: CustomerRecordData }>(`/customers/${me.data.customerId}/profile`);
    const data = profile.data;
    const record = data.profile;
    const renewal = data.policies[0] ? when(data.policies[0].renewalDate) : "No renewal on file";
    const promotions = (data.retentions ?? []).filter((item) => item.plan?.offer);
    const figures = [
      { label: "Policies", value: String(record?.policyCount ?? data.policies.length), href: "/account/cover" },
      { label: "Medical aid", value: String(data.memberships.length), href: "/account/medical" },
      { label: "Claims", value: String(record?.claimCount ?? data.recentClaims.length), href: "/claims" },
      { label: "Next renewal", value: record ? when(record.nextRenewalDate) : renewal, href: "/account/cover" },
    ];

    return (
      <div className="space-y-4">
        <header>
          <p className="text-xs text-muted-foreground">{data.customer.customerCode}</p>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.customer.name} · {data.customer.location} · since {when(data.customer.customerSince)}
          </p>
        </header>

        {promotions.length > 0 ? (
          <Link href="/account/promotions" className="flex flex-wrap items-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-background hover:opacity-95">
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">Promotions</span>
            {promotions.map((item) => (
              <span key={item.plan?.name ?? item.title} className="rounded-full bg-background/10 px-2.5 py-1 text-xs">
                {item.plan?.name ?? item.title}
              </span>
            ))}
          </Link>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {figures.map((figure) => (
            <Link key={figure.label} href={figure.href} className="rounded-2xl border border-border bg-card px-4 py-3 hover:bg-secondary/40">
              <p className="text-xs text-muted-foreground">{figure.label}</p>
              <p className="mt-1 text-sm font-semibold">{figure.value}</p>
            </Link>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold">Insurance</h2>
              <Link href="/account/cover" className="text-xs text-muted-foreground hover:text-foreground">
                Open
              </Link>
            </div>
            {data.policies.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No policies on file.</p> : null}
            <ul className="divide-y divide-border">
              {data.policies.map((policy) => (
                <li key={policy.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{policy.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {policy.policyNumber} · {labelize(policy.status)} · {money(policy.premium)} / month · renews {when(policy.renewalDate)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold">Claims</h2>
              <Link href="/claims" className="text-xs text-muted-foreground hover:text-foreground">
                Open
              </Link>
            </div>
            {data.recentClaims.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No claims on file.</p> : null}
            <ul className="divide-y divide-border">
              {data.recentClaims.slice(0, 4).map((claim) => (
                <li key={claim.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">
                    <Link href={`/claims/${claim.id}`} className="underline-offset-4 hover:underline">
                      {claim.claimNumber}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labelize(claim.type)} · {labelize(claim.status)} · {money(claim.amount)} · {when(claim.submittedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <AskPanel
          policies={data.policies.map((policy) => `${policy.productName} (${policy.policyNumber}), renews ${when(policy.renewalDate)}`)}
          claims={data.recentClaims.map((claim) => `${claim.claimNumber} is ${labelize(claim.status)}`)}
          renewal={renewal}
        />
      </div>
    );
  } catch (error) {
    return <Offline error={error} />;
  }
}
