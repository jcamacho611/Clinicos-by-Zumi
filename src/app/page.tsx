import Link from "next/link";
import { ArrowRight, Check, LogIn, ShieldCheck, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canonicalCapabilityCount, clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <div><p className="text-sm font-extrabold tracking-[-.03em]">Klinikos</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">The Clinic Operating System</p></div>
          </Link>
          <nav className="ml-auto hidden items-center gap-7 text-xs font-bold text-slate-600 md:flex">
            <a href="#platform">Platform</a><Link href="/capabilities">Capabilities</Link><Link href="/grid/join">GRID</Link><a href="#safety">Safety</a><a href="#integrations">Connections</a>
          </nav>
          <Link className="ml-4 hidden text-xs font-extrabold text-slate-700 hover:text-slate-950 sm:block" href="/login">Sign in</Link>
          <Button asChild className="ml-4" size="sm"><Link href="/access">Enter Klinikos <ArrowRight className="size-4" /></Link></Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:py-20">
          <div>
            <Badge className="mb-7 bg-white" tone="amber">Founding Clinic Implementation · $8,000</Badge>
            <h1 className="max-w-[760px] text-balance text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-[76px]">One operating system for the entire clinic.</h1>
            <p className="mt-7 max-w-2xl text-balance text-base font-medium leading-7 text-slate-600 sm:text-lg">Klinikos brings clinical care, front-desk operations, connected referrals, revenue follow-through, patient coordination and governed intelligence into one operating environment built for independent clinics.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary"><Link href="/sales">See if your clinic qualifies <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/private-demo">Request a Clinic Operating Analysis</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/login"><LogIn className="size-4" /> Sign in</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-700" /> Qualification before implementation</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-700" /> Human review for clinical and revenue-sensitive actions</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-700" /> Built toward HIPAA-regulated deployment</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-teal-700" /> {clinicOsDayOneRegistry.length} operating domains · {canonicalCapabilityCount.toLocaleString()} capabilities tracked</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px] border-y border-slate-300 bg-white py-3">
            <div className="bg-[#0b1e3a] p-5 text-white sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d4af37]">Synthetic demonstration</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Clinic command center</h2></div><Stethoscope className="size-7 text-white" /></div>
              <div className="mt-7 grid grid-cols-3 border-y border-white/15 py-5">
                {[["18", "Visits today"], ["3", "Need review"], ["$8.4k", "Open claims"]].map(([value, label], index) => <div className={index > 0 ? "border-l border-white/15 pl-4" : ""} key={label}><p className="text-xl font-extrabold sm:text-2xl">{value}</p><p className="mt-1 text-[9px] font-bold text-slate-400 sm:text-[10px]">{label}</p></div>)}
              </div>
              <div className="mt-5 flex items-center gap-3 bg-white p-4 text-slate-900"><ShieldCheck className="size-5 text-rose-600" /><div><p className="text-xs font-extrabold">Human review queue</p><p className="text-[10px] text-slate-500">Clinical and risky actions remain held for licensed review.</p></div><span className="ml-auto text-[9px] font-extrabold uppercase tracking-[.12em] text-rose-600">Action needed</span></div>
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-[10px] font-bold text-slate-400">NEXT APPOINTMENT</p><p className="mt-2 text-sm font-extrabold">Maya Thompson</p><p className="mt-1 text-xs text-slate-500">Diabetes follow-up · 10:30 AM</p></div>
              <div className="p-4"><p className="text-[10px] font-bold text-teal-700">CARE QUALITY</p><p className="mt-2 text-sm font-extrabold">12 gaps closed</p><p className="mt-1 text-xs text-slate-500">Synthetic demonstration across two locations</p></div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white" id="platform">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 sm:px-8">
            {[["Clinical + operational core", "Patients, encounters, scheduling, front desk, documents, tasks and role-aware workflows in one system."], ["Network + GRID", "Closed-loop referrals, governed handoffs, capacity, provider relationships and a growing service marketplace."], ["Klinikos Intelligence", "Contextual summaries, detection, drafts and recommendations that stay labeled and human-reviewed where required."]].map(([title, body], index) => <div className="border-t border-slate-300 pt-5" key={title}><p className="text-xs font-extrabold text-[#9a7a1f]">0{index + 1}</p><h3 className="mt-3 text-lg font-extrabold tracking-[-.03em]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{body}</p></div>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8" id="safety">
          <div className="border-y border-slate-300 py-10"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#9a7a1f]">Clinical safety by design</p><div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.8fr]"><h2 className="text-balance text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">Automation handles operational work. Licensed professionals keep clinical judgment.</h2><p className="text-sm leading-7 text-slate-600">Emergency content is escalated. Lab, medication, coding, claim, record-release and credentialing actions remain subject to appropriate human review and authorization.</p></div></div>
        </section>

        <section className="border-t border-slate-200 bg-white" id="integrations"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-center"><div><p className="text-xs font-extrabold text-[#9a7a1f]">CONNECT WHAT SHOULD REMAIN EXTERNAL</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">FHIR, SMART, HL7, eligibility, claims, remittance, laboratories, imaging, payments, communications, telemedicine and other vendor relationships connect through governed gateways with explicit status and fallback behavior.</p></div><Button asChild className="lg:ml-auto" variant="secondary"><Link href="/sales">Request a clinic operating analysis <ArrowRight className="size-4" /></Link></Button></div></section>
      </main>
    </div>
  );
}
