import { Dashboard } from "@/components/clinic/dashboard";
import { LivingHome } from "@/components/clinic/living-home";
import { PathSignals } from "@/components/clinic/path-signals";
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
    listAppointmentsForOrganization(session.organizationId),
    listActivePathSnapshots(session),
    listRecentPathSignals(session),
  ]);
  const pathGuidance = resolvePathGuidanceList(session, activePaths);
  const query = await searchParams;
  const seededDemo = session.organizationId === "org-bfm" || session.organizationId === "org-luxe";
  const firstName = session.name.split(/\s+/)[0] || "there";

  return (
    <div className="space-y-14">
      <div>
        <LivingHome firstName={firstName} initialPaths={activePaths} initialGuidance={pathGuidance} />
        <PathSignals signals={recentPathSignals} />
      </div>
      <section aria-labelledby="operations-heading" className="space-y-5">
        <div className="max-w-2xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">Operations</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]" id="operations-heading">Your clinic workspace, when you need the detail.</h2>
          <p className="mt-2 text-xs leading-6 text-[#0b1e3a]/52">Living Home keeps goals and next actions first. The operational dashboard remains available underneath for direct clinical and business work.</p>
        </div>
        <Dashboard
          appointments={appointments}
          onboardingComplete={query.onboarding === "complete"}
          organizationName={session.organizationName}
          seededDemo={seededDemo}
          userName={session.name}
        />
      </section>
      <WorkspaceLaunchpad role={session.role} />
    </div>
  );
}
