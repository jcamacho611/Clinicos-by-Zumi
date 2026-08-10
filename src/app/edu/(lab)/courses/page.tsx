import Link from "next/link";
import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { getCurriculumPackage } from "@/lib/edu/edu-curriculum";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduCoursesPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  const courses = process.env.DATABASE_URL
    ? await db.educationCourse.findMany({
        where: eduInstitutionFilter(identity),
        orderBy: [{ status: "asc" }, { title: "asc" }],
        take: 200,
        select: { id: true, title: true, code: true, status: true, termLabel: true, curriculumPackageKey: true, _count: { select: { cohorts: true } } },
      })
    : [];

  return (
    <>
      <EduCommandHeader
        description="Every course this institution offers. A course instantiates a curriculum package; cohorts run inside it."
        eyebrow="Institution"
        title="Courses"
      />
      <div className="px-5 py-6 sm:px-8">
        {courses.length ? (
          <div className="overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Courses</caption>
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-extrabold" scope="col">Code</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Title</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Curriculum package</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Term</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Cohorts</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr className="border-t border-slate-200" key={course.id}>
                    <th className="px-4 py-3 font-bold text-slate-950" scope="row">
                      <Link className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900" href={`/edu/courses/${course.id}`}>
                        {course.code}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-slate-700">{course.title}</td>
                    <td className="px-4 py-3 text-slate-600">{getCurriculumPackage(course.curriculumPackageKey ?? "")?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{course.termLabel ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{course._count.cohorts}</td>
                    <td className="px-4 py-3 text-slate-600">{course.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EduEmptyState
            detail="No courses exist for this institution yet. An instructor or administrator creates one from a curriculum package."
            title="No courses"
          />
        )}
      </div>
    </>
  );
}
