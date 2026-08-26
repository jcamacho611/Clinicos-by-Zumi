import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale, ShieldAlert, ShieldCheck } from "lucide-react";
import { GridTrustReviewQueue } from "@/components/grid/grid-trust-review-queue";
import { requireClinicSession } from "@/lib/auth/session";
import { getGridTrustReviewQueue } from "@/lib/grid/trust-review-repository";

export const metadata: Metadata = {
  title: "Grid Trust Review",
  description: "Klinikos platform review queue for Grid marketplace disputes and safety incidents.",
};

export default async function GridTrustReviewPage() {
  const session = await requireClinicSession();
  const queue = await getGridTrustReviewQueue(session);

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/14 via-cyan-400/[.04] to-transparent" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-amber-100">Platform governance</span><span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-white/45">Grid trust review</span></div><h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-6xl">Review issues without faking execution.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Resolve marketplace disputes, triage safety incidents, and record recommendations. Refunds, payout reversals, participant restrictions, and resource holds remain separate verified actions.</p></div><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/transactions"><ArrowLeft className="size-4" />Grid transactions</Link></div>
    </section>

    <section className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><Scale className="size-4 text-cyan-200"/><p className="mt-3 text-xs font-extrabold text-white">Commercial disputes</p><p className="mt-1 text-[12px] leading-5 text-white/40">No-show, cancellation, fulfillment, payment, payout, or resource disputes.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><ShieldAlert className="size-4 text-amber-200"/><p className="mt-3 text-xs font-extrabold text-white">Safety incidents</p><p className="mt-1 text-[12px] leading-5 text-white/40">Credential, scope, conduct, facility, equipment, or adverse-event concerns stay on a separate governance track.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><ShieldCheck className="size-4 text-emerald-200"/><p className="mt-3 text-xs font-extrabold text-white">Settlement hold</p><p className="mt-1 text-[12px] leading-5 text-white/40">Open issues block normal fulfillment advancement and new financial allocation until the issue record is closed.</p></div></section>

    <div className="mt-6"><GridTrustReviewQueue queue={queue} /></div>
  </main>;
}
