import { redirect } from "next/navigation";
import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { isEduInstructorRole } from "@/lib/edu/edu-roles";
import { HUMAN_REVIEW_AUTHORITY } from "@/lib/edu/edu-safety";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduGradingPage() {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  if (!isEduInstructorRole(identity.role)) redirect("/edu/dashboard");

  const submissions = process.env.DATABASE_URL
    ? await db.educationSubmission.findMany({
        where: { ...eduInstitutionFilter(identity), status: { in: ["submitted", "returned"] } },
        orderBy: { submittedAt: "asc" },
        take: 200,
        select: {
          id: true, status: true, submittedAt: true, simulationRole: true,
          enrollment: { select: { studentDisplayName: true, studentEmail: true } },
          assignment: { select: { title: true } },
          grade: { select: { pointsAwarded: true, pointsPossible: true, releasedToStudent: true } },
        },
      })
    : [];

  return (
    <>
      <EduCommandHeader description="Submitted student work awaiting a human decision." eyebrow="Assessment" title="Grading queue" />
      <div className="px-5 py-6 sm:px-8">
        <p className="max-w-3xl border-l-2 border-white/15 pl-4 text-[12px] leading-6 text-slate-400">{HUMAN_REVIEW_AUTHORITY}</p>
        <div className="mt-6">
          {submissions.length ? (
            <div className="overflow-x-auto border border-white/10 bg-white/[.03]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Submissions awaiting grading</caption>
                <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-extrabold" scope="col">Student</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Assignment</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Seat</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Submitted</th>
                    <th className="px-4 py-3 font-extrabold" scope="col">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr className="border-t border-white/10" key={submission.id}>
                      <th className="px-4 py-3 font-bold text-white" scope="row">{submission.enrollment.studentDisplayName}</th>
                      <td className="px-4 py-3 text-slate-300">{submission.assignment.title}</td>
                      <td className="px-4 py-3 text-slate-400">{submission.simulationRole?.replace(/_/g, " ") ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{submission.submittedAt?.toISOString().slice(0, 10) ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {submission.grade ? `${submission.grade.pointsAwarded}/${submission.grade.pointsPossible}` : "Ungraded"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EduEmptyState detail="No submitted work is waiting. Submissions appear here once students submit a scenario." title="Grading queue is clear" />
          )}
        </div>
      </div>
    </>
  );
}
