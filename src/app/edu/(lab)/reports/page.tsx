import Link from "next/link";

import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduReportsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  const [enrolled, completed, submissions, certificates] = process.env.DATABASE_URL
    ? await Promise.all([
        db.educationEnrollment.count({ where: eduInstitutionFilter(identity) }),
        db.educationEnrollment.count({ where: { ...eduInstitutionFilter(identity), completedAt: { not: null } } }),
        db.educationSubmission.count({ where: eduInstitutionFilter(identity) }),
        db.educationCertificate.count({ where: eduInstitutionFilter(identity) }),
      ])
    : [0, 0, 0, 0];

  const completionPercent = enrolled ? Math.round((completed / enrolled) * 10000) / 100 : 0;

  return (
    <>
      <EduCommandHeader
        description="Institution-scoped workforce delivery evidence. Only persisted program records are counted; enrollment is not treated as attendance and demo data is not presented as real performance."
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
                <Metric label="Completed" value={completed} detail="Enrollment records with persisted completion time" />
                <Metric label="Completion" value={`${completionPercent}%`} detail="Completed ÷ enrolled; not a learning-outcome claim" />
                <Metric label="Certificates" value={certificates} detail="Persisted completion certificates" />
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Evidence readiness">
              <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5">
                <h2 className="text-sm font-semibold text-[#f8efed]">Assessment workflow evidence</h2>
                <p className="mt-3 text-3xl font-light tabular-nums text-[#fff8f6]">{submissions}</p>
                <p className="mt-2 text-xs leading-5 text-[#8f7773]">Persisted scenario submissions across this institution. Final assessment interpretation remains instructor-controlled.</p>
              </div>
              <div className="border border-amber-200/20 bg-amber-200/[.035] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-amber-200">Delivery readiness gap</p>
                <h2 className="mt-2 text-sm font-semibold text-[#f8efed]">Attendance is not inferred</h2>
                <p className="mt-3 text-xs leading-6 text-[#bca5a1]">The current EDU schema does not expose a dedicated verified workshop-attendance record on this surface. Klinikos will not treat enrollment, invitation acceptance, login, or a submission as attendance. A contract-approved attendance/session evidence mechanism is required before production workforce delivery and participant-level invoicing.</p>
              </div>
            </section>

            <section className="mt-6 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="report-contract">
              <h2 className="text-lg font-semibold text-[#f8efed]" id="report-contract">SCWDB-ready reporting contract</h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-[#8f7773]">Once the final contract data dictionary is approved, this reporting layer is designed to add verified attendance, pathway, modality, required-assessment completion, pre/post comparison, participant survey results, instructor review, corrective actions, curriculum version, and upcoming schedule without inventing unavailable data.</p>
              <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#bca5a1] sm:grid-cols-2">
                <li>• attendance/completion records within the required reporting window</li>
                <li>• monthly aggregate performance report</li>
                <li>• pathway and live-remote/in-person distribution</li>
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
