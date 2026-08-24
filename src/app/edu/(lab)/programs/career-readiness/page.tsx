import Link from "next/link";

import { EduCommandHeader } from "@/components/edu/edu-shell";
import { careerReadinessWorkshop } from "@/lib/edu/workforce-ai-program";

export default function EduCareerReadinessPage() {
  const workshop = careerReadinessWorkshop;

  return (
    <>
      <EduCommandHeader
        description="A reusable two-to-three-hour live workshop for responsible, truthful AI-assisted job search and employment readiness."
        eyebrow="AI-Powered Career Readiness"
        title={workshop.label}
      />
      <div className="px-5 py-6 sm:px-8">
        <section className="border border-[#e28b85]/14 bg-[#12090b]/55 p-5 sm:p-7" aria-labelledby="career-overview">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#efaaa1]">Reusable workforce workshop</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <h2 className="text-xl font-semibold text-[#f8efed]" id="career-overview">What participants practice</h2>
              <ul className="mt-4 grid gap-3">
                {workshop.module.objectives.map((objective) => (
                  <li className="border-l-2 border-[#e6817b]/45 pl-4 text-sm leading-6 text-[#bca5a1]" key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
            <dl className="grid content-start gap-3 text-xs">
              <div className="border-b border-[#e28b85]/10 pb-3"><dt className="text-[#8f7773]">Duration</dt><dd className="mt-1 font-semibold text-[#f8efed]">{workshop.durationHours.min}–{workshop.durationHours.max} hours</dd></div>
              <div className="border-b border-[#e28b85]/10 pb-3"><dt className="text-[#8f7773]">Delivery</dt><dd className="mt-1 font-semibold text-[#f8efed]">Live remote · in person · hybrid</dd></div>
              <div><dt className="text-[#8f7773]">Final responsibility</dt><dd className="mt-1 leading-5 text-[#f8efed]">Learner + instructor human review</dd></div>
            </dl>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="activities-title">
          <h2 className="text-lg font-semibold text-[#f8efed]" id="activities-title">Hands-on activities</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workshop.module.activities.map((activity) => (
              <article className="border border-[#e28b85]/12 bg-[#0d0708]/70 p-5" key={activity.key}>
                <h3 className="text-sm font-semibold text-[#fff8f6]">{activity.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#a98f8b]">{activity.purpose}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.12em] text-[#8f7773]">Must not do</p>
                <ul className="mt-2 grid gap-1 text-xs leading-5 text-[#bca5a1]">
                  {activity.prohibited.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Career readiness completion and authority">
          <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-[#f8efed]">Completion evidence</h2>
            <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#bca5a1]">
              {[
                "Verified participation in the required live session",
                "Completed truthful resume or job-search practice artifact",
                "Completed verification/privacy exercise",
                "Required assessment or instructor-reviewed activity",
                "Instructor confirmation of completion criteria",
              ].map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-[#f8efed]">Human-AI boundary</h2>
            <p className="mt-4 text-xs leading-6 text-[#efaaa1]">{workshop.module.authorityRule}</p>
            <p className="mt-3 text-xs leading-5 text-[#8f7773]">AI can improve truthful presentation. It cannot create work history, credentials, accomplishments, relationships, or employer facts that are not real.</p>
          </div>
        </section>

        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Career readiness actions">
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/programs">← All programs</Link>
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/sessions">Live delivery →</Link>
          <Link className="border border-[#e6817b]/30 px-4 py-2 text-xs font-semibold text-[#efaaa1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]" href="/edu/reports">Program evidence →</Link>
        </nav>
      </div>
    </>
  );
}
