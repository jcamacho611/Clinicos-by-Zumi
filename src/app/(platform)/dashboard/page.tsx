import { ClinicFirstLoginLaunch } from "@/components/commercial/clinic-first-login-launch";
import { HomeOperatingRailPanel } from "@/components/clinic/home-operating-rail";
import { LivingHome } from "@/components/clinic/living-home";
import { WorkspaceLaunchpad } from "@/components/clinic/workspace-launchpad";
import { redirect } from "next/navigation";
import { requireClinicSession } from "@/lib/auth/session";
import { getClinicLaunchBriefing } from "@/lib/commercial/clinic-launch-briefing";
import { getHomeOperatingRail } from "@/lib/home/operating-rail";
import { resolvePathGuidanceList } from "@/lib/orchestration/path-guidance-engine";
import { listActivePathSnapshots } from "@/lib/orchestration/path-persistence-repository";
import { listRecentPathSignals } from "@/lib/orchestration/path-signal-repository";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const session = await requireClinicSession();
  if (session.role === "contractor") redirect("/grid");

  const query = await searchParams;
  const launchRequested = query.onboarding === "complete";
  const [appointments, activePaths, recentPathSignals, launchBriefing, operatingRail] = await Promise.all([
    listAppointmentsForOrganization(
      session.organizationId,
      session.role === "provider" ? { providerUserId: session.userId } : {},
    ),
    listActivePathSnapshots(session),
    listRecentPathSignals(session),
    launchRequested ? getClinicLaunchBriefing(session.organizationId) : Promise.resolve(null),
    getHomeOperatingRail(session),
  ]);
  const livingAppointments = appointments.filter((appointment) => appointment.status !== "Cancelled");
  const pathGuidance = resolvePathGuidanceList(session, activePaths);
  const firstName = session.name.split(/\s+/)[0] || "there";
  const verifiedFirstLogin = Boolean(launchRequested && launchBriefing?.verifiedFirstLogin);

  return (
    <div className="space-y-16">
      {verifiedFirstLogin && launchBriefing ? (
        <ClinicFirstLoginLaunch organizationName={session.organizationName} briefing={launchBriefing} />
      ) : null}
      {/*
        The approved Living Home reference still contains a historical role-template
        Opportunity section. Hide only that stale section at composition time; the
        server-owned operating rail below is the sole surface allowed to represent a
        live opportunity because it is backed by persisted Grid/task/escalation truth.
      */}
      <div className="[&_[aria-labelledby=opportunity-title]]:hidden">
        <LivingHome
          appointments={livingAppointments}
          firstName={firstName}
          initialGuidance={pathGuidance}
          initialPaths={activePaths}
          onboardingComplete={verifiedFirstLogin}
          organizationName={session.organizationName}
          recentSignals={recentPathSignals}
          role={session.role}
        />
      </div>
      <HomeOperatingRailPanel rail={operatingRail} />
      <WorkspaceLaunchpad role={session.role} />
    </div>
  );
}
