import Link from "next/link";
import { ArrowRight, Check, Network, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { canonicalCapabilityCount, clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";

const domains = [
  ["Clinical core", "Patients, encounters, documents and governed clinical workflows."],
  ["Front desk", "Scheduling, intake, communications and operational handoffs."],
  ["Revenue", "Eligibility, claims, follow-through and revenue recovery visibility."],
  ["Network + GRID", "Referrals, provider relationships, capacity and service access."],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f6f2] text-[#101713]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f5f6f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center px-5 sm:px-8 lg:px-12">
          <Link className="flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-black tracking-[-.04em]">KLINIKOS</p><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#607066]">Clinic operating intelligence</p></div></Link>
          <nav className="ml-auto hidden items-center gap-8 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#4f5b53] md:flex"><a href="#system">System</a><Link href="/capabilities">Capabilities</Link><Link href="/grid/join">GRID</Link><a href="#safety">Safety</a></nav>
          <Button asChild className="ml-5 rounded-full bg-[#101713] px-5 text-white hover:bg-black" size="sm"><Link href="/access">Enter Klinikos <ArrowRight className="size-4" /></Link></Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto min-h-[820px] max-w-[1440px] px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-24">
          <div className="absolute right-[-8%] top-12 h-[520px] w-[520px] rounded-full bg-[#c8f169]/25 blur-[110px]" />
          <div className="absolute left-[35%] top-[32%] h-[360px] w-[360px] rounded-full bg-[#73d7d0]/15 blur-[120px]" />
          <div className="relative grid items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
            <div className="max-w-[760px]">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.16em]"><span className="h-2 w-2 rounded-full bg-[#5e8f29] shadow-[0_0_0_5px_rgba(200,241,105,.3)]" /> Founding clinic access is open</div>
              <h1 className="text-balance text-[clamp(4rem,8vw,8.2rem)] font-black leading-[.82] tracking-[-.085em]">The clinic,<br/><span className="text-[#5f7928]">operating as one.</span></h1>
              <p className="mt-9 max-w-2xl text-balance text-lg font-medium leading-8 text-[#566159] sm:text-xl">Klinikos unifies care, operations, revenue, referrals and governed intelligence into one command layer for independent clinics.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="rounded-full bg-[#101713] px-7 text-white hover:bg-black"><Link href="/sales">Analyze my clinic <ArrowRight className="size-4" /></Link></Button><Button asChild size="lg" variant="secondary" className="rounded-full border-black/15 bg-white/60 px-7"><Link href="/private-demo">Explore the system</Link></Button></div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-bold text-[#647067]"><span className="flex items-center gap-2"><Check className="size-3.5" /> Human-governed intelligence</span><span className="flex items-center gap-2"><Check className="size-3.5" /> {clinicOsDayOneRegistry.length} operating domains</span><span className="flex items-center gap-2"><Check className="size-3.5" /> {canonicalCapabilityCount.toLocaleString()} capabilities tracked</span></div>
            </div>

            <div className="relative mx-auto w-full max-w-[680px]">
              <div className="absolute -inset-8 rounded-[48px] border border-black/[.05]" />
              <div className="relative overflow-hidden rounded-[34px] border border-black/10 bg-[#101713] p-6 text-white shadow-[0_50px_120px_rgba(20,35,26,.22)] sm:p-8">
                <div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#c8f169]">Klinikos command layer</p><h2 className="mt-2 text-2xl font-black tracking-[-.05em]">Good morning, Brooklyn.</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10"><Sparkles className="size-5 text-[#c8f169]" /></div></div>
                <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10">{[["18","Visits"],["03","Review"],["$8.4k","Claims"]].map(([v,l])=><div className="bg-[#152019] p-5" key={l}><p className="text-2xl font-black tracking-[-.05em]">{v}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.14em] text-white/45">{l}</p></div>)}</div>
                <div className="mt-5 rounded-2xl bg-[#c8f169] p-5 text-[#101713]"><div className="flex items-center gap-3"><ShieldCheck className="size-5"/><div><p className="text-xs font-black uppercase tracking-[.08em]">Zumi found 3 items needing review</p><p className="mt-1 text-[11px] font-semibold text-black/60">Nothing clinical moves without the right human decision.</p></div><ArrowRight className="ml-auto size-4"/></div></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/40">Next patient</p><p className="mt-3 text-sm font-black">Maya Thompson</p><p className="mt-1 text-[11px] text-white/50">Follow-up · 10:30 AM</p></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#c8f169]">Network signal</p><p className="mt-3 text-sm font-black">2 referral loops closing</p><p className="mt-1 text-[11px] text-white/50">Across connected partners</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="system" className="border-y border-black/10 bg-[#101713] text-white"><div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#c8f169]">One system. Four operating surfaces.</p><h2 className="mt-5 max-w-xl text-4xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">Less software.<br/>More clinic.</h2></div><div className="grid sm:grid-cols-2">{domains.map(([title,body],i)=><div className="border-t border-white/15 py-7 sm:p-7" key={title}><p className="text-[10px] font-black text-[#c8f169]">0{i+1}</p><h3 className="mt-5 text-xl font-black tracking-[-.04em]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-white/55">{body}</p></div>)}</div></div></div></section>

        <section id="safety" className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12"><div className="grid gap-12 border-b border-black/10 pb-24 lg:grid-cols-2"><div><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dce9a8]"><Stethoscope className="size-6" /></div><h2 className="mt-8 max-w-xl text-4xl font-black leading-[1] tracking-[-.055em] sm:text-5xl">Intelligence that knows where its authority ends.</h2></div><div className="flex items-end"><p className="max-w-xl text-base font-medium leading-8 text-[#59645c]">Zumi can surface context, detect operational gaps, prepare drafts and recommend next steps. Clinical judgment, sensitive revenue actions and regulated decisions stay governed by appropriately authorized people.</p></div></div>
          <div className="grid gap-6 pt-16 md:grid-cols-3">{[[ShieldCheck,"Governed","Human review is visible, explicit and built into risky workflows."],[Network,"Connected","External systems connect through controlled gateways instead of becoming another silo."],[Sparkles,"Contextual","Intelligence appears where work happens, with source and status made clear."]].map(([Icon,title,body])=>{const I=Icon as typeof ShieldCheck;return <div className="rounded-[28px] border border-black/10 bg-white/60 p-7" key={String(title)}><I className="size-5"/><h3 className="mt-8 text-lg font-black">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-[#667169]">{String(body)}</p></div>})}</div>
        </section>

        <section className="bg-[#c8f169]"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:px-12"><div><p className="text-[10px] font-black uppercase tracking-[.2em]">Founding clinic implementation</p><h2 className="mt-3 text-3xl font-black tracking-[-.055em] sm:text-5xl">See what your clinic is losing between systems.</h2></div><Button asChild size="lg" className="rounded-full bg-[#101713] px-7 text-white lg:ml-auto"><Link href="/sales">Request operating analysis <ArrowRight className="size-4"/></Link></Button></div></section>
      </main>
    </div>
  );
}
