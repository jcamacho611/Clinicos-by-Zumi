import Link from "next/link";
import { notFound } from "next/navigation";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { WorkforceAttendanceManager } from "@/components/edu/workforce-attendance-manager";
import { WorkforceFeedbackForm } from "@/components/edu/workforce-feedback-form";
import { WorkforceKnowledgeAssessmentManager } from "@/components/edu/workforce-knowledge-assessment-manager";
import { db } from "@/lib/db";
import { canVerifyWorkforceAttendance } from "@/lib/edu/workforce-delivery-records";
import { listSessionAttendance, listWorkforceSessions } from "@/lib/edu/workforce-delivery-repository";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { canSubmitWorkforceFeedback } from "@/lib/edu/workforce-feedback";

export const dynamic = "force-dynamic";

export default async function EduSessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) return null;
  const { sessionId } = await params;

  const sessions = await listWorkforceSessions(identity);
  const session = sessions.find((entry) => entry.id === sessionId);
  if (!session) notFound();

  const [cohort, attendance] = await Promise.all([
    db.educationCohort.findFirst({
      where: { id: session.cohortId, institutionId: identity.institutionId },
      select: {
        id: true,
        name: true,
        courseId: true,
        course: { select: { title: true } },
        enrollments: {
          where: { status: { in: ["invited", "active", "completed"] } },
          select: { id: true, studentDisplayName: true, studentEmail: true, status: true },
          orderBy: [{ studentDisplayName: "asc" }, { studentEmail: "asc" }],
        },
      },
    }),
    listSessionAttendance(identity, session.id),
  ]);
  if (!cohort) notFound();

  /* Roster rows carry a participant's name, email and attendance evidence — peer PII and
     an educational record. Teaching staff need the whole cohort to run a session; a
     participant needs only their own row. Without this narrowing, any student who could
     open a session in their own cohort read the entire roster.

     The filter is applied to what was loaded rather than to what is rendered: hiding rows
     in markup would still ship every classmate's email to the browser. */
  const isTeachingStaff = canVerifyWorkforceAttendance(identity.role);
  const visibleEnrollments = isTeachingStaff
    ? cohort.enrollments
    : cohort.enrollments.filter((enrollment) => enrollment.id === identity.enrollmentId);

  const attendanceByEnrollment = new Map(attendance.map((record) => [record.enrollmentId, record]));
  const roster = visibleEnrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    name: enrollment.studentDisplayName || enrollment.studentEmail,
    email: enrollment.studentEmail,
    status: enrollment.status,
    attendance: attendanceByEnrollment.get(enrollment.id) ?? null,
  }));

  return (
    <>
      <EduCommandHeader
        eyebrow={`${session.deliveryMode.replaceAll("_", " ")} · ${session.status}`}
        title={session.title}
        description={`${cohort.course.title} · ${cohort.name}. Attendance and assessment evidence shown here are tied to this specific instructor-led session rather than inferred from enrollment or login.`}
        actions={<Link className="border border-[#e6817b]/30 px-3 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/sessions">All sessions</Link>}
      />
      <div className="px-5 py-6 sm:px-8">
        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Session provenance">
          <Fact label="Starts" value={new Date(session.startsAt).toLocaleString()} />
          <Fact label="Ends" value={new Date(session.endsAt).toLocaleString()} />
          <Fact label="Curriculum" value={session.curriculumVersion ?? "Not recorded"} />
          <Fact label="Materials" value={session.materialVersion ?? "Not recorded"} />
        </section>
        <WorkforceAttendanceManager
          canVerify={canVerifyWorkforceAttendance(identity.role)}
          sessionId={session.id}
          roster={roster.map((item) => ({
            enrollmentId: item.enrollmentId,
            name: item.name,
            email: item.email,
            status: item.status,
            attendance: item.attendance ? {
              status: item.attendance.status,
              evidenceSource: item.attendance.evidenceSource,
              verifiedAt: item.attendance.verifiedAt?.toISOString() ?? null,
              minutesPresent: item.attendance.minutesPresent,
              evidenceNote: item.attendance.evidenceNote,
            } : null,
          }))}
        />
        {(identity.role === "edu_admin" || identity.role === "edu_instructor") && (
          <WorkforceKnowledgeAssessmentManager
            cohortId={cohort.id}
            courseId={cohort.courseId}
            sessionId={session.id}
            roster={roster.map((item) => ({ enrollmentId: item.enrollmentId, name: item.name, email: item.email }))}
          />
        )}
        {canSubmitWorkforceFeedback(identity.role) && identity.role !== "edu_student" && (
          <div className="mt-6">
            <WorkforceFeedbackForm participantMode={false} sessionId={session.id} />
          </div>
        )}
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[#f8efed]">{value}</p>
    </div>
  );
}
