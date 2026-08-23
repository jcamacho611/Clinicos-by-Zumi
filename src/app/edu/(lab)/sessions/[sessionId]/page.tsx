import Link from "next/link";
import { notFound } from "next/navigation";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { WorkforceAttendanceManager } from "@/components/edu/workforce-attendance-manager";
import { db } from "@/lib/db";
import { canVerifyWorkforceAttendance } from "@/lib/edu/workforce-delivery-records";
import { listSessionAttendance, listWorkforceSessions } from "@/lib/edu/workforce-delivery-repository";
import { resolveEduIdentity } from "@/lib/edu/edu-session";

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

  const attendanceByEnrollment = new Map(attendance.map((record) => [record.enrollmentId, record]));

  return (
    <>
      <EduCommandHeader
        eyebrow={`${session.deliveryMode.replaceAll("_", " ")} · ${session.status}`}
        title={session.title}
        description={`${cohort.course.title} · ${cohort.name}. Attendance shown here is evidence for this specific live session, not a proxy derived from enrollment or login.`}
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
          roster={cohort.enrollments.map((enrollment) => {
            const record = attendanceByEnrollment.get(enrollment.id);
            return {
              enrollmentId: enrollment.id,
              name: enrollment.studentDisplayName || enrollment.studentEmail,
              email: enrollment.studentEmail,
              status: enrollment.status,
              attendance: record ? {
                status: record.status,
                evidenceSource: record.evidenceSource,
                verifiedAt: record.verifiedAt?.toISOString() ?? null,
                minutesPresent: record.minutesPresent,
                evidenceNote: record.evidenceNote,
              } : null,
            };
          })}
        />
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[#f8efed]">{value}</p>
    </div>
  );
}
