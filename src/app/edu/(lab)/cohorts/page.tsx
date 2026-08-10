import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduCohortsPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  const cohorts = process.env.DATABASE_URL
    ? await db.educationCohort.findMany({
        where: eduInstitutionFilter(identity),
        orderBy: [{ status: "asc" }, { name: "asc" }],
        take: 200,
        select: { id: true, name: true, status: true, maxSeats: true, course: { select: { code: true, title: true } }, _count: { select: { enrollments: true } } },
      })
    : [];

  return (
    <>
      <EduCommandHeader
        description="Cohort rosters. Enrollment, simulation-role assignment, and completion are tracked per cohort."
        eyebrow="Institution"
        title="Cohorts"
      />
      <div className="px-5 py-6 sm:px-8">
        {cohorts.length ? (
          <div className="overflow-x-auto border border-white/10 bg-white/[.03]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Cohorts</caption>
              <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-extrabold" scope="col">Cohort</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Course</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Enrolled</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Seats</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr className="border-t border-white/10" key={cohort.id}>
                    <th className="px-4 py-3 font-bold text-white" scope="row">{cohort.name}</th>
                    <td className="px-4 py-3 text-slate-300">{cohort.course.code} — {cohort.course.title}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">{cohort._count.enrollments}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-400">{cohort.maxSeats ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{cohort.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EduEmptyState detail="No cohorts have been opened for this institution's courses yet." title="No cohorts" />
        )}
      </div>
    </>
  );
}
