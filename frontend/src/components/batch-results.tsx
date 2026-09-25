import Link from "next/link";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { buildBatch, countSegments, type BatchCustomer, type BatchOutcome } from "@/lib/batch";
import { matrixBySlug, matrixSegments, type MatrixSlug } from "@/lib/matrix";

const steps = [
  "Gateway records pulled",
  "Risk features calculated",
  "Value features calculated",
  "Both models scored the book",
  "Compared with the previous batch",
  "Segment changes written",
];

const tone: Record<MatrixSlug, string> = {
  vvip: "#0f766e",
  growable: "#4f46e5",
  ghost: "#d97706",
  "save-me-now": "#e11d48",
};

function segmentName(slug: MatrixSlug) {
  return matrixBySlug(slug)?.name ?? slug;
}

type BookProfile = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  location: string;
  profile: { valueScore: number; riskScore: number } | null;
};

function signed(now: number, then: number) {
  const delta = now - then;
  if (delta === 0) return "0";
  return `${delta > 0 ? "+" : ""}${delta}`;
}

export async function BatchResults() {
  let rows: BatchCustomer[];
  try {
    const overview = await api<{ data: { profiles: BookProfile[] } }>("/analytics/overview");
    rows = buildBatch(overview.data.profiles);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }

  const before = countSegments(rows, "from");
  const after = countSegments(rows, "to");
  const maxCount = Math.max(...matrixSegments.map((segment) => Math.max(before[segment.slug], after[segment.slug])), 1);
  const converted = rows.filter((row) => row.outcome === "converted" || row.outcome === "recovered");
  const saved = rows.filter((row) => row.outcome === "saved");
  const losing = rows.filter((row) => row.outcome === "losing" || row.outcome === "lost" || row.outcome === "slipped");
  const held = rows.filter((row) => row.outcome === "held");
  const changes = rows.filter((row) => row.outcome !== "held").sort((a, b) => outcomeRank(a.outcome) - outcomeRank(b.outcome));

  const vvipDelta = after.vvip - before.vvip;
  const ghostDelta = after.ghost - before.ghost;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Batch results</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/75">
          Simulated run customeriq-batch-20260924, compared with customeriq-batch-20260917. This run uses the live risk and value scores. The previous run is simulated so the movement can be read.
        </p>
      </header>

      <section className="rounded-2xl bg-foreground px-4 py-4 text-primary">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Batch complete</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-background">{rows.length} customers processed</p>
          </div>
          <p className="text-sm">customeriq-xgb-sim-v1 · customeriq-value-sim-v1</p>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2 text-sm text-background">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-foreground">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResultCard label="Converted" value={converted.length} note="Moved into VVIP, or back from Ghost into Growable." surface="bg-primary text-foreground" />
        <ResultCard label="Saved" value={saved.length} note="Left Save me now. The risk fell and the value held." surface="bg-foreground text-primary" />
        <ResultCard label="Losing" value={losing.length} note="Slipped into Save me now or Ghost, or the value fell out of VVIP." surface="bg-[oklch(0.32_0.05_55)] text-primary" />
        <ResultCard label="Held" value={held.length} note="Same segment as the previous batch." surface="bg-accent text-foreground" />
      </section>

      <section className="rounded-2xl border border-border bg-card px-4 py-4">
        <h2 className="text-sm font-semibold">What the batch says</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
          {converted.length} customers converted into a stronger segment and {saved.length} were pulled back from Save me now. {losing.length} moved the wrong way.
          VVIP is {vvipDelta === 0 ? "unchanged" : `${Math.abs(vvipDelta)} ${vvipDelta > 0 ? "larger" : "smaller"}`} than the previous batch.
          Ghost is {ghostDelta === 0 ? "unchanged" : `${Math.abs(ghostDelta)} ${ghostDelta > 0 ? "larger" : "smaller"}`}.
          {held.length} customers stayed where they were.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card px-4 py-4">
        <h2 className="text-sm font-semibold">Segment change</h2>
        <p className="mt-1 text-sm text-foreground/75">Previous batch on the left, this batch on the right.</p>
        <ul className="mt-4 space-y-4">
          {matrixSegments.map((segment) => (
            <li key={segment.slug}>
              <div className="flex items-center justify-between gap-3 text-sm font-medium">
                <span>{segment.name}</span>
                <span className="tabular-nums">{before[segment.slug]} → {after[segment.slug]}</span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <Bar count={before[segment.slug]} max={maxCount} color={tone[segment.slug]} />
                <Bar count={after[segment.slug]} max={maxCount} color={tone[segment.slug]} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Customers who changed segment</h2>
          <p className="mt-1 text-sm text-foreground/75">Value and risk from the previous simulated batch, then this run.</p>
        </div>
        {changes.length === 0 ? <p className="px-4 py-6 text-sm">No segment changed in this batch.</p> : null}
        <ul className="divide-y divide-border">
          {changes.map((row) => (
            <li key={row.id} className="relative grid gap-3 px-4 py-3 lg:grid-cols-[14rem_1fr_1fr]">
              <Link href={`/customers/${row.id}`} className="absolute inset-0 z-10" aria-label={`Open ${row.name}`} />
              <div className="pointer-events-none">
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="text-sm text-foreground/75">{row.code} · {row.location}</p>
                <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${outcomeClass(row.outcome)}`}>{outcomeLabel(row.outcome)}</p>
              </div>
              <p className="pointer-events-none text-sm">
                <span className="font-medium">{segmentName(row.from)}</span>
                <span className="px-1.5 text-foreground/50">→</span>
                <span className="font-medium">{segmentName(row.to)}</span>
              </p>
              <p className="pointer-events-none text-sm tabular-nums">
                Value {row.priorValue} → {row.value} <span className="font-medium">({signed(row.value, row.priorValue)})</span>
                <span className="px-2 text-foreground/30">·</span>
                Risk {row.priorRisk} → {row.risk} <span className="font-medium">({signed(row.risk, row.priorRisk)})</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResultCard({ label, value, note, surface }: { label: string; value: number; note: string; surface: string }) {
  return (
    <article className={`rounded-2xl px-4 py-4 ${surface}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm leading-relaxed opacity-90">{note}</p>
    </article>
  );
}

function Bar({ count, max, color }: { count: number; max: number; color: string }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-foreground/10">
      <span className="block h-full rounded-full" style={{ width: `${Math.max(count === 0 ? 0 : 8, (count / max) * 100)}%`, background: color }} />
    </span>
  );
}

function outcomeLabel(outcome: BatchOutcome) {
  if (outcome === "converted") return "Converted";
  if (outcome === "saved") return "Saved";
  if (outcome === "recovered") return "Recovered";
  if (outcome === "losing") return "Losing";
  if (outcome === "lost") return "Lost";
  if (outcome === "slipped") return "Value slipped";
  return "Held";
}

function outcomeClass(outcome: BatchOutcome) {
  if (outcome === "converted" || outcome === "recovered") return "bg-primary text-foreground";
  if (outcome === "saved") return "bg-foreground text-primary";
  if (outcome === "losing" || outcome === "lost") return "bg-[oklch(0.32_0.05_55)] text-primary";
  return "bg-accent text-foreground";
}

function outcomeRank(outcome: BatchOutcome) {
  if (outcome === "converted" || outcome === "recovered") return 0;
  if (outcome === "saved") return 1;
  if (outcome === "losing" || outcome === "lost" || outcome === "slipped") return 2;
  return 3;
}
