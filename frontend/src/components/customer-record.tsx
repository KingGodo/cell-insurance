import type { ReactNode } from "react";
import Link from "next/link";
import { SignalBadge } from "@/components/signal-badge";
import { labelize, money, riskTerm, valueTerm, when } from "@/lib/format";

const sections = [
  { href: "#profile", label: "Profile" },
  { href: "#cover", label: "Insurance" },
  { href: "#medical", label: "Medical aid" },
  { href: "#care", label: "Healthcare" },
  { href: "#claims", label: "Claims" },
  { href: "#journey", label: "Journey" },
  { href: "#contact", label: "Contact" },
  { href: "#next", label: "Next step" },
];

export type CustomerRecordData = {
  customer: {
    id: string;
    customerCode: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    customerSince: string;
    engagement: string;
    preferredChannel: string;
    lastInteractionAt: string | null;
  };
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
    paymentStanding: string;
    nextRenewalDate: string | null;
    riskScore?: number;
    valueScore?: number;
    riskBand?: string;
    valueBand?: string;
  } | null;
  segments: Array<{ kind: string; label: string }>;
  retentions?: Array<{
    title: string;
    reason: string;
    action: string;
    cost?: number | null;
    channels?: string[];
    valueScore?: number;
    riskScore?: number;
    plan?: { name: string; summary: string; offer: string } | null;
  }>;
  features?: {
    modelVersion: string;
    valueModelVersion?: string;
    prediction: number;
    valuePrediction?: number;
    inputs: {
      claimFrequency: number;
      claimSentiment: number;
      premiumShock: number;
      seasonalPressure: number;
      diaspora: boolean;
      payerLocation: string;
      paymentLatenessDays: number;
      paymentJitterDays: number;
      dominantChannel: string;
      employer: string | null;
    };
    valueInputs?: {
      lineCount: number;
      claimToPremiumRatio: number;
      affinityGroup: string | null;
      tenureYears: number;
      renewed: boolean;
      annualizedPremium: number;
    };
  } | null;
  policies: Array<{
    id: string;
    policyNumber: string;
    productName: string;
    status: string;
    premium: number;
    coverAmount: number;
    startDate: string;
    renewalDate: string;
  }>;
  memberships: Array<{
    id: string;
    memberNumber: string;
    planName: string;
    status: string;
    monthlyContribution: number;
    startDate: string;
    dependants: Array<{ id: string; firstName: string; lastName: string; relationship: string; dateOfBirth: string }>;
  }>;
  insights: Array<{ id: string; title: string; detail: string; severity: string }>;
  recommendations: Array<{ id: string; title: string; detail: string; action: string; status: string }>;
  recentClaims: Array<{
    id: string;
    claimNumber: string;
    type: string;
    status: string;
    amount: number;
    description: string;
    reviewSignal: string;
    submittedAt: string;
    provider: { name: string } | null;
    documents: Array<{ id: string; documentType: string; fileName: string; status: string }>;
  }>;
  recentVisits: Array<{
    id: string;
    facilityName: string;
    visitType: string;
    visitedAt: string;
    provider: { name: string } | null;
  }>;
  recentPharmacy: Array<{ id: string; pharmacyName: string; description: string; amount: number; transactedAt: string }>;
  recentInteractions: Array<{ id: string; channel: string; subject: string; summary: string; occurredAt: string }>;
};

export type JourneyEvent = { id: string; title: string; category: string; occurredAt: string };

function Empty({ children }: { children: string }) {
  return <p className="px-4 py-3 text-sm text-muted-foreground">{children}</p>;
}

function Panel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function CustomerRecord({
  data,
  journey,
  showMessages = false,
  showScores = false,
  sectionLinks,
  section,
}: {
  data: CustomerRecordData;
  journey: JourneyEvent[];
  showMessages?: boolean;
  showScores?: boolean;
  sectionLinks?: Array<{ href: string; label: string }>;
  section?: "profile" | "cover" | "medical" | "care" | "claims" | "journey" | "contact" | "next";
}) {
  const record = data.profile;
  const customer = data.customer;
  const links = sectionLinks ?? (showMessages ? [...sections, { href: "#messages", label: "Messages" }] : sections);
  const show = (id: string) => !section || section === id;
  const visibleSegments = showScores ? data.segments : data.segments.filter((item) => item.kind !== "RISK" && item.kind !== "VALUE");
  const retention = data.retentions?.[0];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{customer.customerCode}</p>
          <h1 className="text-xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.location} · since {when(customer.customerSince)} · last contact {when(customer.lastInteractionAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {visibleSegments.map((segment) => (
            <span key={segment.kind} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
              {segment.label}
            </span>
          ))}
        </div>
      </header>

      {!section && showScores && data.features?.valueInputs ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">What the value model used</h2>
            <p className="mt-1 text-xs text-muted-foreground">Calculated from the lines they hold, claims against premium, corporate linkage, tenure, and annual premium. {data.features.valueModelVersion}</p>
          </div>
          <dl className="grid gap-px bg-border sm:grid-cols-2">
            {[
              ["Multi-line density", `${data.features.valueInputs.lineCount} active lines`],
              ["Claim to premium", `${Math.round(data.features.valueInputs.claimToPremiumRatio * 100)}% of annual premium`],
              ["Affinity group", data.features.valueInputs.affinityGroup ?? "No corporate link"],
              ["Tenure and loyalty", `${data.features.valueInputs.tenureYears} years${data.features.valueInputs.renewed ? " · renewed" : ""}`],
              ["Annualized premium", money(data.features.valueInputs.annualizedPremium)],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-4 py-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {!section && showScores && data.features?.inputs ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">What the risk model used</h2>
            <p className="mt-1 text-xs text-muted-foreground">Calculated from claims, contact sentiment, the renewal premium, season, and how the premium was paid. {data.features.modelVersion}</p>
          </div>
          <dl className="grid gap-px bg-border sm:grid-cols-2">
            {[
              ["Claims experience", `${data.features.inputs.claimFrequency} insurance claims a year`],
              ["Sentiment", data.features.inputs.claimSentiment > 0.2 ? "Negative" : data.features.inputs.claimSentiment < 0 ? "Positive" : "Neutral"],
              ["Premium shock", `${Math.round(data.features.inputs.premiumShock * 100)}% versus the previous premium`],
              ["Seasonal pressure", `${Math.round(data.features.inputs.seasonalPressure * 100)}% of claims and dues fall in Nov–Feb`],
              ["Payer location", data.features.inputs.diaspora ? `Diaspora · ${data.features.inputs.payerLocation}` : data.features.inputs.payerLocation],
              ["Payment timing", `${data.features.inputs.paymentLatenessDays} days late · jitter ${data.features.inputs.paymentJitterDays} days`],
              ["Payment channel", labelize(data.features.inputs.dominantChannel)],
              ["Employer", data.features.inputs.employer ?? "None on file"],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-4 py-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {!section && showScores && record?.riskBand ? (
        <section className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          <article className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Risk</p>
            <p className="mt-1 text-sm font-semibold">{riskTerm(record.riskBand)} · {record.riskScore}</p>
          </article>
          <article className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="mt-1 text-sm font-semibold">{record.valueBand ? valueTerm(record.valueBand) : "—"} · {record.valueScore}</p>
          </article>
          <article className="bg-card px-4 py-3">
            <p className="text-xs font-medium text-foreground/70">Retention plan</p>
            <p className="mt-1 text-sm font-semibold">{retention?.title ?? "None open"}</p>
            {retention?.valueScore != null ? <p className="mt-1 text-sm">Value {retention.valueScore} · Risk {retention.riskScore}</p> : null}
            {retention?.cost != null ? <p className="mt-1 text-sm">Cost {money(Number(retention.cost))}</p> : null}
            {retention?.channels && retention.channels.length > 0 ? <p className="mt-1 text-sm">{retention.channels.map((channel) => channel.replace(/_/g, " ").toLowerCase()).join(" · ")}</p> : null}
            {retention ? <p className="mt-1 text-sm leading-relaxed text-foreground/80">{retention.reason}</p> : null}
          </article>
        </section>
      ) : null}

      {!section ? (
        <nav className="flex flex-wrap gap-1" aria-label="Profile sections">
          {links.map((item) => (
            <a key={item.href} href={item.href} className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      {show("profile") ? (
      <Panel id="profile" title="Profile">
        <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Email", customer.email],
            ["Phone", customer.phone],
            ["Engagement", labelize(customer.engagement)],
            ["Channel", labelize(customer.preferredChannel)],
            ["Payment", record ? labelize(record.paymentStanding) : "—"],
            ["Products", record?.productsHeld.join(", ") || "—"],
            ["Claim frequency", record ? String(record.claimFrequency) : "—"],
            ["Average claim", record ? money(record.averageClaimValue) : "—"],
            ["Policies", record ? String(record.policyCount) : "—"],
            ["Claims", record ? String(record.claimCount) : "—"],
            ["Medical claims", record ? String(record.medicalClaimCount) : "—"],
            ["Visits", record ? String(record.healthcareVisitCount) : "—"],
            ["Pharmacy", record ? String(record.pharmacyTransactionCount) : "—"],
            ["Digital contacts", record ? String(record.digitalInteractionCount) : "—"],
            ["Support contacts", record ? String(record.supportInteractionCount) : "—"],
            ["Renewal", record ? when(record.nextRenewalDate) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-4 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      ) : null}

      {show("cover") ? (
      <Panel id="cover" title="Insurance">
        {data.policies.length === 0 ? <Empty>No policies on file.</Empty> : null}
        <ul className="divide-y divide-border">
          {data.policies.map((policy) => (
            <li key={policy.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[1.4fr_1fr_1fr]">
              <span>
                <span className="block font-medium">{policy.productName}</span>
                <span className="text-xs text-muted-foreground">{policy.policyNumber}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {labelize(policy.status)} · {money(policy.premium)} / month
                <br />
                Cover {money(policy.coverAmount)}
              </span>
              <span className="text-xs text-muted-foreground">
                From {when(policy.startDate)}
                <br />
                Renews {when(policy.renewalDate)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      ) : null}

      {show("medical") ? (
      <Panel id="medical" title="Medical aid">
        {data.memberships.length === 0 ? <Empty>No medical aid on file.</Empty> : null}
        <ul className="divide-y divide-border">
          {data.memberships.map((membership) => (
            <li key={membership.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {membership.planName} · {membership.memberNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {labelize(membership.status)} · {money(membership.monthlyContribution)} / month · from {when(membership.startDate)}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {membership.dependants.length === 0 ? <li>No dependants.</li> : null}
                {membership.dependants.map((person) => (
                  <li key={person.id}>
                    {person.firstName} {person.lastName} · {person.relationship} · born {when(person.dateOfBirth)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Panel>
      ) : null}

      {show("care") ? (
      <Panel id="care" title="Healthcare">
        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div>
            <p className="px-4 pt-3 text-xs text-muted-foreground">Visits · {record?.healthcareVisitCount ?? data.recentVisits.length}</p>
            {data.recentVisits.length === 0 ? <Empty>No visits on file.</Empty> : null}
            <ul className="divide-y divide-border">
              {data.recentVisits.map((visit) => (
                <li key={visit.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{visit.facilityName}</p>
                  <p className="text-xs text-muted-foreground">
                    {visit.visitType} · {when(visit.visitedAt)}
                    {visit.provider ? ` · ${visit.provider.name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="px-4 pt-3 text-xs text-muted-foreground">Pharmacy · {record?.pharmacyTransactionCount ?? data.recentPharmacy.length}</p>
            {data.recentPharmacy.length === 0 ? <Empty>No pharmacy activity on file.</Empty> : null}
            <ul className="divide-y divide-border">
              {data.recentPharmacy.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="block font-medium">{item.pharmacyName}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description} · {when(item.transactedAt)}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums">{money(item.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
      ) : null}

      {show("claims") ? (
      <Panel id="claims" title="Claims">
        {data.recentClaims.length === 0 ? <Empty>No claims on file.</Empty> : null}
        <ul className="divide-y divide-border">
          {data.recentClaims.map((claim) => (
            <li key={claim.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/claims/${claim.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                  {claim.claimNumber}
                </Link>
                <SignalBadge signal={claim.reviewSignal} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {labelize(claim.type)} · {labelize(claim.status)} · {money(claim.amount)} · {when(claim.submittedAt)}
                {claim.provider ? ` · ${claim.provider.name}` : ""}
              </p>
              <p className="mt-1 text-sm">{claim.description}</p>
              {claim.documents.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {claim.documents.map((document) => (
                    <li key={document.id}>
                      {document.documentType} · {document.fileName} · {labelize(document.status)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      ) : null}

      {show("journey") ? (
      <Panel id="journey" title="Journey">
        {journey.length === 0 ? <Empty>No events on file.</Empty> : null}
        <ol className="divide-y divide-border">
          {journey.map((event) => (
            <li key={event.id} className="px-4 py-3">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {when(event.occurredAt)} · {labelize(event.category)}
              </p>
            </li>
          ))}
        </ol>
      </Panel>
      ) : null}

      {show("contact") ? (
      <Panel id="contact" title="Contact">
        <p className="px-4 pt-3 text-xs text-muted-foreground">
          {record?.digitalInteractionCount ?? 0} digital · {record?.supportInteractionCount ?? 0} support
        </p>
        {data.recentInteractions.length === 0 ? <Empty>No conversations on file.</Empty> : null}
        <ul className="divide-y divide-border">
          {data.recentInteractions.map((item) => (
            <li key={item.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{item.subject}</p>
              <p className="text-xs text-muted-foreground">
                {labelize(item.channel)} · {when(item.occurredAt)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            </li>
          ))}
        </ul>
      </Panel>
      ) : null}

      {show("next") ? (
      <Panel id="next" title="Next step">
        {data.insights.length === 0 && data.recommendations.length === 0 ? <Empty>No open insight or recommendation.</Empty> : null}
        <ul className="divide-y divide-border">
          {data.recommendations.map((item) => (
            <li key={item.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
              <p className="mt-1">{item.action}</p>
            </li>
          ))}
          {data.insights.map((insight) => (
            <li key={insight.id} className="px-4 py-3 text-sm">
              <p className="text-xs text-muted-foreground">{insight.severity === "WARNING" ? "Risk" : "Note"}</p>
              <p className="font-medium">{insight.title}</p>
              <p className="text-xs text-muted-foreground">{insight.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>
      ) : null}
    </div>
  );
}
