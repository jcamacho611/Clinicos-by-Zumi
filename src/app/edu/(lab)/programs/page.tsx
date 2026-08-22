import Link from "next/link";
import { EduCommandHeader } from "@/components/edu/edu-shell";
import { kentuckyHealthcareAiSessionSequence, kentuckyHealthcareAiWorkforceTemplate } from "@/lib/edu/kentucky-ai-workforce";

export default function EduProgramsPage() {
  const program = kentuckyHealthcareAiWorkforceTemplate;

  return (
    <>
      <EduCommandHeader
        description="Institution-level workforce pathways that assemble existing Klinikos EDU curriculum, live delivery, assessment, instructor review, and reporting without forking the product."
        eyebrow="Institution"
        title="Programs"
      />
      <main className="px-5 py-6 sm:px-8">
        <section className="border border-white/10 bg-white/[.03] p-5 sm:p-7" aria-labelledby="program-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-amber-200">Proposed demo template · not SCWDB-approved</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white" id="program-title">{program.label}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">{program.description}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-300">
              <p className="font-extrabold text-white">Delivery</p>
              <p className="mt-1">In person · live remote · hybrid</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <h3 className="text-sm font-extrabold text-white">Learning outcomes</h3>
              <ul className="mt-4 grid gap-3">
                {program.objectives.map((objective) => (
                  <li className="border-l-2 border-amber-200/50 pl-4 text-xs leading-6 text-slate-300" key={objective.key}>{objective.statement}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Completion rule</h3>
              <dl className="mt-4 grid gap-3 text-xs">
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Attendance target</dt><dd className="font-bold text-white">{program.completionRule.minimumAttendancePercent}%</dd></div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Instructor review</dt><dd className="font-bold text-white">Required</dd></div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-slate-400">Required modules</dt><dd className="font-bold text-white">All required modules</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Assessment evidence</dt><dd className="font-bold text-white">Pre/post + applied review</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-6 border border-white/10 bg-white/[.02] p-5 sm:p-7" aria-labelledby="sequence-title">
          <h2 className="text-lg font-extrabold text-white" id="sequence-title">Instructor-led demonstration sequence</h2>
          <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-400">This sequence is a reusable proposed pathway assembled from existing EDU content plus program-level modules. Instructors remain responsible for delivery, review, grading, and completion.</p>
          <ol className="mt-6 grid gap-3">
            {kentuckyHealthcareAiSessionSequence.map((session, index) => (
              <li className="grid gap-2 border border-white/10 bg-black/10 p-4 sm:grid-cols-[44px_1fr]" key={session.key}>
                <span className="text-xs font-extrabold tabular-nums text-amber-200">{String(index + 1).padStart(2, "0")}</span>
                <div><p className="text-sm font-bold text-white">{session.title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{session.emphasis}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3" aria-label="Program next steps">
          <Link className="border border-white/10 bg-white/[.03] p-5 hover:border-amber-200/30" href="/edu/cohorts"><p className="text-sm font-extrabold text-white">Cohorts</p><p className="mt-2 text-xs leading-5 text-slate-400">Open rosters, seats, and delivery groups.</p></Link>
          <Link className="border border-white/10 bg-white/[.03] p-5 hover:border-amber-200/30" href="/edu/scenarios"><p className="text-sm font-extrabold text-white">Virtual Clinic scenarios</p><p className="mt-2 text-xs leading-5 text-slate-400">Run synthetic role-based operational practice.</p></Link>
          <Link className="border border-white/10 bg-white/[.03] p-5 hover:border-amber-200/30" href="/edu/grading"><p className="text-sm font-extrabold text-white">Instructor review</p><p className="mt-2 text-xs leading-5 text-slate-400">Review submissions, rubrics, and completion evidence.</p></Link>
        </section>
      </main>
    </>
  );
}
