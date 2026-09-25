import Link from "next/link";
import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { riskTerm, valueTerm } from "@/lib/format";
import { ScoreBar } from "@/components/score-meter";

type Insight = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  location: string;
  riskScore: number;
  valueScore: number;
  riskBand: string;
  valueBand: string;
  riskReasons: string[];
  valueReasons: string[];
  riskModelVersion: string;
  valueModelVersion: string;
};

export default async function InsightsPage() {
  let insights: Insight[];
  try {
    const payload = await api<{ data: Insight[] }>("/analytics/insights");
    insights = payload.data;
  } catch (error) {
    return <Offline error={error} />;
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Each card is the risk model and the value model for one customer. Highest risk is first.
        </p>
      </header>
      <ul className="grid gap-3 lg:grid-cols-2">
        {insights.map((person) => (
          <li key={person.id} className="relative rounded-2xl border border-border bg-card p-4">
            <Link href={`/customers/${person.id}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={`Open ${person.firstName} ${person.lastName}`} />
            <div className="pointer-events-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {person.firstName} {person.lastName}
                </p>
                <p className="text-sm text-foreground/75">
                  {person.customerCode} · {person.location}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-foreground px-3 py-3 text-primary">
                <p className="text-xs font-medium">Risk</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{person.riskScore}</p>
                <p className="text-sm">{riskTerm(person.riskBand)}</p>
                <ScoreBar score={person.riskScore} fill="bg-primary" track="bg-primary/25" />
              </div>
              <div className="rounded-xl bg-primary px-3 py-3 text-foreground">
                <p className="text-xs font-medium">Value</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{person.valueScore}</p>
                <p className="text-sm">{valueTerm(person.valueBand)}</p>
                <ScoreBar score={person.valueScore} fill="bg-foreground" track="bg-foreground/15" />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Risk</p>
                <ul className="mt-1 space-y-1">
                  {(person.riskReasons.length > 0 ? person.riskReasons : ["No extra risk drivers."]).map((reason) => (
                    <li key={reason} className="text-sm leading-relaxed text-foreground">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold">Value</p>
                <ul className="mt-1 space-y-1">
                  {person.valueReasons.map((reason) => (
                    <li key={reason} className="text-sm leading-relaxed text-foreground">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs text-foreground/60">
              {person.riskModelVersion} · {person.valueModelVersion}
            </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
