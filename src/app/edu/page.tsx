import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenCheck, BrainCircuit, GraduationCap, ShieldCheck, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";

const tracks = [
  ["Medical Office Operations", "Front desk, intake, scheduling, forms, follow-up and task ownership."],
  ["Billing & Claims Workflow", "Billing readiness, coding practice, claim preparation, denials and payment workflow."],
  ["Care Coordination", "Referrals, results, handoffs, escalation and closed-loop follow-through."],
  ["AI in Healthcare Operations", "Governed AI assistance, review boundaries, workflow intelligence and auditability."],
] as const;

export const metadata = {
  title: "Klinikos EDU — Virtual Clinic Lab",
  description: "A synthetic, role-based clinic operations simulator for healthcare education.",
};

export default function KlinikosEduPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <div>
              <p className="text-sm font-extrabold tracking-[-.03em]">Klinikos EDU</p>
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Virtual Clinic Lab</p>
            </div>
          </Link>
          <Link className="ml-auto text-xs font-bold text-slate-600 hover:text-slate-950" href="/">Klinikos</Link>
          <Button asChild className="ml-4" size="sm"><Link href="/sales">Request an education pilot <ArrowRight className="size-4" /></Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:py-28">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]"><GraduationCap className="size-4" /> Healthcare education, simulated safely</div>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-7xl">Learn healthcare operations by running them.</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Klinikos Virtual Clinic Lab gives students a synthetic clinic where they practice scheduling, intake, documentation, referrals, billing readiness, compliance workflows and AI-assisted operations without using real patient data.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/sales">Request an institutional pilot <ArrowRight className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="#curriculum">Explore curriculum</Link></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-teal-700" /> Synthetic training data by default</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-teal-700" /> Instructor-reviewed scenarios</span>
            <span className="flex items-center gap-1.5"><BookOpenCheck className="size-3.5 text-teal-700" /> Role-based applied learning</span>
          </div>
        </div>

        <div className="border-y border-slate-300 bg-white py-4">
          <div className="border-b border-slate-200 px-5 pb-4 sm:px-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Synthetic training environment</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">Student simulation workspace</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-[.9fr_1.1fr]">
            <div className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Assigned role</p>
              <p className="mt-2 text-lg font-extrabold">Medical Assistant</p>
              <div className="mt-5 space-y-3 text-xs leading-5 text-slate-600">
                <p>1. Confirm intake readiness</p>
                <p>2. Route abnormal result for provider review</p>
                <p>3. Close referral follow-up task</p>
                <p>4. Document escalation correctly</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3"><Stethoscope className="size-5 text-[#1e3a8a]" /><p className="text-sm font-extrabold">Scenario: Primary care follow-through</p></div>
              <p className="mt-4 text-xs leading-6 text-slate-600">A synthetic patient has an overdue referral, an abnormal A1C result and an insurance eligibility issue. Complete the operational workflow without crossing clinical-authority boundaries.</p>
              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#1e3a8a]"><BrainCircuit className="size-4" /> AI feedback</div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Suggested feedback remains educational, labeled and instructor-reviewable. It does not diagnose, prescribe or certify competency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white" id="curriculum">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">Curriculum-ready modules</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">Turn healthcare operations into applied coursework.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Institutions can use individual modules or assemble them into a semester experience. Initial deployments should remain synthetic-only and institutionally reviewed.</p>
          </div>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {tracks.map(([title, body], index) => (
              <div className="grid gap-3 py-5 sm:grid-cols-[80px_1fr_1.3fr] sm:items-center" key={title}>
                <span className="text-xs font-extrabold text-[#9a7a1f]">0{index + 1}</span>
                <h3 className="text-base font-extrabold">{title}</h3>
                <p className="text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 border-y border-slate-300 py-10 lg:grid-cols-[1fr_.8fr] lg:items-center">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9a7a1f]">For schools and workforce programs</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em]">A clinic simulator, not another slideshow.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Students practice role ownership, evidence, sequencing, escalation and documentation. Instructors retain control over scenarios, rubrics and final evaluation.</p></div>
          <div className="lg:text-right"><Button asChild size="lg"><Link href="/sales">Discuss a Klinikos EDU pilot <ArrowRight className="size-4" /></Link></Button></div>
        </div>
      </section>
    </main>
  );
}
