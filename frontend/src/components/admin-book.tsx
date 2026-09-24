import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { labelize, money, when } from "@/lib/format";

type Profile = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  engagement: string;
  preferredChannel: string;
  customerSince: string;
  lastInteractionAt: string | null;
  profile: {
    productsHeld: string[];
    policyCount: number;
    claimCount: number;
    claimFrequency: number;
    averageClaimValue: number;
    medicalClaimCount: number;
    healthcareVisitCount: number;
    pharmacyTransactionCount: number;
    digitalInteractionCount: number;
    supportInteractionCount: number;
    riskScore: number;
    valueScore: number;
    riskBand: string;
    valueBand: string;
    paymentStanding: string;
    nextRenewalDate: string | null;
  } | null;
  segments: Array<{ kind: string; label: string }>;
  retentions: Array<{ title: string; reason: string; action: string }>;
};

type Overview = {
  data: {
    customers: number;
    leaving: number;
    watch: number;
    valueAtRisk: number;
    openRetentions: number;
    profiles: Profile[];
    segments: Array<{ kind: string; label: string; count: number }>;
  };
};

const segmentOrder = ["RISK", "VALUE", "PRODUCT", "ENGAGEMENT", "CHANNEL"];

function riskClass(band: string) {
  if (band === "LEAVING") return "bg-foreground text-primary";
  if (band === "WATCH") return "border border-border bg-white";
  return "bg-secondary text-muted-foreground";
}

async function loadBook() {
  try {
    return { overview: await api<Overview>("/analytics/overview"), error: null };
  } catch (error) {
    return { overview: null, error };
  }
}

export async function AdminBook({ section }: { section: "book" | "profiles" | "segments" | "retentions" }) {
  const { overview, error } = await loadBook();
  if (!overview) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }

  const { data } = overview;
  const steady = data.customers - data.leaving - data.watch;
  const plans = data.profiles.filter((person) => person.retentions.length > 0);
  const titles = {
    book: "Admin book",
    profiles: "Profiles",
    segments: "Segments",
    retentions: "Retention plans",
  };
  const notes = {
    book: `${data.customers} profiles scored from the insurance, medical aid, and healthcare records.`,
    profiles: "Leaving first, then watch, then steady. Open a name for the full record.",
    segments: "Risk, value, product, engagement, and channel.",
    retentions: `${plans.length} open. Each plan names why they might leave and how to reach them.`,
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{titles[section]}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{notes[section]}</p>
      </header>

      {section === "book" ? (
        <section className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Profiles", value: data.customers, note: "Every customer on the book" },
            { label: "Leaving", value: data.leaving, note: "Would go without a signal" },
            { label: "Watch", value: data.watch, note: "Drifting, still reachable" },
            { label: "Steady", value: steady, note: "No open retention" },
            { label: "Value at risk", value: data.valueAtRisk, note: "Core and high value" },
            { label: "Retention plans", value: data.openRetentions, note: "Saves already opened" },
          ].map((stat) => (
            <article key={stat.label} className="bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.note}</p>
            </article>
          ))}
        </section>
      ) : null}

      {section === "segments" ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {segmentOrder.map((kind) => (
            <article key={kind} className="overflow-hidden rounded-2xl border border-border bg-card">
              <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">{labelize(kind)}</h2>
              <ul className="divide-y divide-border">
                {data.segments
                  .filter((item) => item.kind === kind)
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                      <span className="truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{item.count}</span>
                    </li>
                  ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {section === "retentions" ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {plans.map((person) => {
              const plan = person.retentions[0];
              const record = person.profile;
              return (
                <li key={person.id} className="relative grid gap-2 px-4 py-3 hover:bg-secondary lg:grid-cols-[16rem_1fr]">
                  <Link href={`/customers/${person.id}`} className="absolute inset-0" aria-label={`Open ${person.firstName} ${person.lastName}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.customerCode} · {record ? labelize(record.valueBand) : "—"} · {record?.valueScore}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{plan.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.reason}</p>
                    <p className="mt-1 text-xs leading-relaxed">{plan.action}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {section === "profiles" ? (
        <ul className="space-y-3">
          {data.profiles.map((person) => {
            const record = person.profile;
            const plan = person.retentions[0];
            return (
              <li key={person.id} className="relative overflow-hidden rounded-2xl border border-border bg-card hover:bg-secondary/40">
                <Link href={`/customers/${person.id}`} className="absolute inset-0" aria-label={`Open ${person.firstName} ${person.lastName}`} />
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {person.customerCode} · {person.location} · since {when(person.customerSince)} · last contact {when(person.lastInteractionAt)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {person.email} · {person.phone}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${riskClass(record?.riskBand ?? "")}`}>
                      {record ? `${labelize(record.riskBand)} ${record.riskScore}` : "No score"}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                      {record ? `${labelize(record.valueBand)} ${record.valueScore}` : "No value"}
                    </span>
                  </div>
                </div>
                <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Holds", record?.productsHeld.join(", ") || "—"],
                    ["Segments", person.segments.map((item) => item.label).join(" · ") || "—"],
                    ["Relationship", record ? `${record.policyCount} policies · ${record.claimCount} claims · avg ${money(record.averageClaimValue)}` : "—"],
                    ["Care", record ? `${record.medicalClaimCount} medical · ${record.healthcareVisitCount} visits · ${record.pharmacyTransactionCount} pharmacy` : "—"],
                    ["Contact pattern", `${labelize(person.engagement)} · ${labelize(person.preferredChannel)} · ${record?.digitalInteractionCount ?? 0} digital · ${record?.supportInteractionCount ?? 0} support`],
                    ["Payment", record ? `${labelize(record.paymentStanding)} · renewal ${when(record.nextRenewalDate)}` : "—"],
                    ["Claim rhythm", record ? `${record.claimFrequency} a year` : "—"],
                    ["Retention plan", plan ? plan.title : "None. The relationship is steady."],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-card px-4 py-3">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
                    </div>
                  ))}
                </dl>
                {plan ? (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">{plan.reason}</p>
                    <p className="mt-1 text-sm">{plan.action}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
