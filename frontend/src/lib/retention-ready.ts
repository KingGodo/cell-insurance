import { api } from "@/lib/api";

export async function ensureRetentionReady() {
  await api("/analytics/overview");
}
