import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenCheck, BrainCircuit, GraduationCap, ShieldCheck, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { curriculumPackages } from "@/lib/edu/edu-curriculum";
import { eduSimulationRoleCatalog } from "@/lib/edu/edu-roles";
import { CREDENTIAL_DISCLAIMER, SYNTHETIC_DATA_LABELS, SYNTHETIC_DATA_NOTICE } from "@/lib/edu/edu-safety";

/**
 * Public Klinikos EDU landing page.
 *
 * The curriculum, seats, and safety language are rendered from the same modules the
 * application enforces, so this page cannot advertise a package, a role, or a
 * boundary that the product does not actually implement.
 */

export const metadata = {
  title: "Klinikos EDU — Virtual Clinic Lab",
  description:
    "A synthetic, role-based clinic operations simulator for healthcare education. Students operate a simulated clinic using synthetic training data only.",
};

export default function KlinikosEduPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white" role="banner">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <div>
              <p className="text-sm font-extrabold tracking-[-.03em]">Klinikos EDU</p>
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Virtual Clinic Lab</p>
            </div>
          </Link>
          <Link className="ml-auto text-xs font-bold text-slate-600 hover:text-slate-950" href="/">Klinikos</Link>
          <Button asChild className="ml-4" size="sm"><Link href="/sales">Request an education pilot <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:py-28">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">
            <GraduationCap aria-hidden="true" className="size-4" /> Healthcare education, simulated safely
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-7xl">
            Learn healthcare operations by running them.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Students do not read about clinic operations. They take a seat — front desk, medical assistant, nurse, provider, biller,
            coder, practice manager, compliance officer — and work a real queue in a simulated clinic, on entirely synthetic data.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/edu/dashboard">Enter the lab <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="#curriculum">Explore curriculum</Link></Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-slate-500">
            <li className="flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="size-3.5 text-teal-700" /> Synthetic training data by default</li>
            <li className="flex items-center gap-1.5"><BadgeCheck aria-hidden="true" className="size-3.5 text-teal-700" /> Instructor-reviewed scenarios</li>
            <li className="flex items-center gap-1.5"><BookOpenCheck aria-hidden="true" className="size-3.5 text-teal-700" /> Role-based applied learning</li>
          </ul>
        </div>

        <div className="border-y border-slate-300 bg-white py-4">
          <div className="border-b border-slate-200 px-5 pb-4 sm:px-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Synthetic training environment</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">Student simulation workspace</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-[.9fr_1.1fr]">
            <div className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Assigned seat</p>
              <p className="mt-2 text-lg font-extrabold">Medical Assistant</p>
              <ol className="mt-5 space-y-3 text-xs leading-5 text-slate-600">
                <li>1. Confirm intake readiness</li>
                <li>2. Route abnormal result for provider review</li>
                <li>3. Close referral follow-up task</li>
                <li>4. Document escalation correctly</li>
              </ol>
            </div>
            <div className="p-5">
              <p className="flex items-center gap-3 text-sm font-extrabold">
                <Stethoscope aria-hidden="true" className="size-5 text-[#1e3a8a]" /> Scenario: Primary care follow-through
              </p>
              <p className="mt-4 text-xs leading-6 text-slate-600">
                A synthetic patient has an overdue referral, an abnormal A1C result and an insurance eligibility issue. Complete the
                operational workflow without crossing clinical-authority boundaries.
              </p>
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2 text-xs font-extrabold text-[#1e3a8a]">
                  <BrainCircuit aria-hidden="true" className="size-4" /> AI feedback
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Suggested feedback remains educational, labeled and instructor-reviewable. It does not diagnose, prescribe or certify
                  competency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="roles-heading" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Eight seats, one clinic</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl" id="roles-heading">Every student runs a real position.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              A scenario assigns each student a seat. The seat decides their work queue, the actions available to them, and the lens the
              rubric assesses them through. It grants nothing outside the simulation.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Simulation seats and their responsibilities</caption>
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-extrabold" scope="col">Seat</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Responsible for</th>
                  <th className="px-4 py-3 font-extrabold" scope="col">Assessed on</th>
                </tr>
              </thead>
              <tbody>
                {eduSimulationRoleCatalog.map((role) => (
                  <tr className="border-t border-slate-200 align-top" key={role.key}>
                    <th className="px-4 py-3 font-bold text-slate-950" scope="row">{role.label}</th>
                    <td className="px-4 py-3 leading-6 text-slate-600">{role.focus}</td>
                    <td className="px-4 py-3 text-[12px] leading-6 text-slate-500">
                      {role.competencyAreas.map((area) => area.replace(/_/g, " ")).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="curriculum-heading" className="mx-auto max-w-7xl px-5 py-16 sm:px-8" id="curriculum">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Curriculum-ready packages</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl" id="curriculum-heading">
            Turn healthcare operations into applied coursework.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Institutions can run a single package or assemble a semester. Each carries learning objectives, lessons, scenarios, rubrics,
            and completion tracking. Deployments remain synthetic-only and institutionally reviewed.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Curriculum packages</caption>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[.1em] text-slate-600">
              <tr>
                <th className="px-4 py-3 font-extrabold" scope="col">Package</th>
                <th className="px-4 py-3 font-extrabold" scope="col">Focus</th>
                <th className="px-4 py-3 font-extrabold" scope="col">Hours</th>
              </tr>
            </thead>
            <tbody>
              {curriculumPackages.map((entry) => (
                <tr className="border-t border-slate-200 align-top" key={entry.key}>
                  <th className="px-4 py-3 font-bold text-slate-950" scope="row">{entry.title}</th>
                  <td className="px-4 py-3 leading-6 text-slate-600">{entry.summary}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{entry.estimatedHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="safety-heading" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-[#9a7a1f]" />
            <div className="max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-[-.04em]" id="safety-heading">What Klinikos EDU is not</h2>
              <ul aria-label="Data classification" className="mt-5 flex flex-wrap gap-2">
                {SYNTHETIC_DATA_LABELS.map((label) => (
                  <li className="border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-amber-900" key={label}>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-7 text-slate-600">{SYNTHETIC_DATA_NOTICE}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{CREDENTIAL_DISCLAIMER}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                AI in Klinikos EDU drafts scenarios and educational feedback for a human to review. It does not diagnose, prescribe,
                certify competency, grant scope of practice or licensure, submit claims, or authorize care. Instructor review is
                authoritative for every grade and every competency determination.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-8 border-y border-slate-300 py-10 lg:grid-cols-[1fr_.8fr] lg:items-center">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">For schools and workforce programs</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em]">A clinic simulator, not another slideshow.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Students practice role ownership, evidence, sequencing, escalation and documentation. Instructors retain control over
                scenarios, rubrics and final evaluation.
              </p>
            </div>
            <div className="lg:text-right">
              <Button asChild size="lg"><Link href="/sales">Discuss a Klinikos EDU pilot <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-[11px] font-bold">
            <Link className="text-slate-700 hover:text-slate-950" href="/edu/dashboard">Enter the lab</Link>
            <Link className="text-slate-700 hover:text-slate-950" href="/legal/privacy">Privacy notice</Link>
            <Link className="text-slate-700 hover:text-slate-950" href="/legal/terms">Terms</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
