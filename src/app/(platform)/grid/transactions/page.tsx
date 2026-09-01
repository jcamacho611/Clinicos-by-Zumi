import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Map, ShieldAlert, ShieldCheck } from "lucide-react";
import { GridLiquiditySummary } from "@/components/grid/grid-liquidity-summary";
import { GridTransactionCommand } from "@/components/grid/grid-transaction-command";
import { requireClinicSession } from "@/lib/auth/session";
import { getGridTransactionBoard } from "@/lib/grid/transaction-board-repository";

export const metadata: Metadata = {
  title: "Grid Transactions",
  description: "Manage Klinikos Grid needs, offers, reservations, fulfillment, financial obligations, disputes, and safety escalation from one governed workflow.",
};

export default async function GridTransactionsPage() {
  const session = await requireClinicSession();
  const board = await getGridTransactionBoard(session);

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 shadow-[0_40px_110px_rgba(2,6,23,.35)] sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-blue-500/[.04] to-transparent" />
      <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em]"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">Grid transaction command</span><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-amber-100">Synthetic / human reviewed</span></div>
          <p className="mt-7 text-[12px] font-black uppercase tracking-[.22em] text-cyan-200">One deal. Every state.</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-5xl lg:text-6xl">From “I need something” to economic truth.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Create demand, discover eligible supply, negotiate an offer, hold capacity, reconcile required payment evidence, record fulfillment, and see what is actually owed. Nothing skips a state.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link><Link className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[.08] px-4 py-3 text-xs font-extrabold text-amber-100" href="/grid/trust"><ShieldAlert className="size-4" />Trust & issues</Link><Link className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" href="/grid/browse"><Map className="size-4" />Open live Grid</Link></div>
      </div>
    </section>

    <div className="mt-5 rounded-[1.35rem] border border-amber-200/10 bg-amber-200/[.045] px-4 py-3 text-[12px] leading-5 text-amber-100/70"><ShieldCheck className="mr-2 inline size-4" /><strong className="font-extrabold text-amber-100">Current boundary:</strong> this surface remains synthetic/demo gated. Manual GoDaddy payment evidence is not processor verification, financial obligations are not automated payouts, and active disputes or safety incidents hold normal settlement.</div>

    <div className="mt-6"><GridLiquiditySummary metrics={board.liquidity} /></div>
    <div className="mt-6"><GridTransactionCommand board={board} /></div>
  </main>;
}
