import { api } from "@/lib/api";
import { logout } from "@/lib/actions";
import { Offline } from "@/components/offline";
import { AskPanel } from "@/app/(workspace)/account/ask-panel";
import { CustomerRecord, type CustomerRecordData, type JourneyEvent } from "@/components/customer-record";
import { labelize, roleLabel, when } from "@/lib/format";

type AccountSection = "profile" | "cover" | "medical" | "care" | "messages";

type Me = { data: { name: string; email: string; role: string; customerId: string | null } };

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
type Note = { id: string; title: string; body: string };

export async function AccountScreen({ section = "profile" }: { section?: AccountSection }) {
  try {
    const me = await api<Me>("/auth/me");
    if (!me.data.customerId) {
      return (
        <section className="max-w-lg">
          <header>
            <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">The account signed in on this desk.</p>
          </header>
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-primary">
                {initials(me.data.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{me.data.name}</p>
                <p className="truncate text-sm text-muted-foreground">{roleLabel(me.data.role)}</p>
              </div>
            </div>
            <dl className="mt-5 text-sm">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-0.5">{me.data.email}</dd>
            </dl>
            <form action={logout} className="mt-5">
              <button type="submit" className="inline-flex h-9 items-center rounded-full bg-foreground px-3.5 text-sm font-semibold text-background">
                Log out
              </button>
            </form>
          </div>
        </section>
      );
    }

    const [profile, journey, notes] = await Promise.all([
      api<{ data: CustomerRecordData }>(`/customers/${me.data.customerId}/profile`),
      api<{ data: JourneyEvent[] }>(`/customers/${me.data.customerId}/journey`),
      api<{ data: Note[] }>("/notifications"),
    ]);

    if (section === "messages") {
      return (
        <div className="space-y-4">
          <header>
            <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
            <p className="mt-1 text-sm text-muted-foreground">What was requested on your record.</p>
          </header>
          <section className="overflow-hidden rounded-2xl bg-foreground text-background">
            <h2 className="border-b border-background/10 px-4 py-2.5 text-sm font-semibold">Messages</h2>
            <ul className="divide-y divide-background/10">
              {notes.data.length === 0 ? <li className="px-4 py-3 text-sm text-background/70">No messages yet.</li> : null}
              {notes.data.map((note) => (
                <li key={note.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-primary">{note.title}</p>
                  <p className="text-sm text-background/80">{note.body}</p>
                </li>
              ))}
            </ul>
          </section>
          <AskPanel
            policies={profile.data.policies.map((policy) => `${policy.productName} (${policy.policyNumber}), renews ${when(policy.renewalDate)}`)}
            claims={profile.data.recentClaims.map((claim) => `${claim.claimNumber} is ${labelize(claim.status)}`)}
            renewal={profile.data.policies[0] ? when(profile.data.policies[0].renewalDate) : "No renewal on file"}
          />
        </div>
      );
    }

    return <CustomerRecord data={profile.data} journey={journey.data} section={section} />;
  } catch (error) {
    return <Offline error={error} />;
  }
}
