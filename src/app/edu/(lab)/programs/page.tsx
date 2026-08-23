import Link from "next/link";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import {
  kentuckyAiWorkforceProgram,
  kentuckyCareerReadinessWorkshop,
  kentuckyIndustryPathways,
} from "@/lib/edu/kentucky-ai-workforce";

export default function EduProgramsPage() {
  return (
    <>
      <EduCommandHeader
        description="Reusable live instructor-led workforce programs assembled from Klinikos EDU curriculum, applied exercises, human review, completion evidence, and reporting."
        eyebrow="Institution"
        title="Programs"
      />
      <div className="px-5 py-6 sm:px-8">
        <section aria-labelledby="kentucky-program-title" className="border border-[#e28b85]/14 bg-[#12090b]/55 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Proposed demo template · not SCWDB-approved</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-.03em] text-[#fff8f6]" id="kentucky-program-title">
                {kentuckyAiWorkforceProgram.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#bca5a1]">
                Two live training services: a five-pathway AI Industry Accelerator and an AI-Powered Career Readiness workshop. The same reusable program architecture can be configured for future workforce boards, colleges, employers, and healthcare organizations.
              </p>
            </div>
            <dl className="grid min-w-[220px] gap-2 text-xs">
              <div className="flex justify-between gap-4 border-b border-[#e28b85]/10 pb-2"><dt className="text-[#8f7773]">Delivery</dt><dd className="font-semibold text-[#f8efed]">In person + live remote</dd></div>
              <div className="flex justify-between gap-4 border-b border-[#e28b85]/10 pb-2"><dt className="text-[#8f7773]">Industry pathways</dt><dd className="font-semibold text-[#f8efed]">5</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#8f7773]">Completion</dt><dd className="font-semibold text-[#f8efed]">Instructor confirmed</dd></div>
            </dl>
          </div>
        </section>

        <section aria-labelledby="accelerator-title" className="mt-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#e6817b]">Service A</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f8efed]" id="accelerator-title">AI Industry Accelerator</h2>
            <p className="mt-2 text-sm leading-6 text-[#9f8985]">Six to eight hours of live instruction with occupation-specific practice. Every pathway uses the same responsible-AI spine while changing the work context, authoritative sources, and human decision boundaries.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kentuckyIndustryPathways.map((pathway) => (
              <Link
                className="group border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 transition hover:border-[#e6817b]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6817b]"
                href={`/edu/programs/${pathway.key}`}
                key={pathway.key}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">6–8 hours · live instructor-led</p>
                <h3 className="mt-2 text-lg font-semibold text-[#fff8f6] group-hover:text-[#efaaa1]">{pathway.label}</h3>
                <p className="mt-3 text-xs leading-6 text-[#a98f8b]">{pathway.learningObjectives[0]}</p>
                <p className="mt-4 text-xs font-semibold text-[#efaaa1]">Open pathway →</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="career-title" className="mt-8 border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#e6817b]">Service B</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f8efed]" id="career-title">{kentuckyCareerReadinessWorkshop.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#a98f8b]">Two to three hours of practical job-search, resume, communication, interview, privacy, verification, and responsible after-hire AI use. AI may improve truthful material; it may not manufacture qualifications.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {kentuckyCareerReadinessWorkshop.module.activities.slice(0, 6).map((activity) => (
              <div className="border border-[#e28b85]/10 bg-[#12090b]/45 p-4" key={activity.key}>
                <h3 className="text-sm font-semibold text-[#f8efed]">{activity.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#8f7773]">{activity.purpose}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Program operations" className="mt-6 grid gap-4 lg:grid-cols-3">
          <Link className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/cohorts"><p className="text-sm font-semibold text-[#f8efed]">Cohorts & rosters</p><p className="mt-2 text-xs leading-5 text-[#8f7773]">Open the real institution-scoped cohort view.</p></Link>
          <Link className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/scenarios"><p className="text-sm font-semibold text-[#f8efed]">Applied scenarios</p><p className="mt-2 text-xs leading-5 text-[#8f7773]">Use synthetic role-based practice and instructor-controlled assignments.</p></Link>
          <Link className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/grading"><p className="text-sm font-semibold text-[#f8efed]">Instructor review</p><p className="mt-2 text-xs leading-5 text-[#8f7773]">Review submissions and release human-owned feedback and completion evidence.</p></Link>
        </section>
      </div>
    </>
  );
}
