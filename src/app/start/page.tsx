import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Blocks, CircleDollarSign, Network, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { OrganizationOnboardingForm } from "@/components/clinic/organization-onboarding-form";
import { getClinicSession } from "@/lib/auth/session";

const included = [
  [Blocks, "Complete clinic workspace", "Patients, scheduling, encounters, documents, forms, tasks, and operational queues."],
  [Network, "Connected-care foundation", "Referrals, consent-controlled exchange, partner directories, and manual delivery fallbacks."],
  [CircleDollarSign, "Revenue operations", "Claims readiness, billing work queues, payments, cases, and recovery tracking."],
  [ShieldCheck, "Governed automation", "Voice and AI assistance remain logged, reviewable, and blocked from autonomous clinical decisions."],
] as const;

export default async function StartPage() {
  if (await getClinicSession()) redirect("/dashboard");

  return (
    <main className="min-h-screen overflow-hidden bg-[#07151c] text-white">
      <div className="absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_18%_18%,rgba(212,175,55,.18),transparent_34%),radial-gradient(circle_at_75%_4%,rgba(34,211,238,.14),transparent_28%)]" />
      <header className="relative mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold">Klinikos</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#e6c55b]">Organization launch</p></div></Link>
        <Link className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white" href="/"><ArrowLeft className="size-4" /> Back to overview</Link>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start lg:pt-16">
        <div className="lg:sticky lg:top-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f0d878]"><BadgeCheck className="size-3.5" /> Founding clinic offer</span>
          <h1 className="mt-7 max-w-xl text-balance text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl">Open the operating system your clinic should have had.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">Create an isolated organization workspace with every Klinikos module visible from day one. Start with synthetic data, working manual fallbacks, and no credit card.</p>

          <div className="mt-9 space-y-3">
            {included.map(([Icon, title, body]) => (
              <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4" key={title}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d4af37]/10 text-[#f0d878]"><Icon className="size-5" /></span>
                <div><h2 className="text-sm font-extrabold">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{body}</p></div>
              </div>
            ))}
          </div>

          <p className="mt-7 border-l-2 border-[#d4af37] pl-4 text-xs leading-6 text-slate-400">Paid integrations are not required to begin. Stripe, Twilio, laboratories, imaging, clearinghouses, e-prescribing, and telemedicine are created as pending connectors with manual workflows preserved.</p>
        </div>

        <OrganizationOnboardingForm />
      </section>
    </main>
  );
}
