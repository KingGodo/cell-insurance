import Link from "next/link";
import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { ScrollTo } from "@/components/scroll-to";
import { AskPanel } from "@/app/(workspace)/account/ask-panel";
import { CustomerRecord, type CustomerRecordData, type JourneyEvent } from "@/components/customer-record";
import { labelize, when } from "@/lib/format";

const sectionLinks = [
  { href: "/account", label: "Profile" },
  { href: "/account/cover", label: "Insurance" },
  { href: "/account/medical", label: "Medical aid" },
  { href: "/account/care", label: "Healthcare" },
  { href: "/claims", label: "Claims" },
  { href: "/account/messages", label: "Messages" },
];

type Me = { data: { customerId: string | null } };
type Note = { id: string; title: string; body: string };

export async function AccountScreen({ focus }: { focus?: string }) {
  try {
    const me = await api<Me>("/auth/me");
    if (!me.data.customerId) {
      return (
        <section>
          <h1 className="text-xl font-semibold tracking-tight">Team account</h1>
          <p className="mt-2 text-sm text-muted-foreground">This sign-in is for the team. Open the command centre to work the book.</p>
          <Link href="/dashboard" className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground">
            Command centre
          </Link>
        </section>
      );
    }

    const [profile, journey, notes] = await Promise.all([
      api<{ data: CustomerRecordData }>(`/customers/${me.data.customerId}/profile`),
      api<{ data: JourneyEvent[] }>(`/customers/${me.data.customerId}/journey`),
      api<{ data: Note[] }>("/notifications"),
    ]);

    return (
      <div className="space-y-4">
        {focus ? <ScrollTo id={focus} /> : null}
        <CustomerRecord data={profile.data} journey={journey.data} sectionLinks={sectionLinks} />
        <section id="messages" className="scroll-mt-24 overflow-hidden rounded-2xl bg-foreground text-background">
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
  } catch (error) {
    return <Offline error={error} />;
  }
}
