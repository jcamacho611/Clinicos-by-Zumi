import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Boxes, MapPinned } from "lucide-react";
import { GridResourceOwnerConsole } from "@/components/grid/grid-resource-owner-console";
import { requireClinicSession } from "@/lib/auth/session";
import { listOwnGridResources } from "@/lib/grid/resource-repository";

export const metadata: Metadata = {
  title: "My Grid Resources — Klinikos",
  description: "Create, review, pause, and manage universal Klinikos Grid resources and capacity.",
};

export default async function GridResourcesPage() {
  const session = await requireClinicSession();
  const resources = await listOwnGridResources(session);

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/12 via-blue-500/[.04] to-transparent" />
      <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl"><p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Universal Grid supply</p><h1 className="mt-3 text-4xl font-black tracking-[-.065em] text-white sm:text-5xl lg:text-6xl">What do you have available?</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Create reusable healthcare resources once, then let Grid control visibility, review, eligibility, availability, and capacity. A listing never silently becomes permission to transact.</p></div>
        <div className="flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/workspace"><ArrowLeft className="size-4" />Grid workspace</Link><Link className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" href="/grid/resources/browse"><MapPinned className="size-4" />Browse resources</Link></div>
      </div>
    </section>
    <div className="mt-6"><GridResourceOwnerConsole resources={resources} /></div>
  </main>;
}
