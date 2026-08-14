import { LivingHome } from "@/components/clinic/living-home";
import { WorkspaceLaunchpad } from "@/components/clinic/workspace-launchpad";
import { redirect } from "next/navigation";
import { requireClinicSession } from "@/lib/auth/session";
import { resolvePathGuidanceList } from "@/lib/orchestration/path-guidance-engine";
import { listActivePathSnapshots } from "@/lib/orchestration/path-persistence-repository";
import { listRecentPathSignals } from "@/lib/orchestration/path-signal-repository";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const session = await requireClinicSession();
  if (session.role === "contractor") redirect("/grid");

  const [appointments, activePaths, recentPathSignals] = await Promise.all([
    listAppointmentsForOrganization(
      session.organizationId,
      session.role === "provider" ? { providerUserId: session.userId } : {},
    ),
    listActivePathSnapshots(session),
    listRecentPathSignals(session),
  ]);
  const livingAppointments = appointments.filter((appointment) => appointment.status !== "Cancelled");
  const pathGuidance = resolvePathGuidanceList(session, activePaths);
  const query = await searchParams;
  const firstName = session.name.split(/\s+/)[0] || "there";

  return (
    <div className="space-y-16">
      <LivingHome
        appointments={livingAppointments}
        firstName={firstName}
        initialGuidance={pathGuidance}
        initialPaths={activePaths}
        onboardingComplete={query.onboarding === "complete"}
        organizationName={session.organizationName}
        recentSignals={recentPathSignals}
        role={session.role}
        userName={session.name}
      />
      <WorkspaceLaunchpad role={session.role} />
    </div>
  );
}
