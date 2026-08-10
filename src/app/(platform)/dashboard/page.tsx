import { Dashboard } from "@/components/clinic/dashboard";
import { redirect } from "next/navigation";
import { requireClinicSession } from "@/lib/auth/session";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const session = await requireClinicSession();
  if (session.role === "contractor") redirect("/grid");
  const appointments = await listAppointmentsForOrganization(session.organizationId);
  const query = await searchParams;
  const seededDemo = session.organizationId === "org-bfm" || session.organizationId === "org-luxe";
  return <Dashboard appointments={appointments} onboardingComplete={query.onboarding === "complete"} organizationName={session.organizationName} seededDemo={seededDemo} userName={session.name} />;
}
