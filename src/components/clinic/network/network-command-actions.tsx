"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { networkHandoffCategories, networkHandoffDeliveryMethods } from "@/lib/network-handoff-rules";
import type { NetworkCommandWorkspace } from "@/lib/repositories/network-handoff-repository";

const fieldClass = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/55 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10";
const textAreaClass = "min-h-24 w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-5 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/55 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10";
const labelClass = "space-y-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-white/40";

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Feedback({ busy, error, success }: { busy: boolean; error: string | null; success: string | null }) {
  return <div aria-live="polite" className="min-h-5 pt-2">{busy && <p className="flex items-center gap-2 text-[10px] font-bold text-cyan-200"><LoaderCircle className="size-3 animate-spin" /> Recording governed action...</p>}{error && <p className="text-[10px] font-bold text-rose-300" role="alert">{error}</p>}{success && <p className="text-[10px] font-bold text-emerald-300">{success}</p>}</div>;
}

export function NetworkHandoffComposer({ workspace }: { workspace: NetworkCommandWorkspace }) {
  const router = useRouter();
  const eligiblePartners = workspace.partners.filter((partner) => partner.status === "active" && partner.sharingAgreement?.status.startsWith("active"));
  const [patientId, setPatientId] = useState(workspace.patients[0]?.id ?? "");
  const [destinationOrganizationId, setDestinationOrganizationId] = useState(eligiblePartners[0]?.id ?? "");
  const [category, setCategory] = useState<(typeof networkHandoffCategories)[number]>("referral_request");
  const [purposeOfUse, setPurposeOfUse] = useState<"treatment" | "payment" | "operations">("treatment");
  const [deliveryMethod, setDeliveryMethod] = useState<(typeof networkHandoffDeliveryMethods)[number]>("connected_network");
  const [priority, setPriority] = useState("normal");
  const [dueAt, setDueAt] = useState("2026-08-20T16:00");
  const [dataCategories, setDataCategories] = useState<string[]>(["demographics", "referrals"]);
  const [requestedAction, setRequestedAction] = useState("Review the synthetic request, confirm capacity, and return an accountable next step.");
  const [summary, setSummary] = useState("Synthetic coordination request containing only the minimum labels required to route the handoff.");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const categoryOptions = ["demographics", "referrals", "approved_visit_summary", "labs", "imaging", "care_plans"];

  async function submit() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/network/handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, destinationOrganizationId, category, purposeOfUse, dataCategories, requestedAction, priority, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined, deliveryMethod, minimumNecessarySummary: summary, humanConfirmed: confirmed }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The handoff could not be prepared.");
      setSuccess("Handoff prepared with consent, agreement, and dual-organization audit receipts.");
      setConfirmed(false);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The handoff could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  if (!workspace.permissions.canCreate) return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/45">Network create permission is required to prepare a handoff.</p>;
  if (workspace.mode !== "synthetic_demo") return <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-xs leading-6 text-amber-100">Requires production review. This composer is intentionally locked outside synthetic demo mode.</p>;

  return <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">Controlled composer</p><h3 className="mt-2 text-xl font-black tracking-[-.04em] text-white">Prepare a partner handoff</h3><p className="mt-2 max-w-xl text-[10px] leading-5 text-white/40">A send never exposes a full chart. Authority, purpose, categories, consent, agreement, and the human actor are recorded first.</p></div><ShieldCheck className="size-6 shrink-0 text-cyan-200" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className={labelClass}>Synthetic patient<select className={fieldClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{workspace.patients.map((patient) => <option className="bg-slate-950" key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label><label className={labelClass}>Recipient<select className={fieldClass} onChange={(event) => setDestinationOrganizationId(event.target.value)} value={destinationOrganizationId}>{eligiblePartners.map((partner) => <option className="bg-slate-950" key={partner.id} value={partner.id}>{partner.name} · {title(partner.relationshipType)}</option>)}</select></label><label className={labelClass}>Handoff category<select className={fieldClass} onChange={(event) => setCategory(event.target.value as typeof category)} value={category}>{networkHandoffCategories.map((value) => <option className="bg-slate-950" key={value}>{value}</option>)}</select></label><label className={labelClass}>Purpose of use<select className={fieldClass} onChange={(event) => setPurposeOfUse(event.target.value as typeof purposeOfUse)} value={purposeOfUse}>{["treatment", "payment", "operations"].map((value) => <option className="bg-slate-950" key={value}>{value}</option>)}</select></label><label className={labelClass}>Delivery path<select className={fieldClass} onChange={(event) => setDeliveryMethod(event.target.value as typeof deliveryMethod)} value={deliveryMethod}>{networkHandoffDeliveryMethods.map((value) => <option className="bg-slate-950" key={value}>{value}</option>)}</select></label><label className={labelClass}>Priority<select className={fieldClass} onChange={(event) => setPriority(event.target.value)} value={priority}>{["normal", "high", "urgent", "needs_provider"].map((value) => <option className="bg-slate-950" key={value}>{value}</option>)}</select></label><label className={labelClass}>Due by<input className={fieldClass} onChange={(event) => setDueAt(event.target.value)} type="datetime-local" value={dueAt} /></label><div className={labelClass}><span>Minimum-necessary categories</span><div className="flex min-h-11 flex-wrap items-center gap-1.5">{categoryOptions.map((value) => <label className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[8px] font-bold normal-case tracking-normal text-white/55" key={value}><input checked={dataCategories.includes(value)} className="accent-cyan-400" onChange={(event) => setDataCategories((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} type="checkbox" />{title(value)}</label>)}</div></div><label className={`${labelClass} sm:col-span-2`}>Requested human action<textarea className={textAreaClass} onChange={(event) => setRequestedAction(event.target.value)} value={requestedAction} /></label><label className={`${labelClass} sm:col-span-2`}>Minimum-necessary summary<textarea className={textAreaClass} onChange={(event) => setSummary(event.target.value)} value={summary} /></label></div><label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-[10px] leading-5 text-amber-100/75"><input checked={confirmed} className="mt-1 accent-amber-300" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span><strong className="text-amber-100">Human confirmation required.</strong> I verified the recipient, purpose, selected synthetic patient, minimum-necessary categories, and delivery path. I understand this does not prove an external vendor delivered anything.</span></label><Button className="mt-4 bg-cyan-300 text-slate-950 hover:bg-cyan-200" disabled={busy || !confirmed || !patientId || !destinationOrganizationId || dataCategories.length === 0} onClick={submit} size="sm"><Send className="size-3.5" /> Prepare handoff</Button><Feedback busy={busy} error={error} success={success} /></div>;
}

function actionsFor(handoff: NetworkCommandWorkspace["handoffs"][number]) {
  if (handoff.direction === "outbound") {
    if (handoff.status === "ready_to_send") {
      if (handoff.deliveryMethod === "connected_network") return [{ action: "send_connected", label: "Send inside ClinicOS" }];
      if (handoff.deliveryMethod === "manual") return [{ action: "send_manual", label: "Record manual send" }];
      if (handoff.deliveryMethod === "fax") return [{ action: "queue_fax", label: "Queue fax fallback" }];
      return [{ action: "queue_direct", label: "Queue Direct fallback" }];
    }
    if (handoff.status === "failed") return [{ action: "retry", label: "Return to review" }];
    if (!["completed", "cancelled"].includes(handoff.status)) return [{ action: "cancel", label: "Cancel" }];
    return [];
  }
  if (["sent_connected", "sent_manual", "fax_pending", "direct_pending"].includes(handoff.status)) return [{ action: "mark_received", label: "Confirm receipt" }, { action: "request_clarification", label: "Need clarification" }];
  if (handoff.status === "received") return [{ action: "acknowledge", label: "Acknowledge" }, { action: "request_clarification", label: "Need clarification" }];
  if (handoff.status === "needs_clarification") return [{ action: "acknowledge", label: "Acknowledge response" }];
  if (handoff.status === "acknowledged") return [{ action: "schedule", label: "Schedule" }, { action: "complete", label: "Complete" }];
  if (handoff.status === "scheduled") return [{ action: "complete", label: "Complete" }];
  return [];
}

export function NetworkHandoffActions({ canUpdate, handoff }: { canUpdate: boolean; handoff: NetworkCommandWorkspace["handoffs"][number] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("Human reviewer verified this synthetic handoff action and recorded the delivery evidence available.");
  const actions = actionsFor(handoff);
  if (!canUpdate || actions.length === 0) return null;

  async function run(action: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/network/handoffs/${handoff.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note, scheduledAt: action === "schedule" ? new Date(Date.now() + 86_400_000).toISOString() : undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The handoff could not be updated.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The handoff could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-4 border-t border-white/8 pt-4"><textarea aria-label="Human transition note" className={`${textAreaClass} min-h-16`} onChange={(event) => setNote(event.target.value)} value={note} /><div className="mt-2 flex flex-wrap gap-2">{actions.map((item) => <button className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] px-2.5 py-1.5 text-[9px] font-extrabold text-cyan-100 transition hover:bg-cyan-300/[0.15] disabled:opacity-50" disabled={busy || note.trim().length < 8} key={item.action} onClick={() => run(item.action)}>{busy ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-3" />}{item.label}</button>)}</div>{error && <p className="mt-2 text-[9px] font-bold text-rose-300" role="alert">{error}</p>}</div>;
}
