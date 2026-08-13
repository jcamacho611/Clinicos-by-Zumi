import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeDollarSign, BrainCircuit, Check, CircleOff, Clock3, FileText, Workflow } from "lucide-react";
import { CinematicReveal } from "@/components/sales/cinematic-reveal";
import { SalesIntakeForm } from "@/components/sales/sales-intake-form";
import { SalesSiteShell } from "@/components/sales/sales-site-shell";
import { StatusPill } from "@/components/sales/status-pill";

const included = [
  [Workflow, "Clinic-specific workflow review", "We map one real operational pain point without collecting patient information."],
  [BrainCircuit, "Synthetic demo scenario", "Your clinic type and selected pain points shape a controlled fictional walkthrough."],
  [BadgeDollarSign, "Software and cost review", "We compare the workflow burden, current systems, and practical next-step options."],
  [FileText, "Written recommendation", "You receive a human-reviewed recap of what was shown, what remains manual, and what comes next."],
] as const;

export default function PrivateDemoPage() {
  return (
    <SalesSiteShell>
      <section className="mx-auto max-w-[1500px] px-5 pb-24 pt-24 sm:px-8 lg:px-12 lg:pb-36 lg:pt-32">
        <CinematicReveal className="grid gap-16 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusPill status="Demo" /><StatusPill status="Human review required" /></div>
            <p className="mt-10 text-[10px] font-black uppercase tracking-[.24em] text-emerald-300">Clinic Operating Analysis</p>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-7xl lg:text-[88px]">See what is stuck before it costs you.</h1>
            <p className="mt-8 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">A clinic-specific, synthetic workflow review for owners who want to see where work, follow-up, and revenue are leaking before they commit to a larger implementation.</p>
          </div>
          <div className="border-t border-white/12 pt-8 lg:pl-8">
            <div className="flex items-end justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Clinic Operating Analysis</p><p className="mt-3 text-6xl font-black tracking-[-.07em]">$500</p></div><Clock3 className="size-9 text-emerald-300" strokeWidth={1.3} /></div>
            <p className="mt-7 border-l border-emerald-300/40 pl-4 text-sm leading-7 text-slate-300">The full $500 is credited toward the Founding Clinic Evaluation if your clinic proceeds.</p>
            <a className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 transition hover:bg-emerald-200" href="#reserve">Start my analysis <ArrowDown className="size-4" /></a>
            <p className="mt-5 max-w-md text-[10px] leading-5 text-slate-600">Your clinic and selected offer are saved before GoDaddy opens. Opening the payment page never marks the purchase paid; Klinikos waits for verified or manually reconciled payment evidence.</p>
          </div>
        </CinematicReveal>

        <CinematicReveal className="mt-28 grid gap-x-10 gap-y-12 border-y border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-4" delay={0.08}>
          {included.map(([Icon, title, body]) => <article key={title}><Icon className="size-5 text-cyan-300" /><h2 className="mt-7 text-sm font-black">{title}</h2><p className="mt-3 text-xs leading-6 text-slate-500">{body}</p></article>)}
        </CinematicReveal>

        <CinematicReveal className="mt-28 grid gap-12 lg:grid-cols-2" delay={0.12}>
          <section>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Included</p>
            <div className="mt-7 space-y-5">{["Private workflow review", "Synthetic scenario prepared around selected pain points", "Controlled Klinikos walkthrough", "Current software and operational cost discussion", "Draft recap with human review", "Recommendation for the next safe step"].map((item) => <div className="flex items-start gap-3 text-sm text-slate-300" key={item}><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"><Check className="size-3" /></span>{item}</div>)}</div>
          </section>
          <section>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-rose-300">Not included</p>
            <div className="mt-7 space-y-5">{["Production patient-data use", "Certified EHR or compliance certification", "Live clearinghouse, laboratory, payer, eRx, or payment settlement", "Autonomous clinical or financial decisions", "Guaranteed savings, revenue, coverage, or implementation"].map((item) => <div className="flex items-start gap-3 text-sm text-slate-400" key={item}><CircleOff className="mt-0.5 size-5 shrink-0 text-rose-300/70" />{item}</div>)}</div>
          </section>
        </CinematicReveal>

        <CinematicReveal className="mt-28 border-y border-cyan-300/15 py-12" delay={0.14}>
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Why the $500 fee exists</p><h2 className="mt-4 text-3xl font-black tracking-[-.05em]">Preparation is the product.</h2></div>
            <p className="text-base leading-8 text-slate-300">The analysis fee covers preparation of a clinic-specific workflow review, maintenance of the controlled demo environment, synthetic examples, permitted AI/API usage, and the written recommendation.</p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">{["Workflow preparation", "Controlled environment", "Synthetic workspace", "AI/API usage", "Written recommendation"].map((item, index) => <div className="border-t border-white/10 pt-5" key={item}><p className="text-[9px] font-black text-slate-600">0{index + 1}</p><p className="mt-3 text-xs font-bold text-slate-200">{item}</p></div>)}</div>
        </CinematicReveal>
      </section>

      <section className="border-y border-white/[.08] bg-black/20" id="reserve">
        <div className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mb-14 max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">Start the analysis</p><h2 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-5xl">Give Klinikos the business problem. Keep patient data out.</h2><p className="mt-5 text-sm leading-7 text-slate-400">Choose the exact next step you want. Klinikos saves that selection first, then only opens a configured payment page when the amount and product match.</p></div>
          <SalesIntakeForm />
        </div>
      </section>

      <section className="mx-auto flex max-w-[1500px] flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-24">
        <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">Need a deeper first step?</p><h2 className="mt-3 max-w-4xl text-2xl font-black tracking-[-.04em]">The $1,500 evaluation and $8,000+ founding implementation pathway are disclosed before you proceed.</h2></div>
        <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-black hover:border-white/30" href="/founding-clinic">Compare pathways <ArrowRight className="size-4" /></Link>
      </section>
    </SalesSiteShell>
  );
}
