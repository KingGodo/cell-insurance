import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { RetentionRules, type Rule, type RulePlan } from "@/components/retention-rules";
import { ensureRetentionReady } from "@/lib/retention-ready";

export default async function RetentionRulesPage() {
  try {
    await ensureRetentionReady();
    const [rules, plans] = await Promise.all([
      api<{ data: Rule[] }>("/retentions/rules"),
      api<{ data: RulePlan[] }>("/retentions/plans"),
    ]);
    return <RetentionRules rules={rules.data ?? []} plans={plans.data ?? []} />;
  } catch (error) {
    return <Offline error={error} />;
  }
}
