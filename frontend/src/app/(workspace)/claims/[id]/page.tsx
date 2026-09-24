import Link from "next/link";
import { addClaimDocument, updateClaimStatus } from "@/lib/actions";
import { api, getSession } from "@/lib/api";
import { Offline } from "@/components/offline";
import { SignalBadge } from "@/components/signal-badge";
import { labelize, money, when } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClaimDetail = {
  data: {
    id: string;
    claimNumber: string;
    type: string;
    status: string;
    amount: number;
    description: string;
    incidentDate: string;
    submittedAt: string;
    reviewSignal: string;
    anomalyScore: number;
    customer: { id: string; customerCode: string; firstName: string; lastName: string };
    provider: { name: string; averageClaimValue: number } | null;
    documents: Array<{ id: string; fileName: string; documentType: string; status: string }>;
    events: Array<{ id: string; title: string; description: string; occurredAt: string }>;
    prediction: { score: number; signal: string; factors: string[]; modelVersion: string } | null;
  };
};

const statuses = ["SUBMITTED", "DOCUMENTS_REQUIRED", "UNDER_REVIEW", "APPROVED", "DECLINED", "PAID"];

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let claim: ClaimDetail;
  try {
    claim = await api<ClaimDetail>(`/claims/${id}`);
  } catch (error) {
    return <Offline error={error} />;
  }

  const data = claim.data;
  const factors = data.prediction?.factors ?? [];
  const canDecide = session?.role === "ADMIN" || session?.role === "CLAIMS_OFFICER";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{data.claimNumber}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{data.description}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href={`/customers/${data.customer.id}`} className="underline-offset-4 hover:underline">
              {data.customer.firstName} {data.customer.lastName}
            </Link>
            {" · "}
            {data.customer.customerCode} · submitted {when(data.submittedAt)}
          </p>
        </div>
        <SignalBadge signal={data.reviewSignal} />
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Claim</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">{money(data.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{labelize(data.type)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{labelize(data.status)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Incident</dt>
              <dd>{when(data.incidentDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Provider</dt>
              <dd>{data.provider ? `${data.provider.name} · typical ${money(data.provider.averageClaimValue)}` : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Signal strength</dt>
              <dd>{data.anomalyScore}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-2xl bg-foreground p-4 text-background">
          <p className="text-sm text-primary">{data.reviewSignal === "NORMAL" ? "Consistent with history" : "Review recommended"}</p>
          <h2 className="mt-2 text-base font-semibold tracking-tight">Why this claim looks the way it does</h2>
          <ul className="mt-6 space-y-3">
            {factors.map((factor) => (
              <li key={factor} className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-background/85">
                {factor}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-background/50">{data.prediction?.modelVersion}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Documents</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                <span>
                  <span className="block font-medium">{document.documentType}</span>
                  <span className="text-muted-foreground">{document.fileName}</span>
                </span>
                <span>{labelize(document.status)}</span>
              </li>
            ))}
          </ul>
          {data.status === "DOCUMENTS_REQUIRED" ? (
            <form action={addClaimDocument} className="mt-5 space-y-3">
              <input type="hidden" name="id" value={data.id} />
              <div className="space-y-2">
                <Label htmlFor="documentType">Document type</Label>
                <Input id="documentType" name="documentType" required defaultValue="Specialist report" className="h-9 px-3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileName">File name</Label>
                <Input id="fileName" name="fileName" required defaultValue="specialist-report.pdf" className="h-9 px-3" />
              </div>
              <Button type="submit" className="h-9 rounded-full px-4">
                Mark document received
              </Button>
            </form>
          ) : null}
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <ol className="mt-4 space-y-4">
            {data.events.map((event) => (
              <li key={event.id}>
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground">{when(event.occurredAt)}</p>
              </li>
            ))}
          </ol>
          {canDecide ? (
            <form action={updateClaimStatus} className="mt-6 space-y-3 border-t border-border pt-5">
              <input type="hidden" name="id" value={data.id} />
              <div className="space-y-2">
                <Label htmlFor="status">Update status</Label>
                <select id="status" name="status" defaultValue={data.status} className="h-9 w-full rounded-full border border-input bg-white px-3 text-sm">
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {labelize(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note to the customer</Label>
                <Input id="note" name="note" placeholder="Your claim requires additional documentation." className="h-9 px-3" />
              </div>
              <Button type="submit" className="h-9 rounded-full px-4">
                Save decision
              </Button>
            </form>
          ) : null}
        </article>
      </section>
    </div>
  );
}
