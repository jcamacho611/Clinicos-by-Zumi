import { Dashboard } from "@/components/clinic/dashboard";
import { requireClinicSession } from "@/lib/auth/session";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

export default async function DashboardPage() {
  const session = await requireClinicSession();
  const appointments = await listAppointmentsForOrganization(session.organizationId);
  return <Dashboard appointments={appointments} userName={session.name} />;
}
