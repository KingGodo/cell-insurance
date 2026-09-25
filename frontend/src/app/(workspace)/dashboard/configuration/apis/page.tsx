import { ApiSources } from "@/components/api-sources";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";

type Feed = {
  code: string;
  name: string;
  kind: "GATEWAY" | "API";
  origin: string;
  method: "POST";
  path: string;
  headers: string[];
  keys: Array<{ name: string; required: boolean; note: string }>;
  example: Record<string, unknown>;
  storedIn: string[];
  usedFor: string[];
};

export default async function ApisPage() {
  try {
    const payload = await api<{ data: Feed[] }>("/configuration/sources");
    return <ApiSources feeds={payload.data} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }
}
