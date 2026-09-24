import { api } from "@/lib/api";
import { Offline } from "@/components/offline";
import { CustomerRecord, type CustomerRecordData, type JourneyEvent } from "@/components/customer-record";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [profile, journey] = await Promise.all([
      api<{ data: CustomerRecordData }>(`/customers/${id}/profile`),
      api<{ data: JourneyEvent[] }>(`/customers/${id}/journey`),
    ]);
    return <CustomerRecord data={profile.data} journey={journey.data} />;
  } catch (error) {
    return <Offline error={error} />;
  }
}
