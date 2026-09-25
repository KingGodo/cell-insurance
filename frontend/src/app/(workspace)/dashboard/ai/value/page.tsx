import Link from "next/link";
import { api } from "@/lib/api";
import { MiniBars } from "@/components/mini-bars";
import { Offline } from "@/components/offline";
import { valueTerm } from "@/lib/format";

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  customerCode: string;
  valueScore: number;
  valueBand: string;
  valueReasons: string[];
};

export default async function ValueFindingsPage() {
  let rows: Row[];
  try {
    const payload = await api<{ data: Row[] }>("/analytics/insights");
    rows = payload.data;
  } catch (error) {
    return <Offline error={error} />;
  }

  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.valueScore, 0) / rows.length) : 0;
  const high = rows.filter((row) => row.valueBand === "HIGH");
  const medium = rows.filter((row) => row.valueBand === "CORE");
  const low = rows.filter((row) => row.valueBand === "LOWER");
  const multiLine = rows.filter((row) => row.valueReasons.some((reason) => reason.includes("active lines"))).length;
  const affinity = rows.filter((row) => row.valueReasons.some((reason) => reason.startsWith("Linked to"))).length;
  const richPremium = rows.filter((row) => row.valueReasons.some((reason) => reason.includes("Annual premium") && /2\d{3}|[3-9]\d{3}/.test(reason))).length;
  const leaders = [...rows].sort((a, b) => b.valueScore - a.valueScore).slice(0, 6);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Value</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          What the value model found across the book: lines held, claims against premium, corporate linkage, tenure, and annual premium.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Average value" value={average} note="Out of 100" surface="bg-foreground text-primary" />
        <Card label="High value" value={high.length} note="Score 70 or more" surface="bg-primary text-foreground" />
        <Card label="Medium value" value={medium.length} note="Score 40 to 69" surface="bg-accent text-foreground" />
        <Card label="Low value" value={low.length} note="Score under 40" surface="bg-[oklch(0.32_0.05_55)] text-primary" />
      </section>
      <section className="rounded-2xl border border-border bg-card px-4 py-4">
        <MiniBars
          title="Findings"
          rows={[
            { label: "Three or more active lines", value: multiLine },
            { label: "Linked to a corporate affinity group", value: affinity },
            { label: "Annual premium of 2,000 or more", value: richPremium },
          ]}
        />
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Highest value</h2>
        </div>
        <ul className="divide-y divide-border">
          {leaders.map((row) => (
            <li key={row.id} className="relative flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/customers/${row.id}`} className="absolute inset-0" aria-label={`Open ${row.firstName} ${row.lastName}`} />
              <div>
                <p className="text-sm font-semibold">{row.firstName} {row.lastName}</p>
                <p className="text-sm text-foreground/75">{row.customerCode}</p>
              </div>
              <p className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-foreground">{valueTerm(row.valueBand)} {row.valueScore}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ label, value, note, surface }: { label: string; value: number; note: string; surface: string }) {
  return (
    <article className={`rounded-2xl px-4 py-4 ${surface}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm opacity-90">{note}</p>
    </article>
  );
}
