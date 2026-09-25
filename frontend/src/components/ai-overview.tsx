import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { MiniBars } from "@/components/mini-bars";
import { Offline } from "@/components/offline";
import { SegmentPlot, type PlotPoint } from "@/components/segment-plot";
import { matrixSegments, matrixSlug, segmentColor, type MatrixSlug } from "@/lib/matrix";

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
          {scored.length} customers placed by value and risk. Segment colors match the graph.
        </p>
      </header>
      <section className="flex flex-wrap gap-2">
        <Figure label="Save me now" value={segments["save-me-now"]} color={segmentColor["save-me-now"]} href="/dashboard/segments/save-me-now" />
        <Figure label="High risk" value={risk.high} color="#121212" href="/dashboard/ai/risk" />
        <Figure label="High value" value={value.high} color="#121212" href="/dashboard/ai/value" />
        <Figure label="VVIP" value={segments.vvip} color={segmentColor.vvip} href="/dashboard/segments/vvip" />
      </section>
      <SegmentPlot points={points} />
      <section className="grid gap-3 md:grid-cols-3">
          <Band
            title="Risk"
            href="/dashboard/ai/risk"
            rows={[
              { label: "High risk", value: risk.high },
              { label: "Medium risk", value: risk.medium },
              { label: "Low risk", value: risk.low },
            ]}
          />
          <Band
            title="Value"
            href="/dashboard/ai/value"
            rows={[
              { label: "High value", value: value.high },
              { label: "Medium value", value: value.medium },
              { label: "Low value", value: value.low },
            ]}
          />
          <Band
            title="Segments"
            href="/dashboard/segments"
            rows={matrixSegments.map((segment) => ({
              label: segment.name,
              value: segments[segment.slug],
              color: segmentColor[segment.slug],
            }))}
          />
      </section>
    </div>
  );
}

function Figure({ label, value, color, href }: { label: string; value: number; color: string; href: string }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card pr-3 pl-2.5 hover:bg-secondary/40">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}</span>
    </Link>
  );
}

function Band({ title, href, rows }: { title: string; href: string; rows: Array<{ label: string; value: number; color: string }> }) {
  return (
    <article className="rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold">{title}</h2>
        <Link href={href} className="text-xs font-medium text-foreground underline decoration-primary decoration-2 underline-offset-4">Open</Link>
      </div>
      <MiniBars compact wide rows={rows} />
    </article>
  );
}
