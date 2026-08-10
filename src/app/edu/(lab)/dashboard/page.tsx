import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";
import { isEduInstructorRole } from "@/lib/edu/edu-roles";

export const dynamic = "force-dynamic";

export default async function EduDashboardPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  const staff = isEduInstructorRole(identity.role);

  const [courses, cohorts, openSubmissions] = process.env.DATABASE_URL
    ? await Promise.all([
        db.educationCourse.count({ where: eduInstitutionFilter(identity) }),
        db.educationCohort.count({ where: eduInstitutionFilter(identity) }),
        db.educationSubmission.count({ where: { ...eduInstitutionFilter(identity), status: staff ? "submitted" : "in_progress" } }),
      ])
    : [0, 0, 0];

  return (
    <>
      <EduCommandHeader
        description={staff
          ? "Courses you run, cohorts in progress, and work waiting on your review."
          : "Your assigned coursework and the scenarios waiting for you."}
        eyebrow="Klinikos EDU"
        title={staff ? "Instructor dashboard" : "My lab"}
      />
      <div className="px-5 py-6 sm:px-8">
        <table className="w-full max-w-2xl border border-slate-200 bg-white text-left text-sm">
          <caption className="sr-only">Current EDU activity</caption>
          <tbody>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 font-semibold text-slate-600" scope="row">Courses</th>
              <td className="px-4 py-3 tabular-nums font-extrabold text-slate-950">{courses}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 font-semibold text-slate-600" scope="row">Cohorts</th>
              <td className="px-4 py-3 tabular-nums font-extrabold text-slate-950">{cohorts}</td>
            </tr>
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600" scope="row">
                {staff ? "Submissions awaiting grading" : "Scenarios in progress"}
              </th>
              <td className="px-4 py-3 tabular-nums font-extrabold text-slate-950">{openSubmissions}</td>
            </tr>
          </tbody>
        </table>
        {!identity.institutionId && (
          <div className="mt-6 max-w-2xl">
            <EduEmptyState
              detail="This account is not linked to an education institution yet. An administrator creates the institution before courses and cohorts can exist."
              title="No institution linked"
            />
          </div>
        )}
      </div>
    </>
  );
}
