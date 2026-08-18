"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Scale, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const disputeStatuses = [
  ["under_review", "Under review"],
  ["info_required", "Information required"],
  ["resolved_requester", "Resolve for requester"],
  ["resolved_counterparty", "Resolve for counterparty"],
  ["split_resolution", "Split resolution"],
  ["refund_recommended", "Refund recommended"],
  ["escalated", "Escalated"],
  ["closed", "Close issue"],
] as const;

const safetyStatuses = [
  ["triage_required", "Triage required"],
  ["under_review", "Under review"],
  ["restriction_recommended", "Restriction recommended"],
  ["resource_hold_recommended", "Resource hold recommended"],
  ["referred_to_governance", "Refer to governance"],
  ["closed", "Close incident"],
] as const;

type Queue = {
  disputes: Array<{
    id: string;
    reservationId: string;
    category: string;
    summary: string;
    requestedOutcome: string | null;
    status: string;
    resolutionNote: string | null;
    ownerOrganizationName: string;
    openedByOrganizationName: string;
    demandTitle: string;
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
    ownerOrganizationName: string;
    reportedByOrganizationName: string;
    demandTitle: string;
    updatedAt: string;
  }>;
  metrics: {
    openDisputes: number;
    openSafetyIncidents: number;
    urgentSafetyIncidents: number;
  };
};

function human(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function ReviewAction({ type, id, currentStatus }: { type: "dispute" | "safety"; id: string; currentStatus: string }) {
  const router = useRouter();
  const options = type === "dispute" ? disputeStatuses : safetyStatuses;
  const [targetStatus, setTargetStatus] = useState(options[0][0] as string);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (note.trim().length < 8) {
      setMessage({ ok: false, text: "Add a review note explaining the decision." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const endpoint = type === "dispute" ? `/api/grid/disputes/${id}` : `/api/grid/safety-incidents/${id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, note }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? payload.details?.[0]?.message ?? "Grid review transition failed.");
      setMessage({ ok: true, text: "Review state updated." });
      setNote("");
      router.refresh();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Grid review transition failed." });
    } finally {
      setBusy(false);
    }
  }

  if (currentStatus === "closed") return <p className="mt-4 text-[12px] font-bold text-emerald-200/70">Closed. Historical record retained.</p>;

  return <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
    <div className="grid gap-2 sm:grid-cols-[.7fr_1.3fr]">
      <select className="h-10 rounded-lg border border-white/10 bg-black/30 px-2 text-[12px] font-bold text-white" value={targetStatus} onChange={(event) => setTargetStatus(event.target.value)}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <input className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-[12px] text-white outline-none" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Decision / evidence note" />
    </div>
    {message && <p className={`mt-2 text-[12px] ${message.ok ? "text-emerald-200" : "text-rose-200"}`}>{message.ok ? <CheckCircle2 className="mr-1 inline size-3" /> : <AlertTriangle className="mr-1 inline size-3" />}{message.text}</p>}
    <Button className="mt-3" size="sm" disabled={busy} onClick={submit}>{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : null}Apply review state</Button>
  </div>;
}

export function GridTrustReviewQueue({ queue }: { queue: Queue }) {
  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3">
      {[[String(queue.metrics.openDisputes), "Open disputes"], [String(queue.metrics.openSafetyIncidents), "Open safety incidents"], [String(queue.metrics.urgentSafetyIncidents), "Urgent safety"]].map(([value, label]) => <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4" key={label}><p className="text-2xl font-black text-white">{value}</p><p className="mt-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-white/35">{label}</p></div>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
        <div className="flex items-center gap-2"><Scale className="size-4 text-cyan-200"/><div><p className="text-[12px] font-black uppercase tracking-[.16em] text-cyan-200">Commercial review</p><h2 className="mt-1 text-xl font-black text-white">Marketplace disputes</h2></div></div>
        <div className="mt-5 space-y-4">{queue.disputes.length ? queue.disputes.map((item) => <article className="rounded-xl border border-white/10 bg-black/15 p-4" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-white">{item.demandTitle}</p><p className="mt-1 text-[12px] text-white/35">Owner: {item.ownerOrganizationName} · Opened by: {item.openedByOrganizationName}</p></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[.06] px-2 py-1 text-[11px] font-black uppercase tracking-[.1em] text-cyan-100">{human(item.status)}</span></div><p className="mt-3 text-[12px] font-bold uppercase tracking-[.1em] text-white/35">{human(item.category)}</p><p className="mt-2 text-[11px] leading-5 text-white/50">{item.summary}</p>{item.requestedOutcome && <p className="mt-2 text-[12px] leading-5 text-cyan-100/60"><strong>Requested outcome:</strong> {item.requestedOutcome}</p>}<ReviewAction currentStatus={item.status} id={item.id} type="dispute" /></article>) : <p className="rounded-xl border border-dashed border-white/15 p-5 text-xs text-white/35">No disputes in the review queue.</p>}</div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[.03] p-5 sm:p-6">
        <div className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-200"/><div><p className="text-[12px] font-black uppercase tracking-[.16em] text-amber-200">Safety governance</p><h2 className="mt-1 text-xl font-black text-white">Safety incidents</h2></div></div>
        <div className="mt-5 space-y-4">{queue.safetyIncidents.length ? queue.safetyIncidents.map((item) => <article className="rounded-xl border border-white/10 bg-black/15 p-4" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-white">{item.demandTitle}</p><p className="mt-1 text-[12px] text-white/35">Owner: {item.ownerOrganizationName} · Reported by: {item.reportedByOrganizationName}</p></div><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-black uppercase tracking-[.12em] text-amber-200/75">{item.severity}</span><span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-2 py-1 text-[11px] font-black uppercase tracking-[.1em] text-amber-100">{human(item.status)}</span></div></div><p className="mt-3 text-[12px] font-bold uppercase tracking-[.1em] text-white/35">{human(item.category)}</p><p className="mt-2 text-[11px] leading-5 text-white/50">{item.summary}</p><ReviewAction currentStatus={item.status} id={item.id} type="safety" /></article>) : <p className="rounded-xl border border-dashed border-white/15 p-5 text-xs text-white/35">No safety incidents in the review queue.</p>}</div>
      </div>
    </section>
  </div>;
}
