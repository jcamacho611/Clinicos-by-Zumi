import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { GridPlatformFinanceConsole } from "@/components/grid/grid-platform-finance-console";
import { requireClinicSession } from "@/lib/auth/session";
import { getGridPlatformFinanceBoard } from "@/lib/grid/platform-finance-repository";

export const metadata: Metadata = {
  title: "Grid Finance Authority",
  description: "Restricted Klinikos Grid fee policy, financial obligation, and settlement control plane.",
};

export default async function GridFinanceAuthorityPage() {
  const session = await requireClinicSession();
  const board = await getGridPlatformFinanceBoard(session);

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/12 via-cyan-300/[.04] to-transparent" />
      <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em]"><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-amber-100">Restricted platform authority</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-white/45">{board.platformName}</span></div><p className="mt-7 text-[12px] font-black uppercase tracking-[.22em] text-amber-200">Grid Financial OS</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-5xl lg:text-6xl">Set economics. Reconcile truth.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Configure platform-owned fee policy, inspect obligations across Grid, and move settlement states only when the evidence exists. Participants cannot self-mark a payable settled.</p></div><Link className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70 xl:self-auto" href="/admin/grid"><ArrowLeft className="size-4" />Grid Authority</Link></div>
    </section>
    <div className="mt-5 flex items-start gap-3 rounded-[1.35rem] border border-amber-300/10 bg-amber-300/[.04] p-4 text-[12px] leading-5 text-amber-100/65"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p><strong className="text-amber-100">Protected control plane.</strong> Access requires owner-level settings permission inside the configured Klinikos platform organization. Current settlement is manual reconciliation and remains labeled non-processor-verified.</p></div>
    <div className="mt-6"><GridPlatformFinanceConsole board={board} /></div>
  </main>;
}
