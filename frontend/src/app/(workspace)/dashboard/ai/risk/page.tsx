import Link from "next/link";
import { api } from "@/lib/api";
import { MiniBars } from "@/components/mini-bars";
import { Offline } from "@/components/offline";
import { riskColor } from "@/lib/matrix";
import { RiskChip } from "@/components/score-meter";

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  customerCode: string;
  riskScore: number;
  riskBand: string;
  riskReasons: string[];
};

const drivers = [
  { label: "Renewal premium shock", match: "renewal premium" },
  { label: "Late payments", match: "days late" },
  { label: "Diaspora payer", match: "paid from" },
  { label: "Negative claim sentiment", match: "sentiment" },
  { label: "Seasonal pressure", match: "rainy" },
  { label: "Uneven payment timing", match: "jumps around" },
  { label: "Cash or diaspora channel", match: "payment channel" },
];

export default async function RiskOutcomesPage() {
  let rows: Row[];
  try {
    const payload = await api<{ data: Row[] }>("/analytics/insights");
    rows = payload.data;
  } catch (error) {
    return <Offline error={error} />;
  }

  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.riskScore, 0) / rows.length) : 0;
  const high = rows.filter((row) => row.riskBand === "LEAVING");
  const medium = rows.filter((row) => row.riskBand === "WATCH");
  const low = rows.filter((row) => row.riskBand === "STEADY");
  const exposed = [...rows].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Risk</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Outcomes from the risk model: who is leaving, who is drifting, and which calculations pushed the score.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Average risk" value={average} note="Out of 100" color="#121212" />
        <Card label="High risk" value={high.length} note="Close to leaving" color={riskColor.high} />
        <Card label="Medium risk" value={medium.length} note="Drifting, still reachable" color={riskColor.medium} />
        <Card label="Low risk" value={low.length} note="Steady on the book" color={riskColor.low} />
      </section>
      <section className="rounded-2xl bg-card px-4 py-4 border border-border">
        <MiniBars
          title="What moved the scores"
          rows={drivers.map((driver) => ({
            label: driver.label,
            value: rows.filter((row) => row.riskReasons.some((reason) => reason.toLowerCase().includes(driver.match))).length,
          }))}
        />
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Highest risk</h2>
        </div>
        <ul className="divide-y divide-border">
          {exposed.map((row) => (
            <li key={row.id} className="relative px-4 py-3">
              <Link href={`/customers/${row.id}`} className="absolute inset-0" aria-label={`Open ${row.firstName} ${row.lastName}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{row.firstName} {row.lastName}</p>
                  <p className="text-sm text-foreground/75">{row.customerCode}</p>
                </div>
                <RiskChip band={row.riskBand} score={row.riskScore} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{row.riskReasons.slice(0, 2).join(". ")}{row.riskReasons.length ? "." : ""}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ label, value, note, color }: { label: string; value: number; note: string; color: string }) {
  return (
    <article className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </article>
  );
}
