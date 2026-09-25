import { api } from "@/lib/api";
import { MiniBars } from "@/components/mini-bars";
import { Offline } from "@/components/offline";
import { labelize } from "@/lib/format";

type Person = {
  location: string;
  engagement: string;
  preferredChannel: string;
  profile: { productsHeld: string[] } | null;
};

export default async function CustomerOverviewPage() {
  let people: Person[];
  try {
    const overview = await api<{ data: { profiles: Person[] } }>("/analytics/overview");
    people = overview.data.profiles;
  } catch (error) {
    return <Offline error={error} />;
  }

  const locations = tally(people.map((person) => person.location));
  const engagement = tally(people.map((person) => labelize(person.engagement)));
  const channels = tally(people.map((person) => labelize(person.preferredChannel)));
  const products = tally(people.flatMap((person) => person.profile?.productsHeld ?? ["No product"]));
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          {people.length} customers, counted by where they live, how they engage, and what they hold.
        </p>
      </header>
      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card px-4 py-4">
          <MiniBars title="Customers by location" rows={locations.map((row) => ({ label: row.label, value: row.count }))} />
        </article>
        <Panel title="Engagement" rows={engagement} />
        <Panel title="Preferred channel" rows={channels} />
        <Panel title="Products held" rows={products} />
      </section>
    </div>
  );
}

function tally(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function Panel({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  return (
    <article className="rounded-2xl border border-border bg-card px-4 py-4">
      <MiniBars title={title} rows={rows.map((row) => ({ label: row.label, value: row.count }))} />
    </article>
  );
}
