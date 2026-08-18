import { notFound } from "next/navigation";
import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { LabConsole } from "@/components/edu/lab-console";
import { db } from "@/lib/db";
import { projectScenarioForStudent, eduScenarioPayloadSchema } from "@/lib/edu/edu-scenario-rules";
import { SYNTHETIC_DATA_LABELS, SYNTHETIC_DATA_NOTICE } from "@/lib/edu/edu-safety";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

/**
 * Virtual Clinic Lab — split-view simulation workspace.
 *
 * The scenario is projected through projectScenarioForStudent, which is the only
 * function permitted to build a student-facing scenario view. The answer key,
 * expected sequence, and problem flags never reach this page.
 */
export default async function EduLabPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const identity = await resolveEduIdentity();
  if (!identity) return null;
  const { assignmentId } = await params;

  const assignment = process.env.DATABASE_URL
    ? await db.educationScenarioAssignment.findFirst({
        where: { id: assignmentId, ...eduInstitutionFilter(identity) },
        select: {
          id: true, title: true, instructions: true, status: true,
          scenario: { select: { title: true, summary: true, setting: true, difficulty: true, estimatedMinutes: true, payload: true } },
        },
      })
    : null;
  if (!assignment) notFound();

  // The student's own run, if they have started one. Scoped by their enrollment, so
  // this can only ever be their submission.
  const run = identity.enrollmentId
    ? await db.educationSubmission.findUnique({
        where: { assignmentId_enrollmentId: { assignmentId: assignment.id, enrollmentId: identity.enrollmentId } },
        select: { id: true, status: true },
      })
    : null;

  const parsed = eduScenarioPayloadSchema.safeParse(assignment.scenario.payload);
  if (!parsed.success) {
    return (
      <>
        <EduCommandHeader eyebrow="Virtual Clinic Lab" title={assignment.title} />
        <div className="px-5 py-6 sm:px-8">
          <EduEmptyState detail="This scenario's content did not pass validation and cannot be opened safely. Contact your instructor." title="Scenario unavailable" />
        </div>
      </>
    );
  }

  const view = projectScenarioForStudent({
    ...assignment.scenario,
    payload: parsed.data,
    simulationRole: identity.role === "edu_student" ? "front_desk" : "practice_manager",
  });

  return (
    <>
      <EduCommandHeader
        description={assignment.instructions ?? view.summary}
        eyebrow={`Virtual Clinic Lab · ${view.setting.replace(/_/g, " ")} · ${view.simulationRole.replace(/_/g, " ")}`}
        title={view.title}
      />
      <div className="grid gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="queue-heading">
          <h2 className="text-lg font-extrabold tracking-[-.03em]" id="queue-heading">Work queue</h2>
          <div className="mt-4">
            {view.tasks.length ? (
              <div className="overflow-x-auto border border-white/10 bg-white/[.03]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <caption className="sr-only">Tasks assigned to your seat</caption>
                  <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-extrabold" scope="col">Task</th>
                      <th className="px-4 py-3 font-extrabold" scope="col">Queue</th>
                      <th className="px-4 py-3 font-extrabold" scope="col">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.tasks.map((task) => (
                      <tr className="border-t border-white/10 align-top" key={task.key}>
                        <th className="px-4 py-3 font-bold text-white" scope="row">
                          {task.title}
                          {task.detail && <span className="mt-1 block text-[12px] font-normal leading-5 text-slate-400">{task.detail}</span>}
                        </th>
                        <td className="px-4 py-3 text-slate-400">{task.queue.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-slate-400">{task.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EduEmptyState detail="No tasks are routed to your seat in this scenario." title="Queue is empty" />
            )}
          </div>

          {identity.enrollmentId ? (
            <LabConsole
              assignmentId={assignment.id}
              initialRun={run ? { submissionId: run.id, status: run.status } : null}
              tasks={view.tasks.map((task) => ({ key: task.key, title: task.title, queue: task.queue }))}
            />
          ) : (
            <p className="mt-6 text-[12px] leading-5 text-slate-500">
              You are viewing this scenario without an enrollment, so no run can be recorded.
            </p>
          )}
        </section>

        <aside aria-labelledby="brief-heading" className="border-l border-white/10 pl-6">
          <h2 className="text-sm font-extrabold uppercase tracking-[.14em] text-slate-500" id="brief-heading">Scenario brief</h2>
          <ul aria-label="Data classification" className="mt-3 flex flex-wrap gap-1.5">
            {SYNTHETIC_DATA_LABELS.map((label) => (
              <li className="border border-[#e6c55b]/40 bg-[#e6c55b]/[.08] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#f0dda0]" key={label}>{label}</li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] leading-6 text-slate-300">{view.openingBrief}</p>
          <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Evidence timeline</h3>
          <ol className="mt-3 grid gap-3">
            {view.events.map((event) => (
              <li className="border-l-2 border-white/15 pl-3" key={event.key}>
                <p className="text-[12px] font-bold text-white">{event.label}</p>
                <p className="text-[11px] uppercase tracking-[.1em] text-slate-500">{event.type.replace(/_/g, " ")}</p>
                {event.detail && <p className="mt-1 text-[12px] leading-5 text-slate-400">{event.detail}</p>}
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-white/10 pt-4 text-[11px] leading-5 text-slate-500">{SYNTHETIC_DATA_NOTICE}</p>
        </aside>
      </div>
    </>
  );
}
