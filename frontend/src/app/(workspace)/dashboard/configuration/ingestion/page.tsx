import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";

type Feed = { code: string; name: string; kind: string; path: string };

type Run = Feed & {
  received: number;
  accepted: number;
  rejected: number;
  seconds: number;
  status: "On time" | "Retrying";
};

function simulate(feed: Feed): Run {
  let n = 0;
  for (const char of feed.code) n += char.charCodeAt(0);
  const received = 640 + (n % 520);
  const rejected = 3 + (n % 22);
  return {
    ...feed,
    received,
    accepted: received - rejected,
    rejected,
    seconds: Number((0.8 + (n % 28) / 10).toFixed(1)),
    status: n % 5 === 0 ? "Retrying" : "On time",
  };
}

export default async function IngestionPage() {
  let runs: Run[];
  try {
    const payload = await api<{ data: Feed[] }>("/configuration/sources");
    runs = payload.data.map(simulate);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }

  const accepted = runs.reduce((sum, run) => sum + run.accepted, 0);
  const rejected = runs.reduce((sum, run) => sum + run.rejected, 0);
  const retrying = runs.filter((run) => run.status === "Retrying").length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Ingestion</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Simulated performance of the last pull from each gateway and API. The figures show how the feeds behaved, not a live operations console.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-primary px-4 py-4 text-foreground">
          <p className="text-sm font-medium">Accepted</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{accepted.toLocaleString("en-GB")}</p>
          <p className="mt-1 text-sm">Records written from the last run</p>
        </article>
        <article className="rounded-2xl bg-foreground px-4 py-4 text-primary">
          <p className="text-sm font-medium">Rejected</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{rejected}</p>
          <p className="mt-1 text-sm text-background">Rows that failed validation</p>
        </article>
        <article className="rounded-2xl bg-accent px-4 py-4 text-foreground">
          <p className="text-sm font-medium">Feeds retrying</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{retrying}</p>
          <p className="mt-1 text-sm">Of {runs.length} configured feeds</p>
        </article>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {runs.map((run) => (
            <li key={run.code} className="grid gap-2 px-4 py-3 lg:grid-cols-[14rem_1fr_auto]">
              <div>
                <p className="text-sm font-semibold">{run.name}</p>
                <p className="text-sm text-foreground/75">{run.kind} · {run.path}</p>
              </div>
              <p className="text-sm">
                {run.accepted.toLocaleString("en-GB")} accepted · {run.rejected} rejected · {run.seconds}s
              </p>
              <p className={`h-fit rounded-full px-2.5 py-1 text-xs font-medium ${run.status === "On time" ? "bg-primary text-foreground" : "bg-foreground text-primary"}`}>{run.status}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
