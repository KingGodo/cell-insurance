import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { MiniBars } from "@/components/mini-bars";
import { Offline } from "@/components/offline";
import { SegmentPlot, type PlotPoint } from "@/components/segment-plot";
import { matrixSegments, matrixSlug, type MatrixSlug } from "@/lib/matrix";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  profile: { riskScore: number; valueScore: number; riskBand: string; valueBand: string } | null;
};

export async function AiOverview() {
  let people: Person[];
  try {
    const overview = await api<{ data: { profiles: Person[] } }>("/analytics/overview");
    people = overview.data.profiles;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }

  const scored = people.flatMap((person) => (person.profile ? [{ ...person, profile: person.profile }] : []));
  const points: PlotPoint[] = scored.map((person) => ({
    id: person.id,
    name: `${person.firstName} ${person.lastName}`,
    value: person.profile.valueScore,
    risk: person.profile.riskScore,
    slug: matrixSlug(person.profile.valueScore, person.profile.riskScore),
  }));
  const risk = {
    high: scored.filter((person) => person.profile.riskBand === "LEAVING").length,
    medium: scored.filter((person) => person.profile.riskBand === "WATCH").length,
    low: scored.filter((person) => person.profile.riskBand === "STEADY").length,
  };
  const value = {
    high: scored.filter((person) => person.profile.valueBand === "HIGH").length,
    medium: scored.filter((person) => person.profile.valueBand === "CORE").length,
    low: scored.filter((person) => person.profile.valueBand === "LOWER").length,
  };
  const segments = Object.fromEntries(
    matrixSegments.map((segment) => [segment.slug, points.filter((point) => point.slug === segment.slug).length]),
  ) as Record<MatrixSlug, number>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          {scored.length} customers scored by the risk model and the value model. The graph places each person by value and risk.
        </p>
      </header>
      <SegmentPlot points={points} />
      <section className="grid gap-3 lg:grid-cols-3">
        <Band
          title="Risk"
          href="/dashboard/ai/risk"
          rows={[
            { label: "High risk", count: risk.high },
            { label: "Medium risk", count: risk.medium },
            { label: "Low risk", count: risk.low },
          ]}
        />
        <Band
          title="Value"
          href="/dashboard/ai/value"
          rows={[
            { label: "High value", count: value.high },
            { label: "Medium value", count: value.medium },
            { label: "Low value", count: value.low },
          ]}
        />
        <Band
          title="Segments"
          href="/dashboard/segments"
          rows={matrixSegments.map((segment) => ({
            label: segment.name,
            count: segments[segment.slug],
          }))}
        />
      </section>
    </div>
  );
}

function Band({ title, href, rows }: { title: string; href: string; rows: Array<{ label: string; count: number }> }) {
  return (
    <article className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={href} className="text-xs font-medium text-foreground underline decoration-primary decoration-2 underline-offset-4">Open</Link>
      </div>
      <MiniBars rows={rows.map((row) => ({ label: row.label, value: row.count }))} />
    </article>
  );
}
