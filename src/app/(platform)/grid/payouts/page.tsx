import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDollarSign } from "lucide-react";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Payouts" };

export default function GridPayoutsPage() {
  return <>
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-8">
      <Link className="flex items-center justify-between gap-5 rounded-[1.4rem] border border-emerald-300/15 bg-emerald-300/[.055] px-5 py-4 text-white transition hover:border-emerald-300/30 hover:bg-emerald-300/[.08]" href="/grid/transactions">
        <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"><CircleDollarSign className="size-5" /></span><span><span className="block text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Universal Grid money</span><span className="mt-1 block text-sm font-extrabold">Open obligations, earnings, reservations, and fulfillment</span><span className="mt-1 block text-[9px] text-white/35">The ledger below remains the legacy provider-payout compatibility view.</span></span></span>
        <ArrowRight className="size-4 shrink-0 text-emerald-200" />
      </Link>
    </div>
    <GridRoute view="payouts" />
  </>;
}
