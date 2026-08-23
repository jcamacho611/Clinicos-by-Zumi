import Link from "next/link";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { kentuckyCredibility } from "@/lib/edu/kentucky-credibility";
import { kentuckyDemoKit } from "@/lib/edu/kentucky-demo-kit";

export default function EduDemoKitPage() {
  const kit = kentuckyDemoKit;
  const credibility = kentuckyCredibility;

  return (
    <>
      <EduCommandHeader
        description="Representative proposal and evaluator materials generated from the same responsible-AI program truth used by Klinikos EDU."
        eyebrow="Evaluator evidence"
        title="Demo kit"
      />
      <div className="px-5 py-6 sm:px-8">
        <section className="border border-[#e28b85]/18 bg-[#12090b]/65 p-5 sm:p-7" aria-labelledby="why-klinikos-title">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Why Klinikos</p>
          <h2 className="mt-3 max-w-4xl text-2xl font-semibold text-[#f8efed]" id="why-klinikos-title">Founder-led. Practitioner-informed. Built to be used, not merely presented.</h2>
          <p className="mt-4 max-w-5xl text-sm leading-7 text-[#bca5a1]">{credibility.positioning}</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Founder advantage</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f8efed]">{credibility.founder.headline}</h3>
              <p className="mt-3 text-sm leading-6 text-[#bca5a1]">{credibility.founder.summary}</p>
              <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#bca5a1]">
                {credibility.founder.proofPoints.map((point) => <li key={point}>• {point}</li>)}
              </ul>
            </article>

            <article className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Healthcare advantage</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f8efed]">{credibility.practitioner.headline}</h3>
              <p className="mt-3 text-sm leading-6 text-[#bca5a1]">{credibility.practitioner.summary}</p>
              <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#bca5a1]">
                {credibility.practitioner.proofPoints.map((point) => <li key={point}>• {point}</li>)}
              </ul>
            </article>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {credibility.differentiation.map((item) => (
              <article className="border border-[#e6817b]/16 bg-[#12090b]/45 p-4" key={item.label}>
                <h3 className="text-sm font-semibold text-[#efaaa1]">{item.label}</h3>
                <p className="mt-2 text-xs leading-5 text-[#a98f8b]">{item.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 border-l-2 border-[#e6817b]/45 pl-3 text-[11px] leading-5 text-[#8f7773]">{credibility.practitionerBoundary}</p>
        </section>

        <section className="mt-6 border border-[#e6817b]/20 bg-[#0d0708]/75 p-5 sm:p-7" aria-labelledby="evaluator-journey-title">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Live evaluator walkthrough</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f8efed]" id="evaluator-journey-title">One product story, from program configuration to completion evidence</h2>
            <p className="mt-3 text-sm leading-6 text-[#a98f8b]">Each step opens the real Klinikos EDU surface behind the claim. The walkthrough uses proposed/demo configuration and synthetic training data; it does not imply SCWDB approval, deployment, or participant outcomes.</p>
          </div>
          <ol className="mt-6 grid gap-3 lg:grid-cols-3">
            {kit.evaluatorJourney.map((step) => (
              <li className="border border-[#e28b85]/12 bg-[#12090b]/45 p-4" key={step.step}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Step {step.step}</span>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-[#e6817b]" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#f8efed]">{step.label}</h3>
                <p className="mt-2 min-h-20 text-xs leading-5 text-[#a98f8b]">{step.detail}</p>
                <Link className="mt-4 inline-flex border border-[#e6817b]/30 px-3 py-2 text-[11px] font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href={step.href}>Open evidence →</Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 border border-[#e28b85]/14 bg-[#12090b]/55 p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Proposed representative materials · not SCWDB-approved</p>
          <h2 className="mt-3 text-xl font-semibold text-[#f8efed]">Sample slide outline</h2>
          <ol className="mt-5 grid gap-2 md:grid-cols-2">
            {kit.slideOutline.map((slide, index) => (
              <li className="grid grid-cols-[34px_1fr] gap-2 border border-[#e28b85]/10 bg-[#0d0708]/60 p-3 text-xs leading-5 text-[#bca5a1]" key={slide}>
                <span className="font-semibold tabular-nums text-[#efaaa1]">{String(index + 1).padStart(2, "0")}</span>
                <span>{slide}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Participant activity and certificate">
          <article className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Participant activity</p>
            <h2 className="mt-2 text-lg font-semibold text-[#f8efed]">{kit.participantActivity.title}</h2>
            <p className="mt-2 text-xs text-[#efaaa1]">Role: {kit.participantActivity.role}</p>
            <p className="mt-4 text-sm leading-6 text-[#bca5a1]">{kit.participantActivity.task}</p>
            <p className="mt-4 border-l-2 border-[#e6817b]/45 pl-3 text-xs leading-5 text-[#8f7773]">{kit.participantActivity.dataBoundary}</p>
          </article>

          <article className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">Certificate specimen</p>
            <div className="mt-4 border border-[#efaaa1]/20 p-6 text-center">
              <p className="text-xs uppercase tracking-[.18em] text-[#8f7773]">Klinikos EDU</p>
              <h2 className="mt-4 text-2xl font-light text-[#fff8f6]">{kit.certificate.title}</h2>
              <p className="mt-2 text-sm text-[#efaaa1]">{kit.certificate.subtitle}</p>
              <p className="mx-auto mt-6 max-w-md text-xs leading-6 text-[#a98f8b]">{kit.certificate.disclaimer}</p>
            </div>
          </article>
        </section>

        <section className="mt-6" aria-labelledby="assessment-title">
          <h2 className="text-lg font-semibold text-[#f8efed]" id="assessment-title">Sample assessment items</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {kit.assessmentItems.map((item) => (
              <article className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5" key={item.type}>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8f7773]">{item.type.replaceAll("_", " ")}</p>
                <h3 className="mt-2 text-sm font-semibold text-[#f8efed]">{item.prompt}</h3>
                <p className="mt-3 text-xs leading-6 text-[#bca5a1]"><span className="font-semibold text-[#efaaa1]">Expected principle:</span> {item.expectedPrinciple}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 border border-[#e28b85]/12 bg-[#12090b]/45 p-5 sm:p-7" aria-labelledby="rubric-title">
          <h2 className="text-lg font-semibold text-[#f8efed]" id="rubric-title">Instructor rubric</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <caption className="sr-only">Common instructor-scored responsible AI rubric</caption>
              <thead className="text-[#8f7773]"><tr><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Domain</th><th className="border-b border-[#e28b85]/10 px-3 py-2" scope="col">Demonstrated behavior</th></tr></thead>
              <tbody>{kit.rubric.map((row) => <tr key={row.domain}><th className="border-b border-[#e28b85]/10 px-3 py-3 font-semibold text-[#f8efed]" scope="row">{row.domain}</th><td className="border-b border-[#e28b85]/10 px-3 py-3 leading-5 text-[#bca5a1]">{row.demonstrated}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_.8fr]" aria-label="Instructor guide and authority">
          <article className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-[#f8efed]">Instructor guide: {kit.instructorGuide.title}</h2>
            <p className="mt-2 text-xs text-[#8f7773]">{kit.instructorGuide.durationMinutes} minutes</p>
            <ol className="mt-4 grid gap-2 text-xs leading-5 text-[#bca5a1]">{kit.instructorGuide.agenda.map((item) => <li key={item}>• {item}</li>)}</ol>
          </article>
          <aside className="border border-[#e6817b]/20 bg-[#12090b]/45 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-[#f8efed]">Human–AI authority</h2>
            <p className="mt-4 text-xs leading-6 text-[#efaaa1]">{kit.authorityStatement}</p>
          </aside>
        </section>

        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Demo kit actions">
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/programs">Programs</Link>
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/zumi-practice?pathway=healthcare">Zumi practice</Link>
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/sessions">Sessions & attendance</Link>
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/grading">Instructor review</Link>
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/reports">Reports</Link>
        </nav>
      </div>
    </>
  );
}
