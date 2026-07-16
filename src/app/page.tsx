import Link from "next/link";
import { ArrowRight, Check, LogIn, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canonicalCapabilityCount, clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";

export default function LandingPage() {
  return (
    <div className="min-h-screen soft-orbit clinical-grid">
      <header className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <BrandMark />
          <div><p className="text-sm font-extrabold tracking-[-.03em] text-slate-950">ClinicOS</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">by Zumi</p></div>
        </Link>
        <nav className="ml-auto hidden items-center gap-7 text-xs font-bold text-slate-600 md:flex">
          <a href="#platform">Platform</a><Link href="/capabilities">Capabilities</Link><a href="#safety">Safety</a><a href="#integrations">Integrations</a>
        </nav>
        <Link className="ml-4 hidden text-xs font-extrabold text-slate-700 hover:text-slate-950 sm:block" href="/login">Sign in</Link>
        <Button asChild className="ml-4" size="sm"><Link href="/start">Start free <ArrowRight className="size-4" /></Link></Button>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:py-20">
          <div>
            <Badge className="mb-7 bg-white/80" tone="teal"><Sparkles className="mr-1.5 size-3" /> Founding clinic offer · no credit card</Badge>
            <h1 className="max-w-[720px] text-balance text-5xl font-extrabold leading-[.98] tracking-[-.065em] text-slate-950 sm:text-6xl lg:text-[76px]">Run the whole clinic from one place.</h1>
            <p className="mt-7 max-w-xl text-balance text-base font-medium leading-7 text-slate-600 sm:text-lg">Create your organization, choose your clinic type, and enter one isolated operating workspace for clinical care, connected referrals, office operations, revenue follow-through, and a Copilot your team can speak to or type into.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary"><Link href="/start">Create your workspace <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/login"><LogIn className="size-4" /> Sign in</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-600" /> Synthetic-data workspace</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-600" /> 30-day free trial</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-600" /> Human review gates</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-600" /> {clinicOsDayOneRegistry.length} P0 domains · {canonicalCapabilityCount.toLocaleString()} capabilities</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[720px]">
            <div className="absolute -inset-10 -z-10 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="glass-panel overflow-hidden rounded-[28px] p-3 sm:p-4">
              <div className="rounded-[20px] bg-slate-950 p-5 text-white sm:p-7">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-300">Tuesday, July 14</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Practice command center</h2></div><Stethoscope className="size-7 text-lime-300" /></div>
                <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
                  {[["18", "Visits today"], ["3", "Need review"], ["$8.4k", "Open claims"]].map(([value, label]) => <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10" key={label}><p className="text-xl font-extrabold sm:text-2xl">{value}</p><p className="mt-1 text-[9px] font-bold text-slate-400 sm:text-[10px]">{label}</p></div>)}
                </div>
                <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-extrabold">Human review queue</p><p className="text-[10px] text-slate-500">3 clinical messages safely held</p></div><span className="ml-auto rounded-full bg-rose-50 px-2 py-1 text-[9px] font-extrabold text-rose-600">Action needed</span></div>
                </div>
              </div>
              <div className="grid gap-3 p-2 pt-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold text-slate-400">NEXT APPOINTMENT</p><p className="mt-2 text-sm font-extrabold text-slate-950">Maya Thompson</p><p className="mt-1 text-xs text-slate-500">Diabetes follow-up · 10:30 AM</p></div>
                <div className="rounded-2xl border border-slate-200 bg-[#e7f7f3] p-4"><p className="text-[10px] font-bold text-teal-700">CARE QUALITY</p><p className="mt-2 text-sm font-extrabold text-slate-950">12 gaps closed</p><p className="mt-1 text-xs text-slate-500">This month across both locations</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white/70" id="platform">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 sm:px-8">
            {[["LifeChart + Care Constellation", "A longitudinal timeline and visual care team connect authorized records, providers, referrals, results, tasks, billing, and provenance."], ["Capacity + Injury Episode Rooms", "Diagnostic availability and injury-case readiness become visible action systems instead of phone tag and scattered documents."], ["Copilot: speak or type", "People can use push-to-talk or typing on the same screen. Clinical and risky output remains held for licensed human review."]].map(([title, body], index) => <div key={title}><p className="text-xs font-extrabold text-teal-700">0{index + 1}</p><h3 className="mt-3 text-lg font-extrabold tracking-[-.03em] text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{body}</p></div>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8" id="safety">
          <div className="rounded-[30px] bg-[#102033] p-8 text-white sm:p-12"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-lime-300">Clinical safety by design</p><div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.8fr]"><h2 className="text-balance text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">Automation handles the office work. Providers keep every clinical decision.</h2><p className="text-sm leading-7 text-slate-300">Emergency content is escalated. Lab and medication questions are routed for provider review. Insurance guarantees and record releases stay blocked until authorized staff act.</p></div></div>
        </section>

        <section className="border-t border-slate-200 bg-white" id="integrations"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-center"><div><p className="text-xs font-extrabold text-teal-700">START WITHOUT WAITING ON VENDORS</p><p className="mt-2 max-w-2xl text-sm text-slate-600">FHIR, SMART, HL7, 270/271, 837, 835, laboratories, imaging, payments, communications, and telemedicine remain visible as pending connectors with safe manual fallbacks until credentials, contracts, BAAs, and verification are complete.</p></div><Button asChild className="lg:ml-auto" variant="secondary"><Link href="/start">Open your clinic workspace <ArrowRight className="size-4" /></Link></Button></div></section>
      </main>
    </div>
  );
}
