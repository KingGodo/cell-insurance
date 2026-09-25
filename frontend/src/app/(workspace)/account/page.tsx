import { AccountScreen } from "@/components/account-screen";
import { CustomerOverview } from "@/components/customer-overview";
import { getSession } from "@/lib/api";

export default async function AccountPage() {
  const session = await getSession();
  if (session?.role === "CUSTOMER") return <CustomerOverview />;
  return <AccountScreen />;
}
