import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, TriangleAlert } from "lucide-react";
import { GridTrustWorkspace } from "@/components/grid/grid-trust-workspace";
import { requireClinicSession } from "@/lib/auth/session";
import { getGridTrustWorkspace } from "@/lib/grid/trust-workspace-repository";

export const metadata: Metadata = {
  title: "Grid Trust & Issues — Klinikos",
  description: "Review objective Grid transaction history and report marketplace disputes or safety concerns through separate governed workflows.",
};

export default async function GridTrustPage() {
  const session = await requireClinicSession();
  const workspace = await getGridTrustWorkspace(session);

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/12 via-cyan-400/[.05] to-transparent" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-amber-100">Trust & issues</span><span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-white/45">Grid governance</span></div><h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-6xl">Know what happened. Escalate the right problem.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Grid separates commercial disputes from safety incidents, holds normal settlement while issues remain active, and reports objective transaction history without pretending it measures clinical quality.</p></div>
        <Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link>
      </div>
    </section>

    <div className="mt-5 rounded-[1.35rem] border border-amber-200/10 bg-amber-200/[.045] px-4 py-3 text-[10px] leading-5 text-amber-100/70"><TriangleAlert className="mr-2 inline size-4" /><strong className="font-extrabold text-amber-100">Safety boundary:</strong> this workflow records and routes concerns. It does not diagnose injury, determine malpractice, suspend a participant automatically, or prove that a refund or payout occurred.</div>
    <div className="mt-6"><GridTrustWorkspace workspace={workspace} /></div>
    <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[.03] px-4 py-3 text-[10px] leading-5 text-white/40"><ShieldCheck className="mr-2 inline size-4 text-cyan-200" />Open disputes and safety incidents are settlement holds. Closing an issue is a governance record; processor refunds, payout reversals, participant restrictions, and resource suspensions require their own verified execution paths.</div>
  </main>;
}
