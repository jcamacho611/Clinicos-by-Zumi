"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Flag, LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const disputeCategories = [
  ["no_show", "No-show"],
  ["cancellation", "Cancellation"],
  ["facility_unavailable", "Facility unavailable"],
  ["service_not_completed", "Service not completed"],
  ["payment_disagreement", "Payment disagreement"],
  ["payout_disagreement", "Payout disagreement"],
  ["resource_unavailable", "Resource unavailable"],
  ["other", "Other marketplace issue"],
] as const;

const safetyCategories = [
  ["adverse_event_concern", "Adverse-event concern"],
  ["credential_concern", "Credential concern"],
  ["unsafe_facility", "Unsafe facility concern"],
  ["unsafe_equipment", "Unsafe equipment concern"],
  ["scope_concern", "Scope / eligibility concern"],
  ["conduct_concern", "Conduct concern"],
  ["other", "Other safety concern"],
] as const;

type Workspace = {
  summary: {
    reservations: number;
    fulfilled: number;
    failed: number;
    partial: number;
    activeDisputes: number;
    totalDisputes: number;
    activeSafetyIncidents: number;
    totalSafetyIncidents: number;
    repeatCounterparties: number;
    fulfillmentRate: number | null;
    note: string;
  };
  reservations: Array<{
    id: string;
    demandTitle: string;
    status: string;
    fulfillmentStatus: string;
    reservedStartAt: string;
    senderName: string | null;
    recipientName: string | null;
  }>;
  disputes: Array<{
    id: string;
    reservationId: string;
    category: string;
    summary: string;
    requestedOutcome: string | null;
    status: string;
    resolutionNote: string | null;
    updatedAt: string;
  }>;
  safetyIncidents: Array<{
    id: string;
    reservationId: string;
    category: string;
    severity: string;
    summary: string;
    status: string;
    resolutionNote: string | null;
    updatedAt: string;
  }>;
};

function human(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Status({ value }: { value: string }) {
  const closed = value === "closed";
  return <span className={`rounded-full border px-2 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] ${closed ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{human(value)}</span>;
}

export function GridTrustWorkspace({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const [reservationId, setReservationId] = useState(workspace.reservations[0]?.id ?? "");
  const [mode, setMode] = useState<"dispute" | "safety">("dispute");
  const [category, setCategory] = useState<string>(disputeCategories[0][0]);
  const [severity, setSeverity] = useState("medium");
  const [summary, setSummary] = useState("");
  const [requestedOutcome, setRequestedOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function switchMode(next: "dispute" | "safety") {
    setMode(next);
    setCategory(next === "dispute" ? disputeCategories[0][0] : safetyCategories[0][0]);
    setMessage(null);
  }

  async function submit() {
    if (!reservationId || summary.trim().length < 12) {
      setMessage({ ok: false, text: "Choose a reservation and add enough factual detail to explain the issue." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const endpoint = mode === "dispute"
        ? `/api/grid/reservations/${reservationId}/disputes`
        : `/api/grid/reservations/${reservationId}/safety-incidents`;
      const body = mode === "dispute"
        ? { category, summary, requestedOutcome: requestedOutcome.trim() || null }
        : { category, severity, summary };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? payload.details?.[0]?.message ?? "Grid could not record this issue.");

      setSummary("");
      setRequestedOutcome("");
      setMessage({
        ok: true,
        text: mode === "dispute"
          ? "Marketplace dispute opened. Normal fulfillment and settlement remain held while it is active."
          : "Safety incident recorded for governance review. The report does not itself make a medical determination or execute a restriction.",
      });
      router.refresh();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Grid could not record this issue." });
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        [String(workspace.summary.reservations), "Transactions"],
        [String(workspace.summary.fulfilled), "Fulfilled"],
        [workspace.summary.fulfillmentRate == null ? "—" : `${Math.round(workspace.summary.fulfillmentRate * 100)}%`, "Fulfillment rate"],
        [String(workspace.summary.activeDisputes), "Open disputes"],
        [String(workspace.summary.activeSafetyIncidents), "Open safety reports"],
      ].map(([value, label]) => <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4" key={label}><p className="text-2xl font-black text-white">{value}</p><p className="mt-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-white/35">{label}</p></div>)}
    </section>

    <section className="rounded-[1.6rem] border border-white/10 bg-[#070b13] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[12px] font-black uppercase tracking-[.18em] text-cyan-200">Objective trust</p><h2 className="mt-2 text-2xl font-black text-white">Transaction history, not a popularity score.</h2><p className="mt-3 max-w-3xl text-xs leading-6 text-white/45">{workspace.summary.note}</p></div><div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-right"><p className="text-lg font-black text-white">{workspace.summary.repeatCounterparties}</p><p className="text-[11px] uppercase tracking-[.12em] text-white/35">Repeat relationships</p></div></div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-amber-200">Report an issue</p>
        <h2 className="mt-2 text-2xl font-black text-white">Business dispute or safety concern?</h2>
        <p className="mt-3 text-xs leading-6 text-white/45">Use a dispute for commercial or fulfillment disagreement. Use a safety incident when the concern involves credentials, scope, conduct, facility, equipment, or possible adverse-event risk.</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => switchMode("dispute")} className={`rounded-xl border p-3 text-left ${mode === "dispute" ? "border-cyan-300/30 bg-cyan-300/[.08]" : "border-white/10 bg-black/15"}`}><Flag className="size-4 text-cyan-200"/><p className="mt-2 text-xs font-extrabold text-white">Marketplace dispute</p></button>
          <button type="button" onClick={() => switchMode("safety")} className={`rounded-xl border p-3 text-left ${mode === "safety" ? "border-amber-300/30 bg-amber-300/[.08]" : "border-white/10 bg-black/15"}`}><ShieldAlert className="size-4 text-amber-200"/><p className="mt-2 text-xs font-extrabold text-white">Safety incident</p></button>
        </div>

        <label className="mt-5 block text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Reservation<select className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white" value={reservationId} onChange={(event) => setReservationId(event.target.value)}><option value="">Choose reservation</option>{workspace.reservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.demandTitle} · {new Date(reservation.reservedStartAt).toLocaleString()}</option>)}</select></label>

        <label className="mt-4 block text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Category<select className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white" value={category} onChange={(event) => setCategory(event.target.value)}>{(mode === "dispute" ? disputeCategories : safetyCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

        {mode === "safety" && <label className="mt-4 block text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Severity<select className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>}

        <label className="mt-4 block text-[11px] font-bold uppercase tracking-[.12em] text-white/40">What happened?<textarea className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white outline-none" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="State observable facts. Do not use this box for patient records or broad PHI." /></label>
        {mode === "dispute" && <label className="mt-4 block text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Requested outcome<textarea className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white outline-none" value={requestedOutcome} onChange={(event) => setRequestedOutcome(event.target.value)} placeholder="Example: review cancellation charge; release reservation; recommend refund review." /></label>}

        {message && <p className={`mt-4 rounded-xl border px-4 py-3 text-[12px] leading-5 ${message.ok ? "border-emerald-300/20 bg-emerald-300/[.06] text-emerald-100" : "border-rose-300/20 bg-rose-300/[.06] text-rose-100"}`}>{message.ok ? <CheckCircle2 className="mr-1.5 inline size-3.5" /> : <AlertTriangle className="mr-1.5 inline size-3.5" />}{message.text}</p>}
        <Button className="mt-5" disabled={busy || !workspace.reservations.length} onClick={submit}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : mode === "dispute" ? <Flag className="size-4" /> : <ShieldAlert className="size-4" />}{mode === "dispute" ? "Open dispute" : "Report safety incident"}</Button>
      </div>

      <div className="space-y-5">
        <section className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
          <div className="flex items-center gap-2"><Flag className="size-4 text-cyan-200"/><h2 className="text-lg font-black text-white">Marketplace disputes</h2></div>
          <div className="mt-4 space-y-3">{workspace.disputes.length ? workspace.disputes.map((item) => <article className="rounded-xl border border-white/10 bg-black/20 p-4" key={item.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold text-white">{human(item.category)}</p><Status value={item.status}/></div><p className="mt-2 text-[11px] leading-5 text-white/50">{item.summary}</p>{item.requestedOutcome && <p className="mt-2 text-[12px] leading-5 text-cyan-100/55"><strong>Requested outcome:</strong> {item.requestedOutcome}</p>}{item.resolutionNote && <p className="mt-2 text-[12px] leading-5 text-emerald-100/55"><strong>Review note:</strong> {item.resolutionNote}</p>}</article>) : <p className="rounded-xl border border-dashed border-white/15 p-5 text-xs text-white/35">No marketplace disputes recorded.</p>}</div>
        </section>

        <section className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
          <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-200"/><h2 className="text-lg font-black text-white">Safety incidents</h2></div>
          <div className="mt-4 space-y-3">{workspace.safetyIncidents.length ? workspace.safetyIncidents.map((item) => <article className="rounded-xl border border-white/10 bg-black/20 p-4" key={item.id}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-white">{human(item.category)}</p><span className="text-[11px] font-black uppercase tracking-[.12em] text-amber-200/70">{item.severity}</span></div><Status value={item.status}/></div><p className="mt-2 text-[11px] leading-5 text-white/50">{item.summary}</p>{item.resolutionNote && <p className="mt-2 text-[12px] leading-5 text-emerald-100/55"><strong>Governance note:</strong> {item.resolutionNote}</p>}</article>) : <p className="rounded-xl border border-dashed border-white/15 p-5 text-xs text-white/35">No safety incidents recorded.</p>}</div>
        </section>
      </div>
    </section>
  </div>;
}
