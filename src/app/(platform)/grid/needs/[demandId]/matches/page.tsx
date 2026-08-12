import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Radar, ShieldCheck } from "lucide-react";
import { GridCandidateOfferCard } from "@/components/grid/grid-candidate-offer-card";
import { requireClinicSession } from "@/lib/auth/session";
import { discoverGridCandidatesForSavedNeed } from "@/lib/grid/opportunity-discovery-repository";

export const metadata: Metadata = {
  title: "Grid Candidates — Klinikos",
  description: "Review deterministic Klinikos Grid candidates for a saved need and move an eligible candidate into the governed offer flow.",
};

function money(cents: number | null) {
  if (cents == null) return "No ceiling";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function GridNeedMatchesPage({ params }: { params: Promise<{ demandId: string }> }) {
  const session = await requireClinicSession();
  const { demandId } = await params;
  const discovery = await discoverGridCandidatesForSavedNeed(session, demandId);
  const demand = discovery.demand;

  return <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/15 via-blue-500/[.04] to-transparent" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-cyan-100">{demand.kind}</span><span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-white/45">{discovery.mode.replaceAll("_", " ")}</span></div><p className="mt-7 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Saved Grid need</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-5xl">{demand.title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">{demand.description}</p></div><Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs font-extrabold text-white/70" href="/grid/opportunities"><ArrowLeft className="size-4" />Opportunities</Link></div>
    </section>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[demand.category, "Category"], [demand.city ? `${demand.city}${demand.state ? `, ${demand.state}` : ""}` : demand.state ?? "Any reviewed area", "Location"], [demand.requestedStartAt ? new Date(demand.requestedStartAt).toLocaleString() : "Flexible", "Start"], [money(demand.maxPriceCents), "Budget ceiling"]].map(([value, title]) => <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4" key={title}><p className="text-sm font-black text-white">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-white/35">{title}</p></div>)}</section>

    <div className="mt-5 rounded-[1.35rem] border border-amber-200/10 bg-amber-200/[.045] px-4 py-3 text-[10px] leading-5 text-amber-100/70"><ShieldCheck className="mr-2 inline size-4" /><strong className="font-extrabold text-amber-100">Candidate is not authorization:</strong> discovery filters authoritative current state, but sending an offer revalidates supply and acceptance/reservation re-check it again. Generic clinical services and regulated products remain outside the generic resource path.</div>

    <section className="mt-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Deterministic discovery</p><h2 className="mt-2 text-2xl font-black text-white">{discovery.candidates.length} candidate{discovery.candidates.length === 1 ? "" : "s"}</h2></div><Link className="text-xs font-extrabold text-cyan-200" href={`/grid/needs/new?kind=${encodeURIComponent(demand.kind)}`}>Create another need</Link></div>
      {discovery.candidates.length ? <div className="grid gap-4 xl:grid-cols-2">{discovery.candidates.map((candidate) => <GridCandidateOfferCard candidate={candidate} demandId={demand.id} demandStatus={demand.status} key={`${candidate.candidateKind}-${candidate.id}`} requestedEndAt={demand.requestedEndAt} requestedStartAt={demand.requestedStartAt} />)}</div> : <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[.02] p-8 text-center"><Radar className="mx-auto size-7 text-cyan-200" /><h3 className="mt-4 text-lg font-black text-white">No current candidate passed discovery.</h3><p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-white/45">That means Grid does not currently have reviewed supply that fits the saved type, jurisdiction/state, capacity, time, and budget filters. It does not mean the need is invalid.</p></div>}
    </section>
  </main>;
}
