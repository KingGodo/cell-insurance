import { CsvEntry } from "@/components/csv-entry";
import { ApiError, api } from "@/lib/api";
import { Offline } from "@/components/offline";

type Feed = { code: string; columns: string[] };

export default async function CsvPage() {
  try {
    const payload = await api<{ data: Feed[] }>("/configuration/sources");
    const identity = payload.data.find((feed) => feed.code === "identity");
    return <CsvEntry columns={identity?.columns ?? []} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <Offline error={new ApiError("This desk is for the admin.", 403)} />;
    }
    return <Offline error={error} />;
  }
}
