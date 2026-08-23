import Link from "next/link";

import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { getWorkforceDeliverySummary } from "@/lib/edu/workforce-delivery-repository";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduReportsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  const [enrolled, completed, submissions, certificates, delivery] = process.env.DATABASE_URL && identity.institutionId
    ? await Promise.all([
        db.educationEnrollment.count({ where: eduInstitutionFilter(identity) }),
        db.educationEnrollment.count({ where: { ...eduInstitutionFilter(identity), completedAt: { not: null } } }),
        db.educationSubmission.count({ where: eduInstitutionFilter(identity) }),
        db.educationCertificate.count({ where: eduInstitutionFilter(identity) }),
        getWorkforceDeliverySummary(identity),
      ])
    : [0, 0, 0, 0, { sessions: 0, attendanceRecords: 0, verifiedAttended: 0, verifiedAbsent: 0, unverifiedAttendance: 0, feedbackResponses: 0, curriculumVersions: 0 }];

  const completionPercent = enrolled ? Math.round((completed / enrolled) * 10000) / 100 : 0;

  return (
    <>
      <EduCommandHeader
        description="Institution-scoped workforce delivery evidence. Enrollment, attendance, completion, feedback, and curriculum provenance remain separate so reports do not manufacture outcomes."
        eyebrow="Program evidence"
        title="Reports"
        actions={<Link className="border border-[#e6817b]/30 px-3 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/programs">View programs</Link>}
      />
      <div className="px-5 py-6 sm:px-8">
        {!identity.institutionId ? (
          <EduEmptyState
            detail="Reports require an education institution context. Link this account to an institution before participant or program evidence can exist."
            title="No institution linked"
          />
        ) : (
          <>
            <section aria-labelledby="delivery-summary">
              <h2 className="text-lg font-semibold text-[#f8efed]" id="delivery-summary">Current persisted evidence</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Enrolled" value={enrolled} detail="Institution-scoped enrollment records" />
                <Metric label="Verified attended" value={delivery.verifiedAttended} detail="Present/partial records with explicit verification" />
                <Metric label="Completed" value={completed} detail="Persisted completion state; not attendance alone" />
                <Metric label="Completion" value={`${completionPercent}%`} detail="Completed ÷ enrolled; not a learning-outcome claim" />
              </div>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Delivery operations evidence">
              <Metric label="Sessions" value={delivery.sessions} detail="Scheduled or recorded instructional sessions" />
              <Metric label="Attendance records" value={delivery.attendanceRecords} detail={`${delivery.unverifiedAttendance} remain unverified`} />
              <Metric label="Feedback" value={delivery.feedbackResponses} detail="Persisted participant/instructor/employer/follow-up responses" />
              <Metric label="Curriculum versions" value={delivery.curriculumVersions} detail="Versioned teaching-material provenance" />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Assessment and completion evidence">
              <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5">
                <h2 className="text-sm font-semibold text-[#f8efed]">Assessment workflow evidence</h2>
                <p className="mt-3 text-3xl font-light tabular-nums text-[#fff8f6]">{submissions}</p>
                <p className="mt-2 text-xs leading-5 text-[#8f7773]">Persisted scenario submissions across this institution. Final assessment interpretation remains instructor-controlled.</p>
              </div>
              <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5">
                <h2 className="text-sm font-semibold text-[#f8efed]">Completion records</h2>
                <p className="mt-3 text-3xl font-light tabular-nums text-[#fff8f6]">{certificates}</p>
                <p className="mt-2 text-xs leading-5 text-[#8f7773]">Persisted certificates of completion. Certificates do not grant licensure, scope of practice, accreditation, or independent professional certification.</p>
              </div>
            </section>

            <section className="mt-6 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="report-contract">
              <h2 className="text-lg font-semibold text-[#f8efed]" id="report-contract">Institutional workforce reporting contract</h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-[#8f7773]">The reporting layer preserves separate evidence for enrollment, verified attendance, completion, assessments, surveys, and curriculum versions. Customer-specific data dictionaries, retention rules, transfer formats, and invoice fields are configured only after approval.</p>
              <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#bca5a1] sm:grid-cols-2">
                <li>• verified attendance and completion documentation</li>
                <li>• monthly aggregate performance reporting</li>
                <li>• pathway and delivery-modality distribution</li>
                <li>• assessment and practical-exercise evidence</li>
                <li>• participant feedback and instructor-effectiveness measures</li>
                <li>• issues, corrective action, and curriculum-version history</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">{label}</p>
      <p className="mt-2 text-3xl font-light tabular-nums text-[#fff8f6]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#8f7773]">{detail}</p>
    </div>
  );
}
