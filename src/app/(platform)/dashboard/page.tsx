import { ClinicFirstLoginLaunch } from "@/components/commercial/clinic-first-login-launch";
import { LivingHome } from "@/components/clinic/living-home";
import { WorkspaceLaunchpad } from "@/components/clinic/workspace-launchpad";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { zumiGatewayStatus } from "@/features/zumi/providers";
import { getClinicLaunchBriefing } from "@/lib/commercial/clinic-launch-briefing";
import { canActOnClinicGridSignal, detectClinicGridSignals } from "@/lib/ecosystem/clinic-grid-bridge";
import { resolveEduGridReadiness } from "@/lib/ecosystem/edu-grid-bridge";
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
  const [appointments, activePaths, recentPathSignals, launchBriefing, rail, gridSignals, eduReadiness] = await Promise.all([
    listAppointmentsForOrganization(
      session.organizationId,
      session.role === "provider" ? { providerUserId: session.userId } : {},
    ),
    listActivePathSnapshots(session),
    listRecentPathSignals(session),
    launchRequested ? getClinicLaunchBriefing(session.organizationId) : Promise.resolve(null),
    getHomeOperatingRail(session),
    detectClinicGridSignals(session),
    resolveEduGridReadiness(session),
  ]);
  const livingAppointments = appointments.filter((appointment) => appointment.status !== "Cancelled");
  const pathGuidance = resolvePathGuidanceList(session, activePaths);
  const firstName = session.name.split(/\s+/)[0] || "there";
  const verifiedFirstLogin = Boolean(launchRequested && launchBriefing?.verifiedFirstLogin);

  // Home reports the real provider state rather than idling as if intelligence were
  // live. Only `available` and the operator-facing reason cross to the client — the
  // status object also names the selected adapter, which is deployment detail the
  // browser has no reason to receive.
  const gatewayStatus = zumiGatewayStatus();

  return (
    <div className="space-y-16">
      {verifiedFirstLogin && launchBriefing ? (
        <ClinicFirstLoginLaunch organizationName={session.organizationName} briefing={launchBriefing} />
      ) : null}
      <LivingHome
        appointments={livingAppointments}
        canActOnGridSignals={canActOnClinicGridSignal(session)}
        canOpenPatientRecord={can(session.role, "patients", "read")}
        firstName={firstName}
        initialGuidance={pathGuidance}
        initialPaths={activePaths}
        intelligence={{ available: gatewayStatus.available, detail: gatewayStatus.detail }}
        onboardingComplete={verifiedFirstLogin}
        eduReadiness={eduReadiness}
        gridSignals={gridSignals}
        opportunity={rail.opportunity}
        organizationName={session.organizationName}
        rail={rail.destinations}
        recentSignals={recentPathSignals}
        role={session.role}
      />
      <WorkspaceLaunchpad role={session.role} />
    </div>
  );
}
