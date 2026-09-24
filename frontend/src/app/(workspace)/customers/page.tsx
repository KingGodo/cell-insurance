import Link from "next/link";
import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { when } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CustomerRow = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  location: string;
  customerSince: string;
  segments: Array<{ label: string; kind: string }>;
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  let payload: { data: CustomerRow[]; meta: { total: number } };
  try {
    const query = new URLSearchParams({ pageSize: "30" });
    if (search) query.set("search", search);
    payload = await api(`/customers?${query.toString()}`);
  } catch (error) {
    return <Offline error={error} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Customers</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Find the relationship</h1>
        </div>
        <form className="flex gap-2" action="/customers">
          <label className="sr-only" htmlFor="search">
            Search customers
          </label>
          <Input id="search" name="search" defaultValue={search} placeholder="Name, code, or email" className="h-9 w-64 px-3" />
          <Button type="submit" className="h-9 rounded-full px-4">
            Search
          </Button>
        </form>
      </header>
      <p className="text-sm text-muted-foreground">{payload.meta.total} customers</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Since</TableHead>
              <TableHead>Segment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payload.data.map((customer) => {
              const product = customer.segments.find((segment) => segment.kind === "PRODUCT");
              return (
                <TableRow key={customer.id} className="relative">
                  <TableCell className="relative">
                    <Link href={`/customers/${customer.id}`} className="font-medium after:absolute after:inset-0">
                      {customer.firstName} {customer.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.customerCode}</TableCell>
                  <TableCell>{customer.location}</TableCell>
                  <TableCell>{when(customer.customerSince)}</TableCell>
                  <TableCell>{product ? <Badge variant="secondary">{product.label}</Badge> : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
