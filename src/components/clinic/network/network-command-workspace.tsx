import Link from "next/link";
import {
  ArrowRight, Building2, CircleAlert, Handshake,
  Network, RadioTower, Route, ShieldCheck, Sparkles,
} from "lucide-react";
import { NetworkHandoffActions, NetworkHandoffComposer } from "@/components/clinic/network/network-command-actions";
import type { NetworkCommandWorkspace as NetworkCommandWorkspaceData } from "@/lib/repositories/network-handoff-repository";
import { cn } from "@/lib/utils";

export type NetworkCommandView = "overview" | "map" | "handoffs";

const tabs: Array<{ href: string; label: string; view: NetworkCommandView }> = [
  { href: "/network", label: "Relationships", view: "overview" },
  { href: "/network/handoffs", label: "Handoffs", view: "handoffs" },
  { href: "/network/map", label: "Map", view: "map" },
];

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Not set";
}

function Signal({ children, tone = "slate" }: { children: React.ReactNode; tone?: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold", tones[tone])}>{children}</span>;
}

function Status({ value }: { value: string }) {
  const tone = /active|live|available|received|acknowledged|completed/i.test(value)
    ? "emerald"
    : /pending|ready|review|sent|fax|direct|scheduled|demo/i.test(value)
      ? "amber"
      : /failed|suspended|cancelled|unavailable/i.test(value)
        ? "rose"
        : "slate";
  return <Signal tone={tone}>{title(value)}</Signal>;
}

function NetworkHeader({ view }: { view: NetworkCommandView }) {
  const meta = view === "map"
    ? ["Relationship map", "See the network around this clinic.", "Review partner relationships, capacity, and handoff activity without exposing patient charts."]
    : view === "handoffs"
      ? ["Handoff control", "Every handoff has an owner and a visible state.", "Prepare, review, send, acknowledge, schedule, complete, fail, or recover controlled synthetic handoffs through explicit human actions."]
      : ["Network command", "Connected care, without the clutter.", "Klinikos organizes partner relationships, handoffs, capacity, and fallback paths into one operational view."];

  return <>
    <header className="border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Signal tone="cyan"><RadioTower className="size-3" /> Synthetic demo</Signal>
            <Signal tone="amber">Human review required</Signal>
          </div>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">{meta[0]}</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">{meta[1]}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{meta[2]}</p>
        </div>
        <nav aria-label="Network sections" className="flex flex-wrap gap-2">
          {tabs.map((tab) => <Link className={cn("rounded-lg border px-3 py-2 text-xs font-bold transition", view === tab.view ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950")} href={tab.href} key={tab.view}>{tab.label}</Link>)}
          <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-slate-950" href="/network/directory">Directory</Link>
          <Link className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800" href="/grid">GRID</Link>
        </nav>
      </div>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        <strong>Synthetic demo only.</strong> Do not enter real patient information. A “sent connected” state means visible inside this controlled Klinikos demo only. It does not represent FHIR, HL7, Direct, fax, or vendor acknowledgment.
      </div>
    </header>
  </>;
}

function StatsStrip({ workspace }: { workspace: NetworkCommandWorkspaceData }) {
  const items = [
    ["Connected partners", workspace.metrics.connectedPartners, "Active operating relationships"],
    ["Actions waiting", workspace.metrics.pendingActions, "Human-owned handoff states"],
    ["Failed deliveries", workspace.metrics.failedDeliveries, "Visible recovery queue"],
    ["Open capacity", workspace.metrics.openCapacity, "Synthetic partner availability"],
    ["Manual fallbacks", workspace.metrics.manualFallbacks, "Documented backup paths"],
  ] as const;
  return <section className="mt-5 overflow-x-auto border-y border-slate-200 bg-white">
    <div className="grid min-w-[780px] grid-cols-5 divide-x divide-slate-200">
      {items.map(([label, value, detail]) => <div className="px-4 py-4" key={label}><p className="text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p><p className="mt-1 text-xs font-extrabold text-slate-700">{label}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{detail}</p></div>)}
    </div>
  </section>;
}

function PartnerTable({ workspace }: { workspace: NetworkCommandWorkspaceData }) {
  return <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
      <div><p className="text-sm font-black text-slate-950">Relationships</p><p className="mt-1 text-xs text-slate-500">Operational partner status, capacity, handoffs, and fallback paths.</p></div>
      <Link className="text-xs font-bold text-slate-700 hover:text-slate-950" href="/network/directory">Manage directory <ArrowRight className="ml-1 inline size-3" /></Link>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead><tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-400"><th className="px-4 py-3">Partner</th><th className="px-3 py-3">Relationship</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Open handoffs</th><th className="px-3 py-3">Capacity</th><th className="px-3 py-3">Fallback</th><th className="px-4 py-3">Sharing</th></tr></thead>
        <tbody>{workspace.partners.map((partner) => <tr className="border-b border-slate-100 text-xs last:border-0 hover:bg-slate-50" key={partner.id}>
          <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Building2 className="size-4" /></span><div><p className="font-extrabold text-slate-950">{partner.name}</p><p className="mt-1 text-[10px] text-slate-400">{title(partner.type)} · {partner.locations.length} locations</p></div></div></td>
          <td className="px-3 py-4 text-slate-600">{title(partner.relationshipType)}</td>
          <td className="px-3 py-4"><div className="flex flex-wrap gap-1.5"><Status value={partner.status} /><Status value={partner.integrationStatus} /></div></td>
          <td className="px-3 py-4 font-extrabold text-slate-900">{partner.pendingHandoffs}</td>
          <td className="px-3 py-4"><div className="flex items-center gap-2"><span className="font-extrabold text-slate-900">{partner.capacityAvailable}</span><Status value={partner.capacityStatus} /></div></td>
          <td className="px-3 py-4 text-slate-600">{title(partner.manualFallbackMethod)}</td>
          <td className="px-4 py-4 text-slate-600">{partner.sharingAgreement ? `${title(partner.sharingAgreement.status)} · ${partner.sharingAgreement.dataCategories.length} categories` : "Agreement pending"}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function NetworkMap({ workspace }: { workspace: NetworkCommandWorkspaceData }) {
  return <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><p className="text-sm font-black text-slate-950">Relationship map</p><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Relationships are operational links only. Patient-level access still requires purpose, agreement, consent, and audit.</p></div><Signal tone="emerald"><ShieldCheck className="size-3" /> No chart access implied</Signal></div>
    <div className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_1fr] lg:items-center">
      <div className="space-y-2">{workspace.partners.filter((_, index) => index % 2 === 0).map((partner) => <div className="rounded-lg border border-slate-200 p-3" key={partner.id}><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-950">{partner.name}</p><Status value={partner.status} /></div><p className="mt-1 text-[10px] text-slate-400">{title(partner.relationshipType)} · {partner.pendingHandoffs} open</p></div>)}</div>
      <div className="grid min-h-40 place-items-center rounded-full border border-slate-200 bg-slate-50 text-center"><div><Network className="mx-auto size-6 text-slate-500" /><p className="mt-2 px-3 text-xs font-black text-slate-900">{workspace.currentOrganization.name}</p></div></div>
      <div className="space-y-2">{workspace.partners.filter((_, index) => index % 2 === 1).map((partner) => <div className="rounded-lg border border-slate-200 p-3" key={partner.id}><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-950">{partner.name}</p><Status value={partner.status} /></div><p className="mt-1 text-[10px] text-slate-400">{title(partner.relationshipType)} · {partner.capacityAvailable} capacity</p></div>)}</div>
    </div>
  </section>;
}

function HandoffCard({ handoff, workspace }: { handoff: NetworkCommandWorkspaceData["handoffs"][number]; workspace: NetworkCommandWorkspaceData }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-1.5"><Signal tone={handoff.direction === "inbound" ? "violet" : "cyan"}>{handoff.direction}</Signal><Status value={handoff.status} /><Status value={handoff.priority} /></div><h3 className="mt-4 text-base font-black text-slate-950">{title(handoff.category)}</h3><p className="mt-1 text-xs text-slate-500">{handoff.sourceOrganizationName} → {handoff.destinationOrganizationName}</p></div><p className="text-right text-[10px] leading-4 text-slate-400">Updated<br />{formatDate(handoff.updatedAt)}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border-t border-slate-200 pt-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Patient</p><p className="mt-1 text-xs font-bold text-slate-700">{handoff.patientName}</p><p className="mt-1 text-[10px] text-slate-400">{handoff.patientMrn}</p></div><div className="border-t border-slate-200 pt-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Authority</p><p className="mt-1 text-xs font-bold text-slate-700">{title(handoff.purposeOfUse)}</p><p className="mt-1 text-[10px] text-slate-400">{handoff.dataCategories.length} minimum categories</p></div><div className="border-t border-slate-200 pt-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Delivery</p><p className="mt-1 text-xs font-bold text-slate-700">{title(handoff.deliveryMethod)}</p><p className="mt-1 text-[10px] text-slate-400">{handoff.humanReviewRequired ? "Human review required" : "Review policy"}</p></div></div><p className="mt-4 text-xs leading-5 text-slate-600">{handoff.requestedAction}</p>{handoff.failureReason && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">{handoff.failureReason}</p>}<div className="mt-4 flex flex-wrap gap-1.5">{handoff.dataCategories.map((category) => <Signal key={category}>{title(category)}</Signal>)}<Signal tone="amber">Due {formatDate(handoff.dueAt)}</Signal></div>{handoff.events.length > 0 && <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-[10px] font-bold text-slate-600">Audit trail · {handoff.events.length} events</summary><div className="mt-3 space-y-2">{handoff.events.map((event) => <div className="flex items-start justify-between gap-3 text-[10px] leading-4 text-slate-500" key={event.id}><span><strong className="text-slate-700">{title(event.action)}</strong>{event.note ? ` · ${event.note}` : ""}</span><span className="shrink-0">{formatDate(event.createdAt)}</span></div>)}</div></details>}<div className="mt-4"><NetworkHandoffActions canUpdate={workspace.permissions.canUpdate} handoff={handoff} /></div></article>;
}

function HandoffBoard({ workspace }: { workspace: NetworkCommandWorkspaceData }) {
  return <section className="mt-5"><div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><NetworkHandoffComposer workspace={workspace} /><div className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Delivery protocol</p><h3 className="mt-2 text-lg font-black text-slate-950">Truthful status sequence</h3></div><Route className="size-5 text-slate-400" /></div><div className="mt-5 divide-y divide-slate-100">{[["Connected", "Ready → Sent connected → Received → Acknowledged → Scheduled → Completed"], ["Manual", "Ready → Sent manual → Receipt confirmation → Completed"], ["Fax", "Ready → Fax pending → Received or Failed → Retry"], ["Direct", "Ready → Direct pending → Received or Failed → Retry"]].map(([label, detail]) => <div className="py-3" key={label}><p className="text-xs font-black text-slate-800">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>)}</div><div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>No silent delivery.</strong> Fax and Direct remain pending until a human records receipt. Failed delivery stays visible and recoverable.</div></div></div><div className="mt-5 grid gap-4 xl:grid-cols-2">{workspace.handoffs.map((handoff) => <HandoffCard handoff={handoff} key={handoff.id} workspace={workspace} />)}{!workspace.handoffs.length && <p className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500 xl:col-span-2">No governed partner handoffs have been prepared.</p>}</div></section>;
}

function Overview({ workspace }: { workspace: NetworkCommandWorkspaceData }) {
  return <><StatsStrip workspace={workspace} /><PartnerTable workspace={workspace} /><div className="mt-5 grid gap-4 lg:grid-cols-3"><Link className="group rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300" href="/network/handoffs"><Handshake className="size-5 text-slate-500" /><h3 className="mt-4 text-base font-black text-slate-950">Compose a governed handoff</h3><p className="mt-2 text-xs leading-5 text-slate-500">Select patient, partner, purpose, categories, consent path, and delivery method.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-700">Open handoffs <ArrowRight className="size-3 transition group-hover:translate-x-1" /></span></Link><Link className="group rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300" href="/grid"><Sparkles className="size-5 text-violet-500" /><h3 className="mt-4 text-base font-black text-slate-950">Find network capacity</h3><p className="mt-2 text-xs leading-5 text-slate-500">Move into credential-aware providers, locations, services, and availability.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-700">Open GRID <ArrowRight className="size-3 transition group-hover:translate-x-1" /></span></Link><Link className="group rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300" href="/network/directory"><CircleAlert className="size-5 text-amber-500" /><h3 className="mt-4 text-base font-black text-slate-950">Manage relationship authority</h3><p className="mt-2 text-xs leading-5 text-slate-500">Review relationship state, agreements, connection status, and fallback operations.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-700">Open directory <ArrowRight className="size-3 transition group-hover:translate-x-1" /></span></Link></div></>;
}

export function NetworkCommandWorkspace({ view, workspace }: { view: NetworkCommandView; workspace: NetworkCommandWorkspaceData }) {
  return <div className="space-y-0"><NetworkHeader view={view} />{view === "overview" && <Overview workspace={workspace} />}{view === "map" && <><StatsStrip workspace={workspace} /><NetworkMap workspace={workspace} /><PartnerTable workspace={workspace} /></>}{view === "handoffs" && <HandoffBoard workspace={workspace} />}</div>;
}
