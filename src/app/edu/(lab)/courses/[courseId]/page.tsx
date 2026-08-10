import { notFound } from "next/navigation";
import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { getCurriculumPackage } from "@/lib/edu/edu-curriculum";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  const { courseId } = await params;

  // Institution scope is part of the lookup, so a course in another institution
  // resolves as not found rather than revealing that it exists.
  const course = process.env.DATABASE_URL
    ? await db.educationCourse.findFirst({
        where: { id: courseId, ...eduInstitutionFilter(identity) },
        select: {
          id: true, title: true, code: true, description: true, status: true, termLabel: true, curriculumPackageKey: true,
          cohorts: { select: { id: true, name: true, status: true, _count: { select: { enrollments: true } } }, orderBy: { name: "asc" } },
        },
      })
    : null;
  if (!course) notFound();

  const curriculum = getCurriculumPackage(course.curriculumPackageKey ?? "");

  return (
    <>
      <EduCommandHeader description={course.description ?? undefined} eyebrow={`${course.code} · ${course.status}`} title={course.title} />
      <div className="grid gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="cohorts-heading">
          <h2 className="text-lg font-extrabold tracking-[-.03em]" id="cohorts-heading">Cohorts</h2>
          <div className="mt-4">
            {course.cohorts.length ? (
              <div className="overflow-x-auto border border-white/10 bg-white/[.03]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <caption className="sr-only">Cohorts in this course</caption>
                  <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-extrabold" scope="col">Cohort</th>
                      <th className="px-4 py-3 font-extrabold" scope="col">Enrolled</th>
                      <th className="px-4 py-3 font-extrabold" scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.cohorts.map((cohort) => (
                      <tr className="border-t border-white/10" key={cohort.id}>
                        <th className="px-4 py-3 font-bold text-white" scope="row">{cohort.name}</th>
                        <td className="px-4 py-3 tabular-nums text-slate-300">{cohort._count.enrollments}</td>
                        <td className="px-4 py-3 text-slate-400">{cohort.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EduEmptyState detail="No cohorts have been opened for this course yet." title="No cohorts" />
            )}
          </div>
        </section>

        <aside aria-labelledby="curriculum-heading" className="border-l border-white/10 pl-6">
          <h2 className="text-sm font-extrabold uppercase tracking-[.14em] text-slate-500" id="curriculum-heading">Curriculum package</h2>
          {curriculum ? (
            <>
              <p className="mt-3 text-sm font-bold text-white">{curriculum.title}</p>
              <p className="mt-2 text-[12px] leading-6 text-slate-400">{curriculum.summary}</p>
              <h3 className="mt-5 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Learning objectives</h3>
              <ul className="mt-2 grid gap-1.5">
                {curriculum.learningObjectives.map((objective) => (
                  <li className="text-[12px] leading-5 text-slate-400" key={objective}>· {objective}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-[12px] leading-6 text-slate-400">This course is not linked to a curriculum package.</p>
          )}
        </aside>
      </div>
    </>
  );
}
