"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, CheckCircle2, CircleAlert, CircleDollarSign, FileCheck2, LoaderCircle, RefreshCw, Sparkles, UsersRound } from "lucide-react";
import { demoPaymentStatuses, nextDemoReservationStatuses } from "@/lib/sales-demo-rules";

interface ScenarioView {
  id: string;
  title: string;
  summary: string;
  primaryPainPoint: string;
  syntheticDocument: unknown;
  syntheticReferral: unknown;
  syntheticResult: unknown;
  syntheticBillingItem: unknown;
  syntheticRevenueLeak: unknown;
}

interface RecapView {
  id: string;
  painPoint: string;
  recommendedNextStep: string;
  callToAction: string;
  status: string;
  reviewStatus: string;
  draftedBy: string;
}

interface ReservationView {
  id: string;
  organizationId: string | null;
  clinicName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  clinicType: string;
  providerCount: number;
  locationCount: number;
  biggestPainPoint: string;
  painPoints: unknown;
  currentSystems: unknown;
  estimatedSoftwareSpendCents: number | null;
  selectedOffer: string;
  priceCents: number;
  status: string;
  paymentStatus: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  demoScenario: ScenarioView | null;
  recap: RecapView | null;
  events: { id: string; eventType: string; note: string | null; fromStatus: string | null; toStatus: string | null; createdAt: string }[];
}

export interface SalesAdminWorkspaceData {
  reservations: ReservationView[];
  metrics: { inquiries: number; paidDemoPipeline: number; completed: number; evaluations: number; founding: number; pipelineCents: number };
}

function words(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function auditTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function objectLabel(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Not available";
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : "Not available";
}

export function SalesAdminWorkspace({ initialData }: { initialData: SalesAdminWorkspaceData }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialData.reservations[0]?.id ?? "");
  const [nextStatus, setNextStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("Reviewed by ClinicOS sales owner.");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = data.reservations.find((item) => item.id === selectedId) ?? data.reservations[0];

  async function refresh() {
    const response = await fetch("/api/sales/reservations", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Sales workspace could not refresh.");
    setData(payload.data);
    router.refresh();
  }

  function run(path: string, body?: unknown) {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The action could not be completed.");
        await refresh();
        setNextStatus("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The action could not be completed.");
      }
    });
  }

  const metrics = [
    ["New inquiries", data.metrics.inquiries, UsersRound, "text-cyan-700 bg-cyan-50"],
    ["Paid demo pipeline", data.metrics.paidDemoPipeline, CalendarClock, "text-violet-700 bg-violet-50"],
    ["Completed reviews", data.metrics.completed, CheckCircle2, "text-emerald-700 bg-emerald-50"],
    ["Founding pipeline", data.metrics.evaluations + data.metrics.founding, Sparkles, "text-amber-700 bg-amber-50"],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] bg-[#071018] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.18)] sm:p-9">
        <div className="absolute right-0 top-0 size-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-emerald-200">Live pipeline</span><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-cyan-200">Synthetic demos</span></div><h2 className="mt-5 text-4xl font-black tracking-[-.055em]">Turn clinic pain into a controlled next step.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Payment records are manual. Scenarios are synthetic. Recaps remain drafts until a human approves them.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Open pipeline</p><p className="mt-2 text-3xl font-black">{money(data.metrics.pipelineCents)}</p><p className="mt-1 text-[12px] text-slate-500">Offer value, not collected revenue</p></div></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, style]) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}><span className={`grid size-10 place-items-center rounded-xl ${style}`}><Icon className="size-5" /></span><p className="mt-6 text-3xl font-black tracking-[-.05em] text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></article>)}
      </section>

      {error && <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800" role="alert"><CircleAlert className="size-4 shrink-0" />{error}</div>}

      {selected ? (
        <section className="grid min-h-[680px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm xl:grid-cols-[300px_minmax(0,1fr)_350px]">
          <aside className="border-b border-slate-200 bg-slate-50/80 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-200 p-5"><p className="text-[11px] font-black uppercase tracking-[.16em] text-slate-400">Demo reservations</p><p className="mt-2 text-xs text-slate-500">{data.reservations.length} clinic{data.reservations.length === 1 ? "" : "s"}</p></div>
            <div className="max-h-[620px] overflow-y-auto p-2">{data.reservations.map((reservation) => <button className={`w-full rounded-2xl p-4 text-left transition ${reservation.id === selected.id ? "bg-slate-950 text-white shadow-lg" : "hover:bg-white"}`} key={reservation.id} onClick={() => { setSelectedId(reservation.id); setNextStatus(""); }}><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-black">{reservation.clinicName}</p><span className={`size-2 rounded-full ${reservation.status === "inquiry" ? "bg-cyan-400" : reservation.status === "scheduled" ? "bg-violet-400" : "bg-emerald-400"}`} /></div><p className={`mt-2 text-[12px] ${reservation.id === selected.id ? "text-slate-400" : "text-slate-500"}`}>{words(reservation.status)} · {money(reservation.priceCents)}</p><p className={`mt-3 truncate text-[12px] ${reservation.id === selected.id ? "text-slate-500" : "text-slate-400"}`}>{reservation.contactName} · {reservation.contactRole}</p></button>)}</div>
          </aside>

          <div className="min-w-0 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-teal-700">{selected.clinicType}</p><h3 className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950">{selected.clinicName}</h3><p className="mt-2 text-xs text-slate-500">{selected.providerCount} providers · {selected.locationCount} locations · {selected.contactEmail}</p></div><div className="rounded-2xl bg-slate-950 px-4 py-3 text-white"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Current state</p><p className="mt-1 text-xs font-black">{words(selected.status)}</p></div></div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-400">Offer</p><p className="mt-2 text-xs font-bold text-slate-800">{words(selected.selectedOffer)}</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-400">Payment truth</p><p className="mt-2 text-xs font-bold text-amber-700">{words(selected.paymentStatus)}</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-400">Software estimate</p><p className="mt-2 text-xs font-bold text-slate-800">{selected.estimatedSoftwareSpendCents === null ? "Not provided" : `${money(selected.estimatedSoftwareSpendCents)}/mo`}</p></div></div>

            <section className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-cyan-700">Synthetic scenario</p><h4 className="mt-2 text-xl font-black tracking-[-.035em] text-slate-950">{selected.demoScenario?.title ?? "Scenario not generated"}</h4></div><button className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-[12px] font-black text-slate-700 hover:border-cyan-400 disabled:opacity-50" disabled={pending} onClick={() => run(`/api/sales/reservations/${selected.id}/scenario`)}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Regenerate</button></div>
              <p className="mt-3 text-xs leading-6 text-slate-500">{selected.demoScenario?.summary ?? "Generate a deterministic synthetic scenario from the clinic type and selected pain points."}</p>
              {selected.demoScenario && <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white p-4"><p className="text-[11px] font-black uppercase text-slate-400">Document gap</p><p className="mt-2 text-xs font-bold">{objectLabel(selected.demoScenario.syntheticDocument, "missingItem")}</p></div><div className="rounded-xl bg-white p-4"><p className="text-[11px] font-black uppercase text-slate-400">Handoff state</p><p className="mt-2 text-xs font-bold">{objectLabel(selected.demoScenario.syntheticReferral, "status")}</p></div><div className="rounded-xl bg-white p-4"><p className="text-[11px] font-black uppercase text-slate-400">Result gate</p><p className="mt-2 text-xs font-bold">{objectLabel(selected.demoScenario.syntheticResult, "status")}</p></div><div className="rounded-xl bg-white p-4"><p className="text-[11px] font-black uppercase text-slate-400">Billing gate</p><p className="mt-2 text-xs font-bold">{objectLabel(selected.demoScenario.syntheticBillingItem, "blocker")}</p></div></div>}
            </section>

            <section className="mt-5 rounded-[24px] border border-slate-200 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-violet-700">Demo recap</p><p className="mt-2 text-sm font-black text-slate-950">{selected.recap ? words(selected.recap.reviewStatus) : "Not drafted"}</p></div><button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[12px] font-black text-white disabled:opacity-50" disabled={pending} onClick={() => run(`/api/sales/reservations/${selected.id}/recap`)}><Sparkles className="size-3.5" /> Prepare draft</button></div>{selected.recap && <><p className="mt-4 text-xs leading-6 text-slate-500">{selected.recap.recommendedNextStep}</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-black text-white disabled:opacity-50" disabled={pending || selected.recap.reviewStatus === "approved"} onClick={() => run(`/api/sales/reservations/${selected.id}/recap/review`, { decision: "approve", notes: "Human reviewer approved this synthetic demo recap for clinic follow-up." })}>Approve recap</button><button className="rounded-full border border-slate-300 px-4 py-2 text-[12px] font-black text-slate-700 disabled:opacity-50" disabled={pending} onClick={() => run(`/api/sales/reservations/${selected.id}/recap/review`, { decision: "reject", notes: "Human reviewer returned this recap draft for revision." })}>Return for revision</button></div></>}</section>
          </div>

          <aside className="border-t border-slate-200 bg-[#f8faf9] p-6 xl:border-l xl:border-t-0">
            <p className="text-[11px] font-black uppercase tracking-[.16em] text-slate-400">Next controlled action</p>
            <label className="mt-5 block text-[12px] font-bold text-slate-500">Lifecycle state<select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-teal-500" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}><option value="">Select next state</option>{nextDemoReservationStatuses(selected.status).map((status) => <option key={status} value={status}>{words(status)}</option>)}</select></label>
            <label className="mt-4 block text-[12px] font-bold text-slate-500">Payment record<select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-teal-500" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="">Keep current</option>{demoPaymentStatuses.map((status) => <option key={status} value={status}>{words(status)}</option>)}</select></label>
            {nextStatus === "scheduled" && <label className="mt-4 block text-[12px] font-bold text-slate-500">Scheduled date<input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-teal-500" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>}
            <label className="mt-4 block text-[12px] font-bold text-slate-500">Audit note<textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-500" value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <button className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black text-white disabled:opacity-50" disabled={pending || !nextStatus || note.trim().length < 4} onClick={() => run(`/api/sales/reservations/${selected.id}/transition`, { status: nextStatus, paymentStatus: paymentStatus || undefined, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined, note })}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Record transition</button>

            <div className="mt-8 border-t border-slate-200 pt-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-slate-400">Audit timeline</p><div className="mt-5 space-y-5">{selected.events.map((event) => <div className="relative border-l border-slate-200 pl-5" key={event.id}><span className="absolute -left-1 top-0 size-2 rounded-full bg-teal-500 ring-4 ring-[#f8faf9]" /><p className="text-[12px] font-black text-slate-800">{words(event.eventType)}</p><p className="mt-1 text-[12px] leading-4 text-slate-500">{event.note}</p><p className="mt-2 text-[11px] text-slate-400">{auditTimestamp(event.createdAt)} UTC</p></div>)}</div></div>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-2"><CircleDollarSign className="size-4 shrink-0 text-amber-700" /><div><p className="text-[12px] font-black text-amber-900">Payment honesty</p><p className="mt-1 text-[12px] leading-5 text-amber-800/70">Manual records only. No live processor settlement or automatic payout is claimed.</p></div></div></div>
          </aside>
        </section>
      ) : (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-14 text-center"><FileCheck2 className="mx-auto size-10 text-slate-300" /><h3 className="mt-5 text-xl font-black text-slate-900">No demo inquiries yet</h3><p className="mt-2 text-sm text-slate-500">Public requests from the synthetic-data intake will appear here.</p></section>
      )}
    </div>
  );
}
