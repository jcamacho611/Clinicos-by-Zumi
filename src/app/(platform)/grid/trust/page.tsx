import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  FileCheck2,
  Layers3,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { GridTrustWorkspace } from "@/components/grid/grid-trust-workspace";
import { requireClinicSession } from "@/lib/auth/session";
import { getGridTrustWorkspace } from "@/lib/grid/trust-workspace-repository";

export const metadata: Metadata = {
  title: "Grid Trust & Readiness — Klinikos",
  description: "Review publication readiness, objective transaction history, disputes, and safety concerns through governed Grid workflows.",
};

const readinessSteps = [
  {
    number: "01",
    title: "Define a legitimate resource",
    body: "Record only capacity the organization controls or is permitted to offer, including real restrictions and the correct policy class.",
    href: "/grid/resources",
    action: "Manage resources",
    icon: Layers3,
  },
  {
    number: "02",
    title: "Record real availability",
    body: "Time-sensitive capacity needs a real availability window. Missing availability stays missing instead of becoming invented supply.",
    href: "/grid/availability",
    action: "Open availability",
    icon: CalendarClock,
  },
  {
    number: "03",
    title: "Complete required review",
    body: "Ownership, permitted use, credentials, insurance, operator limits, facility rules, and other evidence remain resource-specific. A listing is not authorization.",
    href: "/grid/resources",
    action: "Review resource state",
    icon: FileCheck2,
  },
  {
    number: "04",
    title: "Keep the transaction states separate",
    body: "Publication can create discoverability. Offer, acceptance, reservation, fulfillment, customer payment, obligation, payout, and settlement remain different facts.",
    href: "/grid/resources/offers",
    action: "Review offers",
    icon: ShieldCheck,
  },
] as const;

export default async function GridTrustPage() {
  const session = await requireClinicSession();
  const workspace = await getGridTrustWorkspace(session);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#e6817b]/16 bg-[#090405] px-5 py-8 text-[#fff8f6] sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(157,45,57,.24),transparent_38%),linear-gradient(135deg,rgba(230,129,123,.05),transparent_58%)]" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#e6817b]/20 bg-[#e6817b]/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#efaaa1]">Trust & readiness</span>
              <span className="rounded-full border border-[#d6b787]/16 bg-[#d6b787]/[.055] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#d6b787]">Grid governance</span>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Know what can move forward — and what still needs proof.</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b59b97]">Before publication, Grid keeps resource ownership, permitted use, review evidence, availability, and eligibility distinct. After a transaction begins, disputes and safety concerns stay separate from payment, payout, and clinical-quality judgments.</p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-xl border border-[#e6817b]/14 bg-[#160a0d] px-4 py-3 text-xs font-semibold text-[#d8c1bd] hover:border-[#e6817b]/28" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link>
        </div>
      </section>

      <section className="mt-6 rounded-[1.8rem] border border-[#e6817b]/12 bg-[#0d0608] p-5 text-[#fff8f6] sm:p-7" aria-labelledby="publication-readiness-title">
        <div className="max-w-3xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#efaaa1]">Before publication</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]" id="publication-readiness-title">Publication readiness is a governed path, not a checkbox.</h2>
          <p className="mt-3 text-xs leading-6 text-[#9f8985]">Klinikos can organize the evidence and route the next action. It does not turn an incomplete record into permission to offer, transact, or perform regulated work.</p>
        </div>
        <div className="mt-6 divide-y divide-[#e6817b]/10 border-y border-[#e6817b]/10">
          {readinessSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div className="grid gap-4 py-5 sm:grid-cols-[48px_28px_1fr_auto] sm:items-start" key={step.number}>
                <span className="text-[10px] font-extrabold tracking-[.16em] text-[#d6b787]">{step.number}</span>
                <Icon className="size-4 text-[#efaaa1]" />
                <div><p className="text-sm font-semibold">{step.title}</p><p className="mt-2 max-w-2xl text-xs leading-6 text-[#9f8985]">{step.body}</p></div>
                <Link className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#efaaa1]" href={step.href}>{step.action}<ArrowRight className="size-3" /></Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="grid-issues-title">
        <div className="mb-4 max-w-3xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#d6b787]">After activity begins</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#fff8f6]" id="grid-issues-title">Transaction history, disputes, and safety issues stay governed separately.</h2>
        </div>
        <div className="rounded-[1.35rem] border border-[#d6b787]/12 bg-[#d6b787]/[.045] px-4 py-3 text-[10px] leading-5 text-[#d9c2a1]"><TriangleAlert className="mr-2 inline size-4" /><strong className="font-extrabold text-[#efd8ad]">Safety boundary:</strong> this workflow records and routes concerns. It does not diagnose injury, determine malpractice, suspend a participant automatically, or prove that a refund or payout occurred.</div>
        <div className="mt-5"><GridTrustWorkspace workspace={workspace} /></div>
        <div className="mt-5 rounded-[1.35rem] border border-[#e6817b]/10 bg-[#100708] px-4 py-3 text-[10px] leading-5 text-[#8f7773]"><ShieldCheck className="mr-2 inline size-4 text-[#efaaa1]" />Open disputes and safety incidents are settlement holds. Closing an issue is a governance record; processor refunds, payout reversals, participant restrictions, and resource suspensions require their own verified execution paths.</div>
      </section>
    </main>
  );
}
