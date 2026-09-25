import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { RetentionPlans, type Plan } from "@/components/retention-plans";
import { ensureRetentionReady } from "@/lib/retention-ready";

export default async function RetentionPlansPage() {
  try {
    await ensureRetentionReady();
    const payload = await api<{ data: Plan[] }>("/retentions/plans");
    return <RetentionPlans plans={payload.data} />;
  } catch (error) {
    return <Offline error={error} />;
  }
}
