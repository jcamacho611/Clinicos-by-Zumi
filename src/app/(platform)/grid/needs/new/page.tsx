import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { GridNeedComposer } from "@/components/grid/grid-need-composer";
import { requireClinicSession } from "@/lib/auth/session";
import { draftForClinicGridSignal } from "@/lib/ecosystem/clinic-grid-bridge";
import { draftForEduGridSignal } from "@/lib/ecosystem/edu-grid-bridge";

export const metadata: Metadata = {
  title: "Post a Grid Need — Klinikos",
  description: "Create a structured Klinikos Grid demand and search reviewed, eligible supply.",
};

const validKinds = new Set(["work", "provider", "space", "product", "equipment", "service", "network", "education", "organization", "referral"]);

type Kind = "work" | "provider" | "space" | "product" | "equipment" | "service" | "network" | "education" | "organization" | "referral";

const clinicSignals = new Set(["coverage_gap", "referral_leak"] as const);
const eduSignals = new Set(["placement_ready"] as const);
type ClinicSignal = "coverage_gap" | "referral_leak";
type EduSignal = "placement_ready";

export default async function GridNewNeedPage({ searchParams }: { searchParams: Promise<{ kind?: string; from?: string }> }) {
  const session = await requireClinicSession();
  const { kind, from } = await searchParams;
  const initialKind = kind && validKinds.has(kind) ? kind as Kind : "service";

  // `from` names a Clinic OS signal, not the demand itself. The draft is rebuilt here
  // from live records, so a link cannot carry a forged or stale need into the form.
  // If the gap closed since Home rendered, this returns null and the form opens empty
  // rather than prefilled for work nobody needs any more.
  const clinicSignal = from && clinicSignals.has(from as ClinicSignal) ? from as ClinicSignal : null;
  const eduSignal = from && eduSignals.has(from as EduSignal) ? from as EduSignal : null;
  const bridged = clinicSignal ?? eduSignal;
  const initialDraft = clinicSignal
    ? await draftForClinicGridSignal(session, clinicSignal)
    : eduSignal
      ? await draftForEduGridSignal(session, eduSignal)
      : null;

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/14 via-blue-500/[.04] to-transparent" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">I need something</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-6xl">Create demand Grid can actually search.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Turn the outcome into structured time, location, budget, capacity, requirements, and eligibility constraints. Grid searches authoritative supply rather than guessing from a free-text post.</p></div>
        <div className="flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link><Link className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" href="/grid/browse"><Search className="size-4" />Browse supply</Link></div>
      </div>
    </section>

    <div className="mt-5 rounded-[1.35rem] border border-amber-200/10 bg-amber-200/[.045] px-4 py-3 text-[10px] leading-5 text-amber-100/70"><ShieldCheck className="mr-2 inline size-4" /><strong className="font-extrabold text-amber-100">Marketplace boundary:</strong> describe resource requirements only. Do not place patient names, diagnoses, records, or other PHI into a general Grid need.</div>
    {bridged && !initialDraft ? <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[.04] px-4 py-3 text-[10px] leading-5 text-white/60">{eduSignal ? "That competency is no longer recorded as demonstrated, so this form starts empty. You can still create the need by hand." : "That gap is no longer open on your schedule, so this form starts empty. You can still create the need by hand."}</div> : null}
    <div className="mt-6"><GridNeedComposer initialDraft={initialDraft} initialKind={initialKind} /></div>
  </main>;
}
