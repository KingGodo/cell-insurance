import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { labelize, money, when } from "@/lib/format";

type Profile = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  location: string;
  engagement: string;
  preferredChannel: string;
  customerSince: string;
  profile: {
    productsHeld: string[];
    policyCount: number;
    claimCount: number;
    averageClaimValue: number;
    medicalClaimCount: number;
    healthcareVisitCount: number;
    pharmacyTransactionCount: number;
    digitalInteractionCount: number;
    paymentStanding: string;
    nextRenewalDate: string | null;
  } | null;
  segments: Array<{ kind: string; label: string }>;
  insights: Array<{ title: string; detail: string; severity: string }>;
  recommendations: Array<{ title: string; action: string }>;
};

type Overview = {
  data: {
    customers: number;
    activePolicies: number;
    claimsToday: number;
    requiresReview: number;
    engagement: {
      highlyEngaged: number;
      active: number;
      lowEngagement: number;
      newCustomer: number;
      total: number;
    };
    claimIntelligence: { normal: number; reviewRequired: number; highPriority: number };
    alerts: { claimsRequiringReview: number; upcomingRenewals: number; missingClaimDocuments: number };
    profiles: Profile[];
    segments: Array<{ kind: string; label: string; count: number }>;
    locations: Array<{ label: string; count: number }>;
    payment: { current: number; overdue: number };
  };
};

function segment(profile: Profile, kind: string) {
  return profile.segments.find((item) => item.kind === kind)?.label;
}

export default async function DashboardPage() {
  let overview: Overview;
  try {
    overview = await api<Overview>("/analytics/overview");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for Cell teams.", 403)} />;
    }
    return <Offline error={error} />;
  }

  const { data } = overview;
  const stats = [
    { label: "Profiles", value: data.customers, note: "Customers on the book" },
    { label: "Active policies", value: data.activePolicies, note: "Currently in force" },
    { label: "Needs a person", value: data.requiresReview, note: "Open claims to review" },
    { label: "Renewals", value: data.alerts.upcomingRenewals, note: "Inside the next 45 days" },
  ];
  const books = [
    { title: "Product profile", kind: "PRODUCT" },
    { title: "Engagement", kind: "ENGAGEMENT" },
    { title: "Channel", kind: "CHANNEL" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Customer profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.profiles.length} profiles in view · {data.payment.current} current · {data.payment.overdue} overdue ·{" "}
            {data.claimIntelligence.highPriority} high-priority claims
          </p>
        </div>
        <Link href="/customers" className="text-sm font-medium underline-offset-4 hover:underline">
          All customers
        </Link>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1.1fr] gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground max-lg:hidden">
          <p>Customer</p>
          <p>What they hold</p>
          <p>Relationship</p>
          <p>Next step</p>
        </div>
        <ul className="divide-y divide-border">
          {data.profiles.map((person) => {
            const record = person.profile;
            const insight = person.insights[0];
            const next = person.recommendations[0];
            return (
              <li key={person.id}>
                <Link
                  href={`/customers/${person.id}`}
                  className="grid gap-3 px-4 py-3 hover:bg-secondary lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {person.firstName} {person.lastName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.customerCode} · {person.location} · since {when(person.customerSince)}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        {labelize(person.engagement)}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        {labelize(person.preferredChannel)}
                      </span>
                      {record ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {labelize(record.paymentStanding)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block">{record?.productsHeld.join(", ") || "No products on file"}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {[segment(person, "PRODUCT"), segment(person, "ENGAGEMENT"), segment(person, "CHANNEL")]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {record ? (
                      <>
                        {record.policyCount} policies · {record.claimCount} claims · avg {money(record.averageClaimValue)}
                        <br />
                        {record.medicalClaimCount} medical · {record.healthcareVisitCount} visits · {record.pharmacyTransactionCount} pharmacy
                        <br />
                        Renewal {when(record.nextRenewalDate)} · {record.digitalInteractionCount} digital contacts
                      </>
                    ) : (
                      "Profile not built"
                    )}
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium">{next?.title ?? insight?.title ?? "No open action"}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{next?.action ?? insight?.detail ?? "Open the profile"}</span>
                    {insight ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {insight.severity === "WARNING" ? "Watch" : insight.severity === "POSITIVE" ? "Note" : "Insight"} · {insight.title}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        {books.map((book) => (
          <article key={book.kind} className="overflow-hidden rounded-2xl border border-border bg-card">
            <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">{book.title}</h2>
            <ul className="divide-y divide-border">
              {data.segments
                .filter((item) => item.kind === book.kind)
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
        <article className="overflow-hidden rounded-2xl border border-border bg-card">
          <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">Where they are</h2>
          <ul className="divide-y divide-border">
            {data.locations.map((place) => (
              <li key={place.label} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="truncate">{place.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{place.count}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
