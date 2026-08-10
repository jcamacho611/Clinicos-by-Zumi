import Link from "next/link";
import { ArrowRight, Crown, Handshake, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HumanReviewBanner, MissionPhaseProgress, NoPHINotice, ZumiBriefingPanel, ZumiCommandShell } from "@/components/command/zumi-command-shell";

export const metadata = {
  title: "Founding Clinic Qualification — Klinikos by Zumi",
  description: "The Klinikos pathway begins with a paid AI-assisted, specialist-reviewed Operational Audit, then offers qualified clinics an $8,000 Founding Clinic implementation.",
};

const auditTiers = [
  ["Solo / micro", "$750"],
  ["2–5 providers", "$1,250"],
  ["6–15 providers", "$2,500"],
  ["16–30 providers", "$4,000"],
  ["30+ / complex network", "$5,000+ custom"],
] as const;

const pathway = [
  { icon: Layers3, title: "Qualify", body: "Map provider scale, locations, cost stack, operating strain and reported leakage without collecting PHI." },
  { icon: Sparkles, title: "Audit", body: "AI/API analysis and a specialist review the operating case, software stack, workflow and financial signals." },
  { icon: Handshake, title: "Recommend", body: "The Clinic Operating Report says not qualified, qualified with conditions, or Founding Clinic qualified." },
  { icon: Crown, title: "Implement", body: "Qualified clinics may enter the $8,000 Founding Clinic implementation and separately scoped recurring platform relationship." },
] as const;

export default function FoundingClinicPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="founding-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-12 lg:py-24">
          <div>
            <MissionPhaseProgress current="offer" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#b89a5b]">Founding Clinic Qualification</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl" id="founding-heading">We earn the right to recommend Klinikos.</h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">The first product is the paid Klinikos Operational Audit. We use AI-assisted analysis and specialist labor to determine what is costing the clinic time and money, what may be leaking, what should stay connected, and whether implementation has a credible business case.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row"><Button asChild className="rounded-none bg-[#f1f0eb] text-[#0b1e3a] hover:bg-white" size="lg"><Link href="/sales">Start Clinic Operating Analysis <ArrowRight className="size-4" /></Link></Button><Button asChild className="rounded-none border border-white/20 bg-transparent text-slate-200 hover:bg-white/[.04] hover:text-white" size="lg" variant="secondary"><Link href="#pricing">See the pricing path</Link></Button></div>
          </div>
          <ZumiBriefingPanel active>Our Founder Promise is alignment: Klinikos should not become another bill sitting beside systems that already work. If the audit cannot establish a credible operating case, the recommendation should say so.</ZumiBriefingPanel>
        </div>
      </section>

      <section className="border-b border-white/10" id="pricing">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-12">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#43d9ff]">Commercial path</p>
          <div className="mt-6 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-2">
            <article className="bg-[#101720] p-7 sm:p-9">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#43d9ff]">01 / Paid qualification product</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.05em] text-white">Klinikos Operational Audit</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">A real standalone service covering AI/API analysis, specialist labor, software-cost review, workflow analysis, revenue-leakage investigation and the Clinic Operating Report.</p>
              <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">{auditTiers.map(([size, price]) => <div className="flex items-center justify-between gap-5 py-3" key={size}><dt className="text-[12px] text-slate-400">{size}</dt><dd className="text-sm font-extrabold text-white">{price}</dd></div>)}</dl>
              <p className="mt-5 text-[11px] leading-5 text-slate-500">The fee is based on reported provider scale and confirmed by a specialist before payment. The audit is not automatically credited against implementation because it has real delivery cost and standalone value.</p>
            </article>
            <article className="bg-[#0b1e3a] p-7 sm:p-9">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d9c59b]">02 / If the audit qualifies the clinic</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-.05em] text-white">Founding Clinic Implementation</h2>
              <p className="mt-4 text-6xl font-extrabold tracking-[-.07em] text-white">$8,000</p>
              <p className="mt-5 text-sm leading-7 text-slate-300">Implementation configures Klinikos around the approved operating model, maps roles and workflows, establishes the appropriate intelligence and automation, onboards the team, and plans the agreed migration and connections.</p>
              <div className="mt-7 border-t border-white/10 pt-5"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#b89a5b]">Recurring platform</p><p className="mt-2 text-sm leading-6 text-slate-300">Current package architecture starts at <strong className="text-white">$1,495/month</strong>. A common Command configuration is <strong className="text-white">$2,495/month</strong>. Usage, external vendor costs, integrations and expanded locations/providers are scoped separately.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-12">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#43d9ff]">The pathway</p>
          <ol className="mt-6 grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">{pathway.map((step, index) => <li className="bg-[#101720] p-7" key={step.title}><p className="text-[10px] font-extrabold tracking-[.16em] text-slate-600">0{index + 1}</p><step.icon aria-hidden="true" className="mt-7 size-5 text-[#43d9ff]" /><h3 className="mt-5 text-sm font-extrabold text-white">{step.title}</h3><p className="mt-2 text-[12px] leading-5 text-slate-400">{step.body}</p></li>)}</ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-8 border border-[#b89a5b]/30 bg-[#b89a5b]/[.06] p-7 sm:p-10 lg:grid-cols-[.9fr_1.1fr]">
          <div><ShieldCheck className="size-6 text-[#b89a5b]" /><p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#d9c59b]">The Klinikos Founder Promise</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-white">Do not add technology without a credible reason.</h2></div>
          <div className="space-y-4 text-sm leading-7 text-slate-300"><p>We built Klinikos from the operator side of the problem. A clinic can already be paying thousands every month for EHR, billing, scheduling, phones, coding, staffing and separate subscriptions while the owner still carries tedious administrative work after the last patient leaves.</p><p>We will not recommend replacing a working system merely to increase the Klinikos bill. The audit should show what can credibly be cut, captured, organized, assisted or connected before implementation is offered.</p><p>No savings or revenue outcome is guaranteed. Financial figures are tagged as verified, clinic-reported, estimated or unknown.</p></div>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2"><NoPHINotice /><HumanReviewBanner /></div>
        <div className="mt-10"><Button asChild className="rounded-none bg-[#1677a8] text-white hover:bg-[#1a84ba]" size="lg"><Link href="/sales">Build my operating map <ArrowRight className="size-4" /></Link></Button></div>
      </section>
    </ZumiCommandShell>
  );
}
