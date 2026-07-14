import { Dashboard } from "@/components/clinic/dashboard";
import { requireClinicSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireClinicSession();
  return <Dashboard organizationId={session.organizationId} userName={session.name} />;
}
