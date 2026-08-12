import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CirclePlus,
  Map,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { requireClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { externalGridParticipantKindFromClinicType } from "@/lib/grid/external-participant-enrollment";
import { listOwnGridResources } from "@/lib/grid/resource-repository";
import { getGridTransactionBoard } from "@/lib/grid/transaction-board-repository";

export const metadata: Metadata = {
  title: "Grid Opportunities — Klinikos",
  description: "One place to see Klinikos Grid needs, resources, offers, bookings, and earnings.",
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function label(value: string | null) {
  if (!value) return "Healthcare participant";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function GridOpportunitiesPage() {
  const session = await requireClinicSession();
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { clinicType: true, name: true },
  });

  const [board, resources] = await Promise.all([
    getGridTransactionBoard(session),
    listOwnGridResources(session),
  ]);

  const participantKind = organization ? externalGridParticipantKindFromClinicType(organization.clinicType) : null;
  const clinicalProfessional = session.role === "contractor" && participantKind === null;
  const pendingReview = resources.filter((resource) => resource.reviewStatus === "in_review").length;
  const activeResources = resources.filter((resource) => resource.status === "active" && resource.reviewStatus === "approved").length;

  const primary = clinicalProfessional
    ? [
        { icon: BriefcaseBusiness, title: "Find work", body: "See eligible work and provider opportunities available through Grid.", href: "/grid/workspace" },
        { icon: CirclePlus, title: "Post a need", body: "Need space, equipment, business support, education capacity, or another Grid resource? Save demand and match it.", href: "/grid/needs/new" },
        { icon: CalendarClock, title: "Set availability", body: "Tell Grid when, where, and how far you want to work.", href: "/grid/availability" },
        { icon: BadgeDollarSign, title: "Track earnings", body: "See current transaction and payout state without treating estimates as paid money.", href: "/grid/transactions" },
      ]
    : [
        { icon: CirclePlus, title: "I need something", body: "Create structured demand and let Grid find current reviewed candidates.", href: "/grid/needs/new" },
        { icon: Boxes, title: "I have something", body: "Create resources, capacity, services, equipment, or permitted supply and send them through review.", href: "/grid/resources" },
        { icon: Radar, title: "Transactions", body: "See offers, reservations, fulfillment, and financial obligations involving your organization.", href: "/grid/transactions" },
        { icon: Map, title: "Explore the market", body: "Browse reviewed public Grid supply and available provider capacity.", href: "/grid/browse" },
      ];

  return <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-8 shadow-[0_40px_110px_rgba(2,6,23,.35)] sm:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-300/15 via-blue-500/[.05] to-transparent" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.14em]"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">Klinikos Grid</span><span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-white/55">{label(participantKind)}</span></div>
          <p className="mt-7 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">{organization?.name ?? session.organizationName}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] text-white sm:text-5xl lg:text-6xl">What needs to happen next?</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">Grid brings supply, demand, discovery, offers, reservations, review state, fulfillment, and economic truth into one place. Eligibility and policy remain server-owned.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {[
            [String(board.metrics.openDemands), "Open needs"],
            [String(board.metrics.activeOffers), "Active offers"],
            [String(board.metrics.heldReservations), "Reservations"],
            [String(resources.length), "My resources"],
          ].map(([value, title]) => <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4" key={title}><p className="text-2xl font-black text-white">{value}</p><p className="mt-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-white/35">{title}</p></div>)}
        </div>
      </div>
    </section>

    <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {primary.map((item) => <Link className="group rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5 transition hover:bg-white/[.055]" href={item.href} key={item.title}><div className="flex items-start justify-between gap-4"><item.icon className="size-5 text-cyan-200" /><ArrowRight className="size-4 text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan-200" /></div><h2 className="mt-6 text-lg font-extrabold text-white">{item.title}</h2><p className="mt-2 text-xs leading-6 text-white/45">{item.body}</p></Link>)}
    </section>

    <section className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">My demand</p><h2 className="mt-2 text-2xl font-black text-white">Needs & current search state</h2></div><Link className="inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/grid/needs/new"><CirclePlus className="size-4" />Post a need</Link></div>
      {board.demands.length ? <div className="mt-5 grid gap-3 lg:grid-cols-2">{board.demands.slice(0, 8).map((demand) => <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={demand.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-1.5"><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white/45">{demand.kind}</span><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-cyan-100">{demand.status}</span></div><h3 className="mt-3 text-sm font-extrabold text-white">{demand.title}</h3><p className="mt-1 text-[10px] text-white/35">{[demand.city, demand.state].filter(Boolean).join(", ") || "Flexible location"}{demand.requestedStartAt ? ` · ${new Date(demand.requestedStartAt).toLocaleString()}` : ""}</p></div>{["open", "matched"].includes(demand.status) ? <Link className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-cyan-200" href={`/grid/needs/${demand.id}/matches`}>Find candidates <ArrowRight className="size-3.5" /></Link> : <Link className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-cyan-200" href="/grid/transactions">Track transaction <ArrowRight className="size-3.5" /></Link>}</div></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-5"><Radar className="size-5 text-cyan-200" /><p className="mt-3 text-sm font-extrabold text-white">No saved needs yet.</p><p className="mt-2 text-xs leading-6 text-white/45">Tell Grid what outcome you need, then discovery can search reviewed supply.</p></div>}
    </section>

    {!clinicalProfessional && <section className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">My supply</p><h2 className="mt-2 text-2xl font-black text-white">Resource readiness</h2></div><Link className="text-xs font-extrabold text-cyan-200" href="/grid/resources">Manage resources →</Link></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{[[String(activeResources), "Approved & active"], [String(pendingReview), "In human review"], [String(Math.max(0, resources.length - activeResources - pendingReview)), "Draft / paused"]].map(([value, title]) => <div className="rounded-2xl border border-white/10 bg-black/20 p-4" key={title}><p className="text-xl font-black text-white">{value}</p><p className="mt-1 text-[10px] text-white/40">{title}</p></div>)}</div>
        {resources.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-5"><Building2 className="size-5 text-cyan-200" /><p className="mt-3 text-sm font-extrabold text-white">Nothing listed yet.</p><p className="mt-2 text-xs leading-6 text-white/45">Create your first reviewed resource, service, equipment listing, or capacity record.</p><Link className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/grid/resources">Create supply <ArrowRight className="size-4" /></Link></div>}
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Economic truth</p>
        <h2 className="mt-2 text-2xl font-black text-white">What Grid currently owes you</h2>
        <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4"><p className="text-xl font-black text-amber-100">{money(board.metrics.pendingToYouCents)}</p><p className="mt-1 text-[10px] text-amber-100/45">Pending / not settled</p></div><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-4"><p className="text-xl font-black text-emerald-100">{money(board.metrics.settledToYouCents)}</p><p className="mt-1 text-[10px] text-emerald-100/45">Settled</p></div></div>
        <Link className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/grid/transactions">Open transaction command <ArrowRight className="size-4" /></Link>
      </div>
    </section>}

    <section className="mt-5 rounded-[1.4rem] border border-amber-200/10 bg-amber-200/[.045] px-4 py-3 text-[10px] leading-5 text-amber-100/70"><ShieldCheck className="mr-2 inline size-4" /><strong className="font-extrabold text-amber-100">Grid safety:</strong> listing, payment, ranking, or model output never bypasses identity, eligibility, credential, jurisdiction, availability, payment-condition, or fulfillment requirements.</section>
  </main>;
}
