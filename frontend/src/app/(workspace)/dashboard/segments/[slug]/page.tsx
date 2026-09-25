import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { RiskChip, ValueChip } from "@/components/score-meter";
import { matrixBySlug, matrixSlug } from "@/lib/matrix";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Person = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  location: string;
  profile: { riskScore: number; valueScore: number; riskBand: string; valueBand: string } | null;
};

export default async function SegmentCustomersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const segment = matrixBySlug(slug);
  if (!segment) notFound();

  let people: Person[];
  try {
    const overview = await api<{ data: { profiles: Person[] } }>("/analytics/overview");
    people = overview.data.profiles.filter((person) => person.profile && matrixSlug(person.profile.valueScore, person.profile.riskScore) === segment.slug);
  } catch (error) {
    return <Offline error={error} />;
  }

  people.sort((a, b) => (b.profile?.riskScore ?? 0) - (a.profile?.riskScore ?? 0) || (b.profile?.valueScore ?? 0) - (a.profile?.valueScore ?? 0));

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground/75">Segment</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{segment.name}</h1>
          <p className="mt-1 max-w-3xl text-sm text-foreground/75">{segment.meaning}</p>
        </div>
        <Link href="/dashboard/segments" className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-primary">
          Back to segments
        </Link>
      </header>
      <p className="text-sm text-foreground">{people.length} customers</p>
      {people.length === 0 ? (
        <p className="rounded-2xl bg-accent px-4 py-6 text-sm text-foreground">No customers sit in this segment.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id} className="relative">
                  <TableCell className="relative">
                    <Link href={`/customers/${person.id}`} className="font-medium after:absolute after:inset-0">
                      {person.firstName} {person.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{person.customerCode}</TableCell>
                  <TableCell>{person.location}</TableCell>
                  <TableCell>{person.profile ? <RiskChip band={person.profile.riskBand} score={person.profile.riskScore} /> : "—"}</TableCell>
                  <TableCell>{person.profile ? <ValueChip band={person.profile.valueBand} score={person.profile.valueScore} /> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
