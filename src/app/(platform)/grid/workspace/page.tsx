import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDollarSign } from "lucide-react";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Workspace" };

export default function GridWorkspacePage() {
  return <>
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-8">
      <Link className="flex items-center justify-between gap-5 rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[.055] px-5 py-4 text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/[.08]" href="/grid/transactions">
        <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><CircleDollarSign className="size-5" /></span><span><span className="block text-[12px] font-black uppercase tracking-[.18em] text-cyan-200">New transaction command</span><span className="mt-1 block text-sm font-extrabold">Needs → offers → reservations → fulfillment → money</span></span></span>
        <ArrowRight className="size-4 shrink-0 text-cyan-200" />
      </Link>
    </div>
    <GridRoute view="overview" />
  </>;
}
