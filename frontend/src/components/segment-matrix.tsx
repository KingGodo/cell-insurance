import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { SegmentPlot, type PlotPoint } from "@/components/segment-plot";
import { VALUE_LINE, RISK_LINE, matrixSegments, matrixSlug, type MatrixSlug } from "@/lib/matrix";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  profile: { riskScore: number; valueScore: number } | null;
};

export async function SegmentMatrix() {
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

  const placed: PlotPoint[] = people.flatMap((person) => {
    if (!person.profile) return [];
    return [{
      id: person.id,
      name: `${person.firstName} ${person.lastName}`,
      value: person.profile.valueScore,
      risk: person.profile.riskScore,
      slug: matrixSlug(person.profile.valueScore, person.profile.riskScore),
    }];
  });
  const counts = Object.fromEntries(matrixSegments.map((segment) => [segment.slug, placed.filter((person) => person.slug === segment.slug).length])) as Record<MatrixSlug, number>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Segments</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Value runs across. Risk runs up. The lines sit at value {VALUE_LINE} and risk {RISK_LINE}, which splits the book into four segments.
        </p>
      </header>

      <SegmentPlot points={placed} />

      <section className="grid gap-3 md:grid-cols-2">
        {matrixSegments.map((segment) => (
          <article key={segment.slug} className={`flex flex-col rounded-2xl px-4 py-4 ${segment.surface}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{segment.name}</h2>
              <p className={`text-3xl font-semibold tracking-tight tabular-nums ${segment.figure}`}>{counts[segment.slug]}</p>
            </div>
            <p className={`mt-2 flex-1 text-sm leading-relaxed ${segment.ink}`}>{segment.meaning}</p>
            <Link href={`/dashboard/segments/${segment.slug}`} className={`mt-4 inline-flex h-9 w-fit items-center rounded-full px-4 text-sm font-medium ${segment.button}`}>
              View customers
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
