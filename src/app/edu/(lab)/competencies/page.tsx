import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { allCompetencyAreas } from "@/lib/edu/edu-curriculum";
import { CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduCompetenciesPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  const records = process.env.DATABASE_URL
    ? await db.educationCompetency.findMany({
        where: {
          ...eduInstitutionFilter(identity),
          ...(identity.role === "edu_student" && identity.enrollmentId ? { enrollmentId: identity.enrollmentId } : {}),
        },
        take: 500,
        select: { competencyArea: true, status: true, enrollment: { select: { studentDisplayName: true } } },
      })
    : [];

  return (
    <>
      <EduCommandHeader
        description="Competency determinations recorded by instructors. Nothing here is set by an automated process."
        eyebrow="Assessment"
        title="Competency matrix"
      />
      <div className="px-5 py-6 sm:px-8">
        {records.length ? (
          <div className="overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full min-w-[620px] text-left text-sm">
              <caption className="sr-only">Competency determinations</caption>
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-extrabold" scope="col">Student</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Competency area</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Determination</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr className="border-t border-slate-200" key={`${record.competencyArea}-${index}`}>
                    <th className="px-4 py-3 font-bold text-slate-950" scope="row">{record.enrollment.studentDisplayName}</th>
                    <td className="px-4 py-3 text-slate-700">{record.competencyArea.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-slate-600">{record.status.replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EduEmptyState
            detail={`No competency determinations have been recorded yet. The launch curriculum tracks ${allCompetencyAreas().length} competency areas.`}
            title="No determinations recorded"
          />
        )}
        <p className="mt-6 max-w-3xl border-t border-slate-200 pt-5 text-[11px] leading-5 text-slate-500">{CREDENTIAL_DISCLAIMER}</p>
      </div>
    </>
  );
}
