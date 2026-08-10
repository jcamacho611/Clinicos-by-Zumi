import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, CircleDollarSign, ClipboardCheck, ShieldCheck, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { Button } from "@/components/ui/button";
import { getClinicSession } from "@/lib/auth/session";

const steps = [
  [ClipboardCheck, "1. Clinic Operating Analysis", "Tell us what you run, what software you pay for, where work breaks down, and what you want Klinikos to replace or improve."],
  [Stethoscope, "2. Qualification + implementation design", "We review clinic type, workflows, integrations, data requirements, risk, locations, providers and rollout needs before offering production implementation."],
  [ShieldCheck, "3. Controlled launch", "Approved clinics move through contracts, required security/compliance gates, migration planning, configuration, training and launch. Production PHI is not activated merely by submitting this page."],
] as const;

export default async function StartPage() {
  if (await getClinicSession()) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#07151c] text-white">
      <header className="mx-auto flex h-20 max-w-7xl items-center border-b border-white/10 px-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold">Klinikos</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#e6c55b]">Founding Clinic Program</p></div></Link>
        <Link className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white" href="/"><ArrowLeft className="size-4" /> Back to overview</Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_.82fr] lg:items-start lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 border border-[#d4af37]/35 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f0d878]"><BadgeCheck className="size-3.5" /> Qualification required</span>
          <h1 className="mt-7 max-w-3xl text-balance text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl">Klinikos is implemented with your clinic, not handed over as a generic free workspace.</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300">The Founding Clinic Program starts by understanding your systems, spend, staff, revenue workflow and operational gaps. We use that analysis to decide whether Klinikos is a fit and what implementation should actually replace, connect or remain external.</p>

          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {steps.map(([Icon, title, body]) => (
              <div className="flex gap-4 py-5" key={title}>
                <Icon className="mt-1 size-5 shrink-0 text-[#e6c55b]" />
                <div><h2 className="text-sm font-extrabold">{title}</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">{body}</p></div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="primary"><Link href="/sales">See if your clinic qualifies <ArrowRight className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/private-demo">Request a Clinic Operating Analysis</Link></Button>
          </div>
        </div>

        <aside className="border-t border-[#d4af37]/50 bg-white/[.035] py-8 lg:border-l lg:border-t-0 lg:py-0 lg:pl-10">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#e6c55b]">Founding Clinic Implementation</p>
          <div className="mt-5 flex items-end gap-3"><CircleDollarSign className="mb-2 size-7 text-[#e6c55b]" /><p className="text-5xl font-extrabold tracking-[-.06em]">$8,000</p></div>
          <p className="mt-5 text-sm leading-7 text-slate-300">The implementation fee is the commercial entry point for approved founding clinics. Final scope, recurring configuration, integrations and external vendor costs are defined during qualification and contracting.</p>
          <dl className="mt-8 divide-y divide-white/10 border-y border-white/10 text-xs">
            <div className="grid grid-cols-[130px_1fr] gap-4 py-4"><dt className="font-extrabold text-white">Includes</dt><dd className="leading-6 text-slate-400">Operating analysis, workflow configuration, migration planning, integration planning, training and launch support within the agreed SOW.</dd></div>
            <div className="grid grid-cols-[130px_1fr] gap-4 py-4"><dt className="font-extrabold text-white">Not automatic</dt><dd className="leading-6 text-slate-400">Production PHI activation, payer/lab/eRx enrollment, vendor contracts, BAAs, custom migrations or external credentials.</dd></div>
            <div className="grid grid-cols-[130px_1fr] gap-4 py-4"><dt className="font-extrabold text-white">Safety</dt><dd className="leading-6 text-slate-400">Clinical, coding, claims, medication, result-release and credential decisions remain subject to appropriate human review.</dd></div>
          </dl>
          <p className="mt-7 text-[10px] leading-5 text-slate-500">Already approved or already have an account? <Link className="font-extrabold text-white hover:text-[#e6c55b]" href="/login">Sign in</Link>.</p>
        </aside>
      </section>
    </main>
  );
}
