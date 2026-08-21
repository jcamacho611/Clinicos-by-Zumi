import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Boxes, Plus } from "lucide-react";
import { GridResourceMarketplace } from "@/components/grid/grid-resource-marketplace";
import { listPublicGridResources } from "@/lib/grid/resource-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Grid Resources — Klinikos",
  description: "Browse reviewed public healthcare space, equipment, services, organization capacity, education, and permitted supplies on Klinikos Grid.",
};

export default async function GridResourceBrowsePage() {
  const resources = await listPublicGridResources();

  return <main className="grid-marble-surface min-h-screen">
    <header className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8"><Link className="text-sm font-black" href="/grid">Klinikos Grid</Link><span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#174ea6]">Reviewed resource exchange</span><Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#4b5768]" href="/grid"><ArrowLeft className="size-4" />Grid</Link></div></header>
    <section className="border-b border-[#e2e6ea] bg-white"><div className="mx-auto flex max-w-[1500px] flex-col gap-7 px-5 py-14 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-20"><div className="max-w-4xl"><p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#174ea6]">Approved universal supply</p><h1 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">More than people. More than jobs.</h1><p className="mt-6 max-w-3xl text-sm leading-7 text-[#4b5768]">Browse reviewed space, equipment, business services, organization capacity, education access, and permitted supplies. Grid keeps policy and review separate from discoverability.</p></div><Link className="inline-flex min-h-12 items-center gap-2 self-start rounded-xl bg-[#0b1220] px-5 text-xs font-extrabold text-white lg:self-auto" href="/grid/resources"><Plus className="size-4" />List a resource</Link></div></section>
    <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8"><GridResourceMarketplace resources={resources} /></section>
    <section className="mx-auto max-w-[1500px] px-5 pb-12 sm:px-8"><div className="flex items-start gap-3 rounded-[1.4rem] border border-[#dfe3e8] bg-white p-5 text-[11px] leading-6 text-[#4b5768]"><Boxes className="mt-1 size-4 shrink-0 text-[#174ea6]" /><p><strong className="text-[#0b1220]">Policy boundary:</strong> public discovery means the resource passed its current Grid review for this class. It does not override licensing, scope, contracts, clinical authorization, chain-of-custody, or other transaction-specific requirements.</p></div></section>
  </main>;
}
