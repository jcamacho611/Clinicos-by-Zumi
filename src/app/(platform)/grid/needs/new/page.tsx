import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { GridNeedComposer } from "@/components/grid/grid-need-composer";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Post a Grid Need — Klinikos",
  description: "Create a structured Klinikos Grid demand and search reviewed, eligible supply.",
};

const validKinds = new Set(["work", "provider", "space", "product", "equipment", "service", "network", "education", "organization", "referral"]);

type Kind = "work" | "provider" | "space" | "product" | "equipment" | "service" | "network" | "education" | "organization" | "referral";

export default async function GridNewNeedPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  await requireClinicSession();
  const { kind } = await searchParams;
  const initialKind = kind && validKinds.has(kind) ? kind as Kind : "service";

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/14 via-blue-500/[.04] to-transparent" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">I need something</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-6xl">Create demand Grid can actually search.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Turn the outcome into structured time, location, budget, capacity, requirements, and eligibility constraints. Grid searches authoritative supply rather than guessing from a free-text post.</p></div>
        <div className="flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link><Link className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" href="/grid/browse"><Search className="size-4" />Browse supply</Link></div>
      </div>
    </section>

    <div className="mt-5 rounded-[1.35rem] border border-amber-200/10 bg-amber-200/[.045] px-4 py-3 text-[10px] leading-5 text-amber-100/70"><ShieldCheck className="mr-2 inline size-4" /><strong className="font-extrabold text-amber-100">Marketplace boundary:</strong> describe resource requirements only. Do not place patient names, diagnoses, records, or other PHI into a general Grid need.</div>
    <div className="mt-6"><GridNeedComposer initialKind={initialKind} /></div>
  </main>;
}
