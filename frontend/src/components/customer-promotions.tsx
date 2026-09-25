import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { type CustomerRecordData } from "@/components/customer-record";

type Me = { data: { customerId: string | null } };
type Promotion = NonNullable<CustomerRecordData["retentions"]>[number];

const channelLabel: Record<string, string> = {
  SMS: "SMS",
  EMAIL: "Email",
  SOCIALS: "Socials",
  MARKETING: "From the team",
  CUSTOMER_SERVICE: "Customer service",
  PORTAL: "Portal",
};

function channelsFor(item: Promotion) {
  return (item.channels ?? []).map((channel) => channelLabel[channel] ?? channel.toLowerCase());
}

function customerNote(summary?: string) {
  if (!summary) return null;
  if (/value|risk/i.test(summary)) return null;
  return summary;
}

function Offer({ item, lead = false }: { item: Promotion; lead?: boolean }) {
  const name = item.plan?.name ?? item.title;
  const note = customerNote(item.plan?.summary);
  const channels = channelsFor(item);
  return (
    <article className={lead ? "rounded-2xl bg-foreground px-5 py-4 text-background" : "flex h-full flex-col rounded-2xl border border-border bg-card px-4 py-3"}>
      <p className={lead ? "text-[11px] font-semibold tracking-wide text-primary uppercase" : "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"}>
        {lead ? "Chosen for you" : "Also open"}
      </p>
      <h2 className={lead ? "mt-1 text-lg font-semibold tracking-tight" : "mt-1 text-sm font-semibold"}>{name}</h2>
      <p className={lead ? "mt-2 max-w-xl text-sm leading-relaxed text-background/80" : "mt-1 flex-1 text-sm leading-relaxed text-foreground/80"}>{item.plan?.offer}</p>
      {!lead && note ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
      {channels.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {channels.map((channel) => (
            <li key={channel} className={lead ? "rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground" : "rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground/80"}>
              {channel}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export async function CustomerPromotions() {
  try {
    const me = await api<Me>("/auth/me");
    if (!me.data.customerId) return null;
    const profile = await api<{ data: CustomerRecordData }>(`/customers/${me.data.customerId}/profile`);
    const sent = (profile.data.retentions ?? []).filter((item) => item.plan?.offer);
    const [lead, ...rest] = sent;

    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">Promotions</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Offers chosen from your cover, claims, and the way you pay.</p>
        </header>
        {lead ? <Offer item={lead} lead /> : <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">No promotion is open on your account.</p>}
        {rest.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((item) => (
              <li key={item.plan?.name ?? item.title}>
                <Offer item={item} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  } catch (error) {
    return <Offline error={error} />;
  }
}
