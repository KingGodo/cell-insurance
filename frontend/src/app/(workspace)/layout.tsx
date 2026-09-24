import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { api, getSession } from "@/lib/api";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let email = "";
  let customerCode: string | null = null;
  let location: string | null = null;

  try {
    const me = await api<{ data: { email: string; customerId: string | null } }>("/auth/me");
    email = me.data.email;
    if (me.data.customerId) {
      const profile = await api<{ data: { customer: { customerCode: string; location: string } } }>(
        `/customers/${me.data.customerId}/profile`,
      );
      customerCode = profile.data.customer.customerCode;
      location = profile.data.customer.location;
    }
  } catch {
    email = "";
  }

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Harare",
  }).format(new Date());

  return (
    <AppShell
      name={session.name}
      email={email}
      role={session.role}
      customerCode={customerCode}
      location={location}
      today={today}
    >
      {children}
    </AppShell>
  );
}
