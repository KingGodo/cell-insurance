import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { RiskChip, ValueChip } from "@/components/score-meter";
import { labelize, money, valueTerm, when } from "@/lib/format";

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

async function loadBook() {
  try {
    return { overview: await api<Overview>("/analytics/overview"), error: null };
  } catch (error) {
    return { overview: null, error };
  }
}

export async function AdminBook({ section }: { section: "profiles" | "retentions" }) {
  const { overview, error } = await loadBook();
  if (!overview) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }

  const { data } = overview;
  const plans = data.profiles.filter((person) => person.retentions.length > 0);
  const titles = {
    profiles: "Profiles",
    retentions: "Retention plans",
  };
  const notes = {
    profiles: "Open a name for the full record and history.",
    retentions: `${plans.length} open. Each plan names why they might leave and how to reach them.`,
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{titles[section]}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{notes[section]}</p>
      </header>

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
                    <p className="truncate text-sm text-foreground/75">
                      {person.customerCode} · {record ? valueTerm(record.valueBand) : "—"} · {record?.valueScore}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{plan.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">{plan.reason}</p>
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
                    <p className="mt-0.5 text-sm text-foreground/75">
                      {person.customerCode} · {person.location} · since {when(person.customerSince)} · last contact {when(person.lastInteractionAt)}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground/75">
                      {person.email} · {person.phone}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {record ? <RiskChip band={record.riskBand} score={record.riskScore} /> : null}
                    {record ? <ValueChip band={record.valueBand} score={record.valueScore} /> : null}
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
                    ["Retention plan", plan ? plan.title : "None. The risk is low."],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-card px-4 py-3">
                      <dt className="text-xs font-medium text-foreground/70">{label}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
                {plan ? (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-sm leading-relaxed text-foreground/80">{plan.reason}</p>
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
