import { Dashboard } from "@/components/clinic/dashboard";
import { LivingHome } from "@/components/clinic/living-home";
import { PathSignals } from "@/components/clinic/path-signals";
import { WorkspaceLaunchpad } from "@/components/clinic/workspace-launchpad";
import { redirect } from "next/navigation";
import { requireClinicSession } from "@/lib/auth/session";
import { composeLivingHomeBriefing, type ContinueItem } from "@/lib/living-home/briefing";
import { listOperationalActions } from "@/lib/operations/followup-service";
import { resolvePathGuidanceList } from "@/lib/orchestration/path-guidance-engine";
import { listActivePathSnapshots } from "@/lib/orchestration/path-persistence-repository";
import { listRecentPathSignals } from "@/lib/orchestration/path-signal-repository";
import { resolvePathRuntime } from "@/lib/orchestration/path-engine";
import { getKlinikosPath } from "@/lib/paths/catalog";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const session = await requireClinicSession();
  if (session.role === "contractor") redirect("/grid");

  const [appointments, activePaths, recentPathSignals, operationalActions] = await Promise.all([
    listAppointmentsForOrganization(session.organizationId),
    listActivePathSnapshots(session),
    listRecentPathSignals(session),
    // The operational loop is the source of "what needs a person". It is read here
    // rather than swept, so opening home never mutates clinic state.
    listOperationalActions(session.organizationId).catch(() => []),
  ]);

  const pathGuidance = resolvePathGuidanceList(session, activePaths);
  const query = await searchParams;
  const seededDemo = session.organizationId === "org-bfm" || session.organizationId === "org-luxe";
  const firstName = session.name.split(/\s+/)[0] || "there";

  // Work already in motion, described the way a person would describe it rather than
  // by the name of the engine that tracks it.
  const continueItems: ContinueItem[] = activePaths
    .map((snapshot) => {
      const definition = getKlinikosPath(snapshot.pathId);
      if (!definition) return null;
      const runtime = resolvePathRuntime({ pathId: snapshot.pathId, snapshot });
      if (!runtime) return null;
      const percent = Math.round(runtime.progress * 100);
      // The guidance engine already works out the safest next step and why it is
      // blocked when it is. That sentence is more useful to a person than the goal
      // they typed, so it leads when it exists.
      const guidance = pathGuidance.find((entry) => entry.instanceId === snapshot.instanceId);
      const blocked = guidance?.state === "blocked" || guidance?.state === "review_required";
      return {
        id: snapshot.instanceId,
        kind: blocked ? "Waiting on something" : "In progress",
        title: definition.title,
        note: guidance?.reason || snapshot.goal,
        percent,
        progress: blocked ? (guidance?.title ?? "Needs attention") : `${percent}% complete`,
      };
    })
    .filter((item): item is ContinueItem => item !== null)
    .slice(0, 3);

  const briefing = composeLivingHomeBriefing({
    firstName,
    role: session.role,
    organizationName: session.organizationName,
    appointments,
    actions: operationalActions,
    continueItems,
  });

  return (
    <div className="space-y-20">
      <div>
        <LivingHome briefing={briefing} />
        <PathSignals signals={recentPathSignals} />
      </div>
      <section aria-labelledby="operations-heading" className="space-y-8">
        <div className="max-w-2xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">Operations</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]" id="operations-heading">The detail is here when you need it.</h2>
          <p className="mt-3 text-xs leading-6 text-[#0b1e3a]/52">Home keeps priorities and next actions first. Open the deeper clinic workspace when you need the full operational view.</p>
        </div>
        <Dashboard
          appointments={appointments}
          onboardingComplete={query.onboarding === "complete"}
          organizationName={session.organizationName}
          seededDemo={seededDemo}
        />
      </section>
      <WorkspaceLaunchpad role={session.role} />
    </div>
  );
}
