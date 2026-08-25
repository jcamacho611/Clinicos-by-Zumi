import { ClinicFirstLoginLaunch } from "@/components/commercial/clinic-first-login-launch";
import { LivingHome } from "@/components/clinic/living-home";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { zumiGatewayStatus } from "@/features/zumi/providers";
import { getClinicLaunchBriefing } from "@/lib/commercial/clinic-launch-briefing";
import { canActOnClinicGridSignal, detectClinicGridSignals } from "@/lib/ecosystem/clinic-grid-bridge";
import { resolveEduGridReadiness } from "@/lib/ecosystem/edu-grid-bridge";
import { getHomeOperatingRail } from "@/lib/home/operating-rail";
import { presentPaths } from "@/lib/home/path-presentation-resolver";
import { resolvePathGuidanceList } from "@/lib/orchestration/path-guidance-engine";
import { listActivePathSnapshots } from "@/lib/orchestration/path-persistence-repository";
import { listRecentPathSignals } from "@/lib/orchestration/path-signal-repository";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

function roleDisplayName(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
  const operatingSignals = [
    `${activePaths.length} active ${activePaths.length === 1 ? "Path" : "Paths"}`,
    `${livingAppointments.length} loaded ${livingAppointments.length === 1 ? "visit" : "visits"}`,
    ...(gridSignals.length > 0
      ? [`${gridSignals.length} Grid ${gridSignals.length === 1 ? "signal" : "signals"}`]
      : []),
    gatewayStatus.available ? "Zumi connected" : "Deterministic command mode",
  ];

  return (
    <div className="unicorn-dashboard" data-klinikos-role={session.role}>
      <section className="unicorn-operating-context" aria-label="Current operating context">
        <div className="unicorn-operating-context__identity">
          <span className="unicorn-operating-context__kicker">Living Home</span>
          <strong>{session.organizationName}</strong>
          <span>{roleDisplayName(session.role)}</span>
        </div>
        <div className="unicorn-operating-context__signals" aria-label="Loaded operating context" role="group">
          {operatingSignals.map((signal) => (
            <span className="unicorn-context-chip" key={signal}>{signal}</span>
          ))}
        </div>
      </section>

      {verifiedFirstLogin && launchBriefing ? (
        <ClinicFirstLoginLaunch organizationName={session.organizationName} briefing={launchBriefing} />
      ) : null}

      <section className="unicorn-living-shell" aria-label="Klinikos Living Home">
        <LivingHome
          appointments={livingAppointments}
          canActOnGridSignals={canActOnClinicGridSignal(session)}
          canOpenPatientRecord={can(session.role, "patients", "read")}
          firstName={firstName}
          initialGuidance={pathGuidance}
          initialPathPresentations={presentPaths(activePaths)}
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
      </section>
    </div>
  );
}
