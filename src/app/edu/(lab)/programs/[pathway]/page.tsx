import Link from "next/link";
import { notFound } from "next/navigation";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { industryAcceleratorPathways } from "@/lib/edu/workforce-ai-program";

export default async function EduPathwayPage({ params }: { params: Promise<{ pathway: string }> }) {
  const { pathway: pathwayKey } = await params;
  const pathway = industryAcceleratorPathways.find((entry) => entry.key === pathwayKey);
  if (!pathway) notFound();

  return (
    <>
      <EduCommandHeader
        description="A reusable live instructor-led occupational pathway built around responsible AI, applied practice, verification, human authority, and evidence of learning."
        eyebrow="AI Industry Accelerator"
        title={pathway.label}
      />
      <div className="px-5 py-6 sm:px-8">
        <section className="border border-[#e28b85]/14 bg-[#12090b]/55 p-5 sm:p-7" aria-labelledby="pathway-overview">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Reusable occupational pathway</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <h2 className="text-xl font-semibold text-[#f8efed]" id="pathway-overview">Learning objective</h2>
              <p className="mt-4 border-l-2 border-[#e6817b]/45 pl-4 text-sm leading-6 text-[#bca5a1]">{pathway.objective}</p>
              <h3 className="mt-6 text-sm font-semibold text-[#f8efed]">Practice contexts</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {pathway.operationalContexts.map((context) => <li className="border border-[#e28b85]/10 bg-[#0d0708]/45 p-3 text-xs leading-5 text-[#bca5a1]" key={context}>{context}</li>)}
              </ul>
            </div>
            <dl className="grid content-start gap-3 text-xs">
              <div className="border-b border-[#e28b85]/10 pb-3"><dt className="text-[#8f7773]">Duration</dt><dd className="mt-1 font-semibold text-[#f8efed]">6–8 hours</dd></div>
              <div className="border-b border-[#e28b85]/10 pb-3"><dt className="text-[#8f7773]">Delivery</dt><dd className="mt-1 font-semibold text-[#f8efed]">Live remote · in person · hybrid</dd></div>
              <div><dt className="text-[#8f7773]">Final authority</dt><dd className="mt-1 leading-5 text-[#f8efed]">Human instructor and workplace-authorized personnel</dd></div>
            </dl>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]" aria-labelledby="exercise-title">
          <div className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#e6817b]">Hands-on activity</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f8efed]" id="exercise-title">{pathway.appliedExercise.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#a98f8b]">Learners work with synthetic or approved practice materials, encounter an AI-supported draft that requires verification, and produce evidence showing what they checked, corrected, and escalated.</p>
            <h3 className="mt-6 text-sm font-semibold text-[#f8efed]">Participant must</h3>
            <ol className="mt-3 grid gap-2">
              {pathway.appliedExercise.participantTasks.map((task, index) => (
                <li className="grid grid-cols-[28px_1fr] gap-2 text-xs leading-5 text-[#bca5a1]" key={task}><span className="font-semibold text-[#efaaa1]">{index + 1}.</span><span>{task}</span></li>
              ))}
            </ol>
          </div>

          <aside className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 sm:p-7" aria-labelledby="evidence-title">
            <h2 className="text-lg font-semibold text-[#f8efed]" id="evidence-title">Evidence & authority</h2>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-[#8f7773]">Evidence submitted</h3>
            <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#bca5a1]">
              {pathway.appliedExercise.evidence.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-[#8f7773]">Human authority boundary</h3>
            <p className="mt-3 text-xs leading-6 text-[#efaaa1]">{pathway.humanAuthorityBoundary}</p>
          </aside>
        </section>

        <section className="mt-6 border border-[#e6817b]/18 bg-[#12090b]/55 p-5 sm:p-7" aria-labelledby="zumi-practice-callout">
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#efaaa1]">Klinikos Intelligence</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <h2 className="text-lg font-semibold text-[#f8efed]" id="zumi-practice-callout">Practice with Zumi before work is assessed</h2>
              <p className="mt-2 text-xs leading-6 text-[#a98f8b]">Learners can ask for coaching or critique of an AI output without handing Zumi the authority to complete assessed work. Instructor-assistance mode is separately role-gated and remains draft-only until a person reviews it.</p>
            </div>
            <Link className="border border-[#e6817b]/35 bg-[#e6817b]/10 px-4 py-2 text-xs font-semibold text-[#ffd0ca] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href={`/edu/zumi-practice?pathway=${pathway.key}`}>Open Zumi practice →</Link>
          </div>
        </section>

        <section className="mt-6 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="takeaway-title">
          <h2 className="text-lg font-semibold text-[#f8efed]" id="takeaway-title">Participant take-away</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "A repeatable verify-before-use workflow",
              "A role-specific human-authority checklist",
              "A safe prompting and minimum-disclosure reference",
              "The corrected applied-work artifact created during the session",
            ].map((item) => <li className="border border-[#e28b85]/10 bg-[#12090b]/35 p-3 text-xs leading-5 text-[#bca5a1]" key={item}>{item}</li>)}
          </ul>
        </section>

        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Pathway actions">
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/programs">← All programs</Link>
          {pathway.key === "healthcare" && <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/scenarios">Open Virtual Clinic scenarios →</Link>}
        </nav>
      </div>
    </>
  );
}
