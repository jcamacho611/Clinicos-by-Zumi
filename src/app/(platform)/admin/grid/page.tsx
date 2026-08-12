import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Authority" };

export default function GridAdminPage() {
  return <>
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-8">
      <Link className="flex items-center justify-between gap-5 rounded-[1.4rem] border border-amber-300/15 bg-amber-300/[.055] px-5 py-4 text-white transition hover:border-amber-300/30 hover:bg-amber-300/[.08]" href="/admin/grid/finance">
        <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><Landmark className="size-5" /></span><span><span className="block text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Platform finance authority</span><span className="mt-1 block text-sm font-extrabold">Fee policies → obligations → settlement control</span></span></span>
        <ArrowRight className="size-4 shrink-0 text-amber-200" />
      </Link>
    </div>
    <GridRoute view="admin" />
  </>;
}
