import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ClipboardCheck, FileCheck2, ShieldCheck, Stethoscope } from "lucide-react";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Claim Readiness — Klinikos",
  description: "Review the operational work that must be complete before a claim can be submitted truthfully.",
};

const readinessAreas = [
  { title: "Coverage and authorization", detail: "Confirm eligibility and authorization state before treating a claim as ready for external submission.", href: "/insurance", action: "Open insurance", icon: ShieldCheck },
  { title: "Clinical documentation", detail: "Required encounter and supporting documentation must exist and be reviewable. Missing documentation stays a blocker.", href: "/documents", action: "Open documents", icon: FileCheck2 },
  { title: "Coding and billing work", detail: "Klinikos can organize coding and billing readiness, but internal readiness is not clearinghouse or payer acceptance.", href: "/billing", action: "Open billing", icon: Calculator },
  { title: "Human follow-up", detail: "Route unresolved items to an accountable person instead of pretending an incomplete claim moved forward automatically.", href: "/tasks", action: "Open tasks", icon: ClipboardCheck },
] as const;

export default async function ClaimReadinessPage() {
  await requireClinicSession();

  return (
    <main className="mx-auto w-full max-w-[1450px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#e6817b]/16 bg-[#090405] px-5 py-9 text-[#fff8f6] sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(151,42,53,.24),transparent_38%),linear-gradient(135deg,rgba(230,129,123,.05),transparent_58%)]" />
        <div className="relative max-w-4xl">
          <div className="flex items-center gap-2 text-[#efaaa1]"><Stethoscope className="size-4" /><p className="text-[10px] font-extrabold uppercase tracking-[.22em]">Revenue-cycle readiness</p></div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">See what must be true before a claim moves forward.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b59b97]">Klinikos organizes the operational prerequisites around a claim. It does not turn an internal checklist into proof that a clearinghouse accepted a submission, a payer adjudicated it, or money was received.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Claim readiness areas">
        {readinessAreas.map(({ title, detail, href, action, icon: Icon }) => (
          <div className="rounded-[1.6rem] border border-[#e6817b]/11 bg-[#0d0608] p-6 text-[#fff8f6]" key={title}>
            <Icon className="size-5 text-[#efaaa1]" />
            <h2 className="mt-5 text-xl font-semibold tracking-[-.03em]">{title}</h2>
            <p className="mt-3 text-xs leading-6 text-[#9f8985]">{detail}</p>
            <Link className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#efaaa1]" href={href}>{action}<ArrowRight className="size-3" /></Link>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-[1.6rem] border border-[#d6b787]/15 bg-[#d6b787]/[.045] p-6 text-[#f8efed]">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d6b787]">External truth boundary</p>
        <p className="mt-3 max-w-4xl text-xs leading-6 text-[#b7a19c]">When a clinic connects a clearinghouse or payer rail, external submission, acceptance, rejection, claim status, remittance, and payment must be evidenced by that rail. Until then, Klinikos may prepare and route the work without claiming the external transaction occurred.</p>
        <Link className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#e6817b]/14 bg-[#160a0d] px-4 py-3 text-xs font-semibold text-[#fff8f6]" href="/integrations">Review connections <ArrowRight className="size-4 text-[#efaaa1]" /></Link>
      </section>
    </main>
  );
}
