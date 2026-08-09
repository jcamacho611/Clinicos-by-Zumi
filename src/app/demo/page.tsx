import Link from "next/link";
import { ArrowRight, CircleDollarSign, FileSearch, Network, Radar, ShieldCheck, Workflow } from "lucide-react";
import { CinematicReveal } from "@/components/sales/cinematic-reveal";
import { SalesSiteShell } from "@/components/sales/sales-site-shell";
import { StatusPill } from "@/components/sales/status-pill";

export default function DemoPage() {
  return (
    <SalesSiteShell>
      <section className="mx-auto max-w-[1500px] px-5 pb-24 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <CinematicReveal className="max-w-6xl">
          <div className="flex flex-wrap gap-2"><StatusPill status="Live" /><StatusPill status="Demo" /><StatusPill status="Manual fallback" /></div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">Clinic control made simple</p>
          <h1 className="mt-5 text-balance text-6xl font-black leading-[.92] tracking-[-.075em] sm:text-8xl lg:text-[104px]">Every workflow needs a next step.</h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-400">Clinicos helps clinics stop losing track of patients, paperwork, referrals, results, staff tasks, follow-ups, billing-readiness items, and revenue opportunities.</p>
          <div className="mt-10 flex flex-wrap gap-3"><Link className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs font-black text-slate-950 hover:bg-emerald-200" href="/private-demo">Reserve private demo <ArrowRight className="size-4" /></Link><Link className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-xs font-black hover:border-white/30" href="/sales">Qualify my clinic</Link></div>
        </CinematicReveal>

        <CinematicReveal className="relative mt-20 overflow-hidden rounded-[36px] border border-white/10 bg-[#090d12] p-5 shadow-[0_50px_160px_rgba(0,0,0,.5)] sm:p-8 lg:p-12" delay={0.1}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="grid gap-4 lg:grid-cols-[.75fr_1.25fr]">
            <div className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Owner signal</p><p className="mt-4 text-5xl font-black tracking-[-.06em]">12</p><p className="mt-2 text-sm font-bold">workflows need attention</p><div className="mt-8 space-y-3">{["Referral awaiting acknowledgment", "Result waiting for provider review", "Billing packet missing evidence", "Three leads without next action"].map((item, index) => <div className="flex items-center justify-between rounded-xl border border-white/[.07] bg-black/20 px-4 py-3 text-xs" key={item}><span className="text-slate-400">{item}</span><span className={index === 1 ? "text-rose-300" : "text-amber-200"}>{index === 1 ? "Provider" : "Staff"}</span></div>)}</div></div>
            <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.1),transparent_34%),#06090d] p-7">
              <div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/30 bg-emerald-300/[.07] shadow-[0_0_80px_rgba(16,185,129,.15)]" />
              <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#101821] text-center text-[10px] font-black uppercase tracking-[.13em] text-white">Your<br />clinic</div>
              {[["PT partner", "left-[10%] top-[20%]"], ["Imaging", "right-[8%] top-[16%]"], ["Staff tasks", "left-[8%] bottom-[14%]"], ["Billing", "right-[12%] bottom-[12%]"]].map(([label, position]) => <div className={`absolute ${position} rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-bold text-slate-300 shadow-xl`} key={label}>{label}<span className="mt-2 block text-[9px] text-cyan-300">Next action visible</span></div>)}
              <div className="absolute inset-x-7 bottom-7 flex items-center justify-between rounded-2xl border border-white/[.08] bg-black/30 px-4 py-3"><span className="text-[10px] font-bold text-slate-500">The clinic network, finally visible.</span><StatusPill status="Demo" /></div>
            </div>
          </div>
        </CinematicReveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-[32px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {[[Workflow, "Operating system"], [Network, "Connected network"], [Radar, "Grid marketplace"], [CircleDollarSign, "Revenue recovery"], [ShieldCheck, "Safe AI copilot"]].map(([Icon, label], index) => <div className="bg-[#070b10] p-6" key={label as string}><Icon className="size-5 text-cyan-300" /><p className="mt-9 text-[9px] font-black text-slate-600">0{index + 1}</p><p className="mt-2 text-sm font-black">{label as string}</p><p className="mt-3 text-xs leading-5 text-slate-500">{index < 2 ? "Working foundation with synthetic demonstration flows." : "Ordered build slice with truthful status boundaries."}</p></div>)}
        </div>

        <section className="mt-20 grid gap-6 rounded-[34px] border border-white/10 bg-white/[.025] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><FileSearch className="size-6 text-amber-200" /><h2 className="mt-6 text-3xl font-black tracking-[-.05em]">A sales demo is a product, not a screen share.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">We prepare a synthetic workflow, show the status of every component, map the clinic&apos;s actual gaps, and leave a human-reviewed recommendation.</p></div><Link className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs font-black text-slate-950 hover:bg-emerald-200" href="/private-demo">See the $500 review <ArrowRight className="size-4" /></Link></section>
      </section>
    </SalesSiteShell>
  );
}
