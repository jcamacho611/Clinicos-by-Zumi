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
      <section className="mx-auto max-w-[1500px] px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-28 lg:pt-24">
        <CinematicReveal className="grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusPill status="Demo" /><StatusPill status="Manual fallback" /><StatusPill status="Human review required" /></div>
            <p className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-emerald-300">Private Workflow Demo & Cost Review</p>
            <h1 className="mt-5 max-w-5xl text-balance text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-7xl lg:text-[88px]">See what is stuck before it costs you.</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">A clinic-specific, synthetic workflow review for owners who need to see what Clinicos can control before they consider a deeper evaluation.</p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[.035] p-7 shadow-[0_35px_100px_rgba(0,0,0,.35)] sm:p-9">
            <div className="flex items-end justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Private review</p><p className="mt-2 text-6xl font-black tracking-[-.07em]">$500</p></div><Clock3 className="size-9 text-emerald-300" strokeWidth={1.3} /></div>
            <p className="mt-6 border-l border-emerald-300/40 pl-4 text-sm leading-6 text-slate-300">The full fee is credited toward the Founding Clinic Evaluation if your clinic proceeds.</p>
            <a className="mt-7 flex h-13 items-center justify-center gap-2 rounded-2xl bg-white text-xs font-black text-slate-950 transition hover:bg-emerald-200" href="#reserve">Build my demo room <ArrowDown className="size-4" /></a>
            <p className="mt-4 text-center text-[10px] leading-5 text-slate-600">Payment connection pending. A human will qualify the clinic and send a manual payment link.</p>
          </div>
        </CinematicReveal>

        <CinematicReveal className="mt-20 grid gap-px overflow-hidden rounded-[32px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4" delay={0.08}>
          {included.map(([Icon, title, body]) => <article className="bg-[#080c11] p-6 sm:p-7" key={title}><Icon className="size-5 text-cyan-300" /><h2 className="mt-7 text-sm font-black">{title}</h2><p className="mt-3 text-xs leading-6 text-slate-500">{body}</p></article>)}
        </CinematicReveal>

        <CinematicReveal className="mt-20 grid gap-6 lg:grid-cols-2" delay={0.12}>
          <section className="rounded-[30px] border border-white/10 bg-white/[.025] p-7 sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Included</p>
            <div className="mt-6 space-y-4">{["Private workflow review", "Synthetic scenario prepared around selected pain points", "Controlled ClinicOS walkthrough", "Current software and operational cost discussion", "Draft recap with human review", "Recommendation for the next safe step"].map((item) => <div className="flex items-start gap-3 text-sm text-slate-300" key={item}><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"><Check className="size-3" /></span>{item}</div>)}</div>
          </section>
          <section className="rounded-[30px] border border-white/10 bg-white/[.025] p-7 sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-rose-300">Not included</p>
            <div className="mt-6 space-y-4">{["Production patient-data use", "Certified EHR or compliance certification", "Live clearinghouse, laboratory, payer, eRx, or payment settlement", "Autonomous clinical or financial decisions", "Guaranteed savings, revenue, coverage, or implementation"].map((item) => <div className="flex items-start gap-3 text-sm text-slate-400" key={item}><CircleOff className="mt-0.5 size-5 shrink-0 text-rose-300/70" />{item}</div>)}</div>
          </section>
        </CinematicReveal>

        <CinematicReveal className="mt-20 overflow-hidden rounded-[34px] border border-cyan-300/15 bg-[linear-gradient(120deg,rgba(34,211,238,.08),rgba(255,255,255,.025),rgba(16,185,129,.06))] p-7 sm:p-10 lg:p-12" delay={0.14}>
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Why the $500 fee exists</p><h2 className="mt-4 text-3xl font-black tracking-[-.05em]">Preparation is the product.</h2></div>
            <p className="text-base leading-8 text-slate-300">The private demo fee covers preparation of a clinic-specific workflow review, maintenance of the controlled demo environment, synthetic examples, AI/API usage, and the written recommendation.</p>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{["Workflow preparation", "Controlled environment", "Synthetic workspace", "AI/API usage", "Written recommendation"].map((item, index) => <div className="rounded-2xl border border-white/10 bg-black/15 p-4" key={item}><p className="text-[9px] font-black text-slate-600">0{index + 1}</p><p className="mt-4 text-xs font-bold text-slate-200">{item}</p></div>)}</div>
        </CinematicReveal>
      </section>

      <section className="border-y border-white/[.08] bg-black/20" id="reserve">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mb-10 max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">Reserve the review</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Give Clinicos the business problem. Keep patient data out.</h2></div>
          <SalesIntakeForm />
        </div>
      </section>

      <section className="mx-auto flex max-w-[1500px] flex-col gap-6 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">Need a deeper first step?</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">The $1,500 evaluation and $8,000 founding program are disclosed before you proceed.</h2></div>
        <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-black hover:border-white/30" href="/founding-clinic">Compare pathways <ArrowRight className="size-4" /></Link>
      </section>
    </SalesSiteShell>
  );
}
