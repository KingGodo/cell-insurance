import Link from "next/link";
import { api, getSession } from "@/lib/api";
import { Offline } from "@/components/offline";
import { SignalBadge } from "@/components/signal-badge";
import { labelize, money, when } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ClaimRow = {
  id: string;
  claimNumber: string;
  type: string;
  status: string;
  amount: number;
  reviewSignal: string;
  anomalyScore: number;
  submittedAt: string;
  customer: { id: string; firstName: string; lastName: string };
};

const filters = [
  { href: "/claims", label: "All" },
  { href: "/claims?signal=HIGH_PRIORITY", label: "High priority" },
  { href: "/claims?signal=REVIEW_REQUIRED", label: "Review" },
  { href: "/claims?status=DOCUMENTS_REQUIRED", label: "Missing documents" },
];

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ signal?: string; status?: string }>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams({ pageSize: "40" });
  if (query.signal) params.set("signal", query.signal);
  if (query.status) params.set("status", query.status);

  const session = await getSession();
  const ownClaims = session?.role === "CUSTOMER";
  let payload: { data: ClaimRow[]; meta: { total: number } };
  try {
    payload = await api(`/claims?${params.toString()}`);
  } catch (error) {
    return <Offline error={error} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{ownClaims ? "Claims" : "Work the queue"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ownClaims ? "Status of the claims on your record." : `${payload.meta.total} claims in this view`}
        </p>
      </header>
      {ownClaims ? null : (
      <nav className="flex flex-wrap gap-1" aria-label="Claim filters">
        {filters.map((filter) => {
          const target = new URL(filter.href, "http://local");
          const active =
            (query.signal ?? "") === (target.searchParams.get("signal") ?? "") &&
            (query.status ?? "") === (target.searchParams.get("status") ?? "");
          return (
            <Link
              key={filter.href}
              href={filter.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-sm ${
                active ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>
      )}
      {ownClaims ? null : <p className="text-sm text-muted-foreground">{payload.meta.total} claims in this view</p>}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim</TableHead>
              {ownClaims ? null : <TableHead>Customer</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              {ownClaims ? null : <TableHead>Signal</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payload.data.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>
                  <Link href={`/claims/${claim.id}`} className="font-medium underline-offset-4 hover:underline">
                    {claim.claimNumber}
                  </Link>
                  <span className="mt-1 block text-xs text-muted-foreground">{when(claim.submittedAt)}</span>
                </TableCell>
                {ownClaims ? null : (
                  <TableCell>
                    {claim.customer.firstName} {claim.customer.lastName}
                  </TableCell>
                )}
                <TableCell>{labelize(claim.type)}</TableCell>
                <TableCell>{money(claim.amount)}</TableCell>
                <TableCell>{labelize(claim.status)}</TableCell>
                {ownClaims ? null : (
                  <TableCell>
                    <SignalBadge signal={claim.reviewSignal} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
