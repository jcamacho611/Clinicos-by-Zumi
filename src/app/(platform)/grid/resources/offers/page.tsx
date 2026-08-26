import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Handshake, Plus } from "lucide-react";
import { GridResourceDealRoom } from "@/components/grid/grid-resource-deal-room";
import { requireClinicSession } from "@/lib/auth/session";
import { getUniversalResourceDealRoom } from "@/lib/grid/universal-resource-deal-repository";

export const metadata: Metadata = {
  title: "Grid Resource Deals",
  description: "Negotiate and reserve approved universal Klinikos Grid resources through a policy-aware deal room.",
};

export default async function GridResourceOffersPage() {
  const session = await requireClinicSession();
  const room = await getUniversalResourceDealRoom(session);

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/10 via-cyan-300/[.04] to-transparent" /><div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><p className="text-[12px] font-black uppercase tracking-[.2em] text-amber-200">Universal resource deals</p><h1 className="mt-3 text-4xl font-black tracking-[-.06em] text-white sm:text-5xl">Negotiate terms. Reserve only verified capacity.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">Generic Grid resources use the same economic lifecycle as clinician work, but their eligibility comes from resource-class policy, human review, ownership, time, and capacity.</p></div><div className="flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/resources"><ArrowLeft className="size-4" />My resources</Link><Link className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" href="/grid/resources/browse"><Plus className="size-4" />Find supply</Link></div></div></section>
    <div className="mt-6"><GridResourceDealRoom room={room} /></div>
    <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/[.03] p-4 text-[12px] leading-5 text-white/40"><Handshake className="mr-2 inline size-4 text-cyan-200" />Regulated products and generic clinical services intentionally cannot reach accepted/reserved states through this room. They stay blocked until their dedicated policy/verifier exists.</div>
  </main>;
}
