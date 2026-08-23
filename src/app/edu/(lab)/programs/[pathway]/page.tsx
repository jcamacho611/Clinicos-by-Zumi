import Link from "next/link";
import { notFound } from "next/navigation";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { getKentuckyIndustryPathway } from "@/lib/edu/kentucky-ai-workforce";

export default async function EduPathwayPage({ params }: { params: Promise<{ pathway: string }> }) {
  const { pathway: pathwayKey } = await params;
  const pathway = getKentuckyIndustryPathway(pathwayKey);
  if (!pathway) notFound();

  return (
    <>
      <EduCommandHeader
        description="A proposed live instructor-led occupational pathway built around responsible AI, applied practice, verification, human authority, and evidence of learning."
        eyebrow="AI Industry Accelerator"
        title={pathway.label}
      />
      <div className="px-5 py-6 sm:px-8">
        <section className="border border-[#e28b85]/14 bg-[#12090b]/55 p-5 sm:p-7" aria-labelledby="pathway-overview">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Proposed demo template · not SCWDB-approved</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <h2 className="text-xl font-semibold text-[#f8efed]" id="pathway-overview">Learning objectives</h2>
              <ul className="mt-4 grid gap-3">
                {pathway.learningObjectives.map((objective) => (
                  <li className="border-l-2 border-[#e6817b]/45 pl-4 text-sm leading-6 text-[#bca5a1]" key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
            <dl className="grid content-start gap-3 text-xs">
              <div className="border-b border-[#e28b85]/10 pb-3"><dt className="text-[#8f7773]">Duration</dt><dd className="mt-1 font-semibold text-[#f8efed]">{pathway.durationHours.minimum}–{pathway.durationHours.maximum} hours</dd></div>
              <div className="border-b border-[#e28b85]/10 pb-3"><dt className="text-[#8f7773]">Delivery</dt><dd className="mt-1 font-semibold text-[#f8efed]">Live remote · in person · hybrid</dd></div>
              <div><dt className="text-[#8f7773]">Final authority</dt><dd className="mt-1 leading-5 text-[#f8efed]">Human instructor and workplace-authorized personnel</dd></div>
            </dl>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]" aria-labelledby="exercise-title">
          <div className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#e6817b]">Hands-on activity</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f8efed]" id="exercise-title">{pathway.sampleExercise.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#a98f8b]">{pathway.sampleExercise.scenario}</p>
            <h3 className="mt-6 text-sm font-semibold text-[#f8efed]">Participant must</h3>
            <ol className="mt-3 grid gap-2">
              {pathway.sampleExercise.participantTasks.map((task, index) => (
                <li className="grid grid-cols-[28px_1fr] gap-2 text-xs leading-5 text-[#bca5a1]" key={task}><span className="font-semibold text-[#efaaa1]">{index + 1}.</span><span>{task}</span></li>
              ))}
            </ol>
          </div>

          <aside className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 sm:p-7" aria-labelledby="evidence-title">
            <h2 className="text-lg font-semibold text-[#f8efed]" id="evidence-title">Evidence & authority</h2>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-[#8f7773]">Evidence submitted</h3>
            <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#bca5a1]">
              {pathway.sampleExercise.evidence.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-[#8f7773]">Human authority boundary</h3>
            <p className="mt-3 text-xs leading-6 text-[#efaaa1]">{pathway.humanAuthorityBoundary}</p>
          </aside>
        </section>

        <section className="mt-6 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7" aria-labelledby="takeaway-title">
          <h2 className="text-lg font-semibold text-[#f8efed]" id="takeaway-title">Participant take-away</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {pathway.participantTakeaway.map((item) => <li className="border border-[#e28b85]/10 bg-[#12090b]/35 p-3 text-xs leading-5 text-[#bca5a1]" key={item}>{item}</li>)}
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
