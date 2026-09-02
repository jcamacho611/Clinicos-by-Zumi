import Link from "next/link";
import { ArrowRight, BrainCircuit, Check, CircleOff, FileText, Workflow } from "lucide-react";
import { CinematicReveal } from "@/components/sales/cinematic-reveal";
import { SalesIntakeForm } from "@/components/sales/sales-intake-form";
import { SalesSiteShell } from "@/components/sales/sales-site-shell";
import { StatusPill } from "@/components/sales/status-pill";
import { parseFirstValueHandoffSearchParams } from "@/lib/sales/intake-handoff";

const included = [
  [Workflow, "Unfinished-work map", "We organize one real operating pressure point without collecting patient information."],
  [BrainCircuit, "Synthetic first-result preview", "Your organization type and selected pressure points shape a controlled fictional walkthrough."],
  [FileText, "Evidence boundary", "The result stays clearly synthetic until a real baseline and completion evidence are reviewed."],
] as const;

export const metadata = {
  title: "First Useful Result — Klinikos",
  description: "Give Klinikos the unfinished work, see a bounded synthetic first-result path, and discuss paid capability only after additional economic value is demonstrated.",
};

export default async function FirstValuePage({ searchParams }: { searchParams: Promise<{ clinic?: string | string[]; pain?: string | string[] }> }) {
  const initialContext = parseFirstValueHandoffSearchParams(await searchParams);

  return (
    <SalesSiteShell>
      <section className="mx-auto max-w-[1500px] px-5 pb-24 pt-24 sm:px-8 lg:px-12 lg:pb-32 lg:pt-32">
        <CinematicReveal className="grid gap-16 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusPill status="Demo" /><StatusPill status="Human review required" /></div>
            <p className="mt-10 text-[12px] font-black uppercase tracking-[.24em] text-[#efaaa1]">First useful result</p>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-7xl lg:text-[88px]">Start with the work that is still unfinished.</h1>
            <p className="mt-8 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">Klinikos begins by making one bounded piece of work easier to see, own, route, or complete. No payment is required here. Paid capability comes later only if the evidence shows additional economic value.</p>
          </div>
          <div className="border-t border-white/12 pt-8 lg:pl-8">
            <p className="text-[12px] font-black uppercase tracking-[.2em] text-slate-500">Commercial state</p>
            <p className="mt-3 text-4xl font-black tracking-[-.06em] text-white">Free first value</p>
            <p className="mt-7 border-l border-[#e6817b]/40 pl-4 text-sm leading-7 text-slate-300">No checkout, no automatic meeting, no production authority, and no claim that a synthetic result is a measured customer outcome.</p>
            <a className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 transition hover:bg-[#efaaa1]" href="#first-value">Show Klinikos the unfinished work <ArrowRight className="size-4" /></a>
          </div>
        </CinematicReveal>

        <CinematicReveal className="mt-24 grid gap-x-10 gap-y-12 border-y border-white/10 py-12 sm:grid-cols-3" delay={0.08}>
          {included.map(([Icon, title, body]) => <article key={title}><Icon className="size-5 text-[#efaaa1]" /><h2 className="mt-7 text-sm font-black">{title}</h2><p className="mt-3 text-xs leading-6 text-slate-500">{body}</p></article>)}
        </CinematicReveal>

        <CinematicReveal className="mt-24 grid gap-12 lg:grid-cols-2" delay={0.12}>
          <section>
            <p className="text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">What happens</p>
            <div className="mt-7 space-y-5">{["Capture the organization and unfinished-work category", "Generate a controlled synthetic scenario", "Create a named next action and evidence boundary", "Human-review the first-result hypothesis", "Measure before recommending expansion"].map((item) => <div className="flex items-start gap-3 text-sm text-slate-300" key={item}><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#e6817b]/10 text-[#efaaa1]"><Check className="size-3" /></span>{item}</div>)}</div>
          </section>
          <section>
            <p className="text-[12px] font-black uppercase tracking-[.2em] text-rose-300">What does not happen</p>
            <div className="mt-7 space-y-5">{["No PHI or patient-identifying data in this public flow", "No automatic payment request", "No automatic sales meeting", "No EHR replacement requirement", "No autonomous clinical or financial decision", "No guaranteed savings, revenue, placement, eligibility, or authority"].map((item) => <div className="flex items-start gap-3 text-sm text-slate-400" key={item}><CircleOff className="mt-0.5 size-5 shrink-0 text-rose-300/70" />{item}</div>)}</div>
          </section>
        </CinematicReveal>
      </section>

      <section className="border-y border-white/[.08] bg-black/20" id="first-value">
        <div className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mb-14 max-w-3xl"><p className="text-[12px] font-black uppercase tracking-[.22em] text-[#efaaa1]">First-value request</p><h2 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-5xl">Give Klinikos the business problem. Keep patient data out.</h2><p className="mt-5 text-sm leading-7 text-slate-400">The request creates a reviewable commercial record and synthetic scenario. It does not create a checkout, entitlement, regulated authority, or meeting commitment.</p></div>
          <SalesIntakeForm initialContext={initialContext} />
        </div>
      </section>

      <section className="mx-auto flex max-w-[1500px] flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-24">
        <div><p className="text-[12px] font-black uppercase tracking-[.2em] text-violet-300">What can come next?</p><h2 className="mt-3 max-w-4xl text-2xl font-black tracking-[-.04em]">A subscription, scoped service, implementation, Grid/EDU/Revenue capability, or enterprise path only when the first-result evidence and economic value justify it.</h2></div>
        <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-black hover:border-white/30" href="/pricing">Explore capabilities <ArrowRight className="size-4" /></Link>
      </section>
    </SalesSiteShell>
  );
}
