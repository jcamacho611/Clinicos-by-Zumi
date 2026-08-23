import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { WorkforceSessionManager } from "@/components/edu/workforce-session-manager";
import { db } from "@/lib/db";
import { canManageWorkforceSession } from "@/lib/edu/workforce-delivery-records";
import { listWorkforceSessions } from "@/lib/edu/workforce-delivery-repository";
import { eduCohortFilter, eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduSessionsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  if (!identity.institutionId) {
    return (
      <>
        <EduCommandHeader eyebrow="Live delivery" title="Sessions" description="Schedule and evidence live instructor-led workforce training." />
        <div className="px-5 py-6 sm:px-8">
          <EduEmptyState title="No institution linked" detail="A workforce session must belong to an education institution and cohort so its attendance and completion evidence stay correctly scoped." />
        </div>
      </>
    );
  }

  const [sessions, cohorts] = await Promise.all([
    listWorkforceSessions(identity),
    db.educationCohort.findMany({
      where: { ...eduInstitutionFilter(identity), ...eduCohortFilter(identity) },
      select: { id: true, name: true, course: { select: { title: true } } },
      orderBy: { startsOn: "desc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <EduCommandHeader
        eyebrow="Live delivery"
        title="Sessions"
        description="One session is one scheduled instructor-led class. Session records anchor delivery mode, curriculum provenance, verified attendance, feedback, and contract reporting without confusing enrollment with attendance."
      />
      <div className="px-5 py-6 sm:px-8">
        <WorkforceSessionManager
          canManage={canManageWorkforceSession(identity.role)}
          cohorts={cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name, courseTitle: cohort.course.title }))}
          sessions={sessions}
        />
      </div>
    </>
  );
}
