"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarClock, CheckCheck, FilePenLine, LoaderCircle, RadioTower, RotateCcw, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fieldClass = "mt-1 h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

async function parseResponse<T>(response: Response) {
  const body = await response.json() as { error?: string; data?: T };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body.data as T;
}

function Feedback({ error, message }: { error: string; message: string }) {
  return <>{message && <p className="text-[12px] font-bold text-emerald-700" role="status">{message}</p>}{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</>;
}

interface ImagingPatient { id: string; name: string; mrn: string }
interface ImagingProvider { id: string; label: string }
interface ImagingIntegration { id: string; vendor: string; active: boolean }
interface ImagingAuthorization { id: string; patientId: string; payer: string; service: string; referenceNumber: string | null; status: string }
interface ImagingDocument { id: string; patientId: string | null; name: string }
interface ImagingOrderOption { id: string; patientId: string; patientName: string; study: string; modality: string; facility: string | null; status: string }

export function CreateImagingOrderControl({ patients, providers, integrations, priorAuthorizations, disabled = false }: {
  patients: ImagingPatient[];
  providers: ImagingProvider[];
  integrations: ImagingIntegration[];
  priorAuthorizations: ImagingAuthorization[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [study, setStudy] = useState("Coronary artery calcium CT");
  const [modality, setModality] = useState("ct");
  const [bodyPart, setBodyPart] = useState("Heart");
  const [laterality, setLaterality] = useState("none");
  const [diagnosisCodes, setDiagnosisCodes] = useState("E78.5");
  const [clinicalIndication, setClinicalIndication] = useState("Cardiovascular risk evaluation requested by the treating provider and documented in the chart.");
  const [priority, setPriority] = useState("routine");
  const [facility, setFacility] = useState("Community Diagnostic Imaging");
  const [priorAuthorizationId, setPriorAuthorizationId] = useState("");
  const [authorizationStatus, setAuthorizationStatus] = useState("not_required");
  const [deliveryMethod, setDeliveryMethod] = useState("manual");
  const [integrationId, setIntegrationId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const patientAuthorizations = priorAuthorizations.filter((item) => item.patientId === patientId);
  const activeIntegrations = integrations.filter((item) => item.active);

  async function createOrder() {
    setPending(true); setError(""); setMessage("");
    try {
      await parseResponse(await fetch("/api/imaging/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, providerId, study, modality, bodyPart, laterality, diagnosisCodes: diagnosisCodes.split(",").map((code) => code.trim()).filter(Boolean), clinicalIndication, priority, facility, priorAuthorizationId: priorAuthorizationId || undefined, authorizationStatus, deliveryMethod, integrationId: deliveryMethod === "electronic_adapter" ? integrationId : undefined }),
      }));
      setMessage("Imaging order created in draft with chart and provenance checks complete.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Order creation failed.");
    } finally { setPending(false); }
  }

  const unavailable = disabled || pending || !patientId || !providerId || study.trim().length < 2 || bodyPart.trim().length < 2 || clinicalIndication.trim().length < 8 || !facility || !diagnosisCodes.trim() || (deliveryMethod === "electronic_adapter" && !integrationId) || (authorizationStatus !== "not_required" && !priorAuthorizationId);
  return <div className="space-y-4 p-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Patient<select className={fieldClass} onChange={(event) => { setPatientId(event.target.value); setPriorAuthorizationId(""); setAuthorizationStatus("not_required"); }} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Ordering provider<select className={fieldClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Study<Input className="mt-1" onChange={(event) => setStudy(event.target.value)} value={study} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Modality<select className={fieldClass} onChange={(event) => setModality(event.target.value)} value={modality}>{["xray", "ct", "mri", "ultrasound", "mammography", "pet", "dexa", "fluoroscopy", "nuclear_medicine", "other"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ").toUpperCase()}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Body part<Input className="mt-1" onChange={(event) => setBodyPart(event.target.value)} value={bodyPart} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Laterality<select className={fieldClass} onChange={(event) => setLaterality(event.target.value)} value={laterality}>{["none", "left", "right", "bilateral"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Chart diagnosis codes<Input className="mt-1" onChange={(event) => setDiagnosisCodes(event.target.value)} placeholder="R05.9, R06.02" value={diagnosisCodes} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Priority<select className={fieldClass} onChange={(event) => setPriority(event.target.value)} value={priority}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Imaging facility<Input className="mt-1" onChange={(event) => setFacility(event.target.value)} value={facility} /></label>
    </div>
    <label className="block text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Clinical indication<textarea className={`${fieldClass} min-h-20 py-3`} onChange={(event) => setClinicalIndication(event.target.value)} value={clinicalIndication} /></label>
    <div className="grid gap-3 rounded-2xl bg-indigo-50/70 p-4 sm:grid-cols-3">
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-indigo-800">Authorization<select className={fieldClass} onChange={(event) => setAuthorizationStatus(event.target.value)} value={authorizationStatus}><option value="not_required">Not required</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="expired">Expired</option></select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-indigo-800">Authorization record<select className={fieldClass} disabled={authorizationStatus === "not_required"} onChange={(event) => setPriorAuthorizationId(event.target.value)} value={priorAuthorizationId}><option value="">Select patient record</option>{patientAuthorizations.map((item) => <option key={item.id} value={item.id}>{item.payer} · {item.service} · {item.status}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-indigo-800">Delivery pathway<select className={fieldClass} onChange={(event) => setDeliveryMethod(event.target.value)} value={deliveryMethod}>{["manual", "print", "fax", "direct", "electronic_adapter"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
      {deliveryMethod === "electronic_adapter" && <label className="text-[11px] font-black uppercase tracking-[.12em] text-indigo-800 sm:col-span-3">Active adapter<select className={fieldClass} onChange={(event) => setIntegrationId(event.target.value)} value={integrationId}><option value="">Select tested adapter</option>{activeIntegrations.map((item) => <option key={item.id} value={item.id}>{item.vendor}</option>)}</select></label>}
    </div>
    <div className="flex flex-wrap items-center gap-3"><Button disabled={unavailable} onClick={createOrder} variant="primary">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} Create draft order</Button><p className="text-[11px] text-slate-400">Diagnosis codes must already exist on this patient&apos;s chart.</p></div>
    <Feedback error={error} message={message} />
  </div>;
}

export function ReceiveImagingResultControl({ patients, orders, documents, integrations, disabled = false }: {
  patients: ImagingPatient[];
  orders: ImagingOrderOption[];
  documents: ImagingDocument[];
  integrations: ImagingIntegration[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const eligibleOrders = orders.filter((order) => order.status === "completed");
  const [orderId, setOrderId] = useState(eligibleOrders[0]?.id ?? "");
  const initialPatient = eligibleOrders[0]?.patientId ?? patients[0]?.id ?? "";
  const [patientId, setPatientId] = useState(initialPatient);
  const [facility, setFacility] = useState(eligibleOrders[0]?.facility ?? "Community Diagnostic Imaging");
  const [reportTitle, setReportTitle] = useState(eligibleOrders[0] ? `${eligibleOrders[0].study} report` : "Imaging report");
  const [sourceType, setSourceType] = useState("structured_manual");
  const [reportDocumentId, setReportDocumentId] = useState("");
  const [integrationId, setIntegrationId] = useState("");
  const [sourceReference, setSourceReference] = useState("");
  const [findings, setFindings] = useState("Source report findings copied by authorized staff.");
  const [impression, setImpression] = useState("Source report impression copied without ClinicOS interpretation.");
  const [imageReference, setImageReference] = useState("");
  const [studyPerformedAt, setStudyPerformedAt] = useState("");
  const [urgentSourceFlag, setUrgentSourceFlag] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const patientDocuments = documents.filter((document) => document.patientId === patientId);
  const activeIntegrations = integrations.filter((item) => item.active);

  function selectOrder(value: string) {
    setOrderId(value);
    const order = eligibleOrders.find((candidate) => candidate.id === value);
    if (!order) return;
    setPatientId(order.patientId); setFacility(order.facility ?? ""); setReportTitle(`${order.study} report`); setReportDocumentId("");
  }

  async function receive() {
    setPending(true); setError(""); setMessage("");
    try {
      await parseResponse(await fetch("/api/imaging/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, orderId: orderId || undefined, facility, reportTitle, sourceType, reportDocumentId: sourceType === "manual_upload" ? reportDocumentId : undefined, integrationId: sourceType === "electronic_interface" ? integrationId : undefined, sourceReference: sourceReference || undefined, findings: findings || undefined, impression: impression || undefined, imageReference: imageReference || undefined, studyPerformedAt, urgentSourceFlag }),
      }));
      setMessage("Source report received, held from the portal, and routed for provider review.");
      router.refresh();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Report receipt failed."); }
    finally { setPending(false); }
  }

  const sourceMissing = sourceType === "manual_upload" ? !reportDocumentId : sourceType === "electronic_interface" ? !integrationId : !findings.trim() && !impression.trim();
  const unavailable = disabled || pending || !patientId || !facility || !reportTitle || !studyPerformedAt || sourceMissing;
  return <div className="space-y-4 p-5">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Completed order<select className={fieldClass} onChange={(event) => selectOrder(event.target.value)} value={orderId}><option value="">Unlinked report</option>{eligibleOrders.map((order) => <option key={order.id} value={order.id}>{order.patientName} · {order.study}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Patient<select className={fieldClass} disabled={Boolean(orderId)} onChange={(event) => { setPatientId(event.target.value); setReportDocumentId(""); }} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Report title<Input className="mt-1" onChange={(event) => setReportTitle(event.target.value)} value={reportTitle} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Facility<Input className="mt-1" onChange={(event) => setFacility(event.target.value)} value={facility} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Study performed<Input className="mt-1" onChange={(event) => setStudyPerformedAt(event.target.value)} type="datetime-local" value={studyPerformedAt} /></label>
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Source pathway<select className={fieldClass} onChange={(event) => setSourceType(event.target.value)} value={sourceType}><option value="structured_manual">Structured manual entry</option><option value="manual_upload">Patient-bound PDF</option><option value="electronic_interface">Electronic interface</option></select></label>
      {sourceType === "manual_upload" && <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500 sm:col-span-2">Patient report PDF<select className={fieldClass} onChange={(event) => setReportDocumentId(event.target.value)} value={reportDocumentId}><option value="">Select a patient-bound PDF</option>{patientDocuments.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>}
      {sourceType === "electronic_interface" && <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500 sm:col-span-2">Active adapter<select className={fieldClass} onChange={(event) => setIntegrationId(event.target.value)} value={integrationId}><option value="">Select tested adapter</option>{activeIntegrations.map((item) => <option key={item.id} value={item.id}>{item.vendor}</option>)}</select></label>}
      <label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500 sm:col-span-2">Source reference<Input className="mt-1" onChange={(event) => setSourceReference(event.target.value)} placeholder="Accession or report reference" value={sourceReference} /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Source findings<textarea className={`${fieldClass} min-h-28 py-3`} onChange={(event) => setFindings(event.target.value)} value={findings} /></label><label className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Source impression<textarea className={`${fieldClass} min-h-28 py-3`} onChange={(event) => setImpression(event.target.value)} value={impression} /></label></div>
    <label className="block text-[11px] font-black uppercase tracking-[.12em] text-slate-500">Image or PACS reference<Input className="mt-1" onChange={(event) => setImageReference(event.target.value)} placeholder="Reference only; no unverified PACS claim" value={imageReference} /></label>
    <label className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[12px] font-bold text-rose-900"><input checked={urgentSourceFlag} onChange={(event) => setUrgentSourceFlag(event.target.checked)} type="checkbox" /> Source explicitly marks this report urgent; create immediate human escalation.</label>
    <Button disabled={unavailable} onClick={receive} variant="primary">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <RadioTower className="size-4" />} Receive and hold for review</Button>
    <Feedback error={error} message={message} />
  </div>;
}

type OrderAction = "mark_ready" | "queue_delivery" | "confirm_delivery" | "mark_scheduled" | "mark_completed" | "fail_delivery" | "retry_delivery" | "cancel";
const orderLabels: Record<OrderAction, string> = { mark_ready: "Approve order", queue_delivery: "Start delivery", confirm_delivery: "Confirm delivered", mark_scheduled: "Record schedule", mark_completed: "Record completion", fail_delivery: "Mark failed", retry_delivery: "Retry delivery", cancel: "Cancel order" };

export function ImagingOrderTransitionControl({ order, disabled = false }: { order: { id: string; status: string; deliveryStatus: string }; disabled?: boolean }) {
  const router = useRouter();
  const actions: OrderAction[] = order.deliveryStatus === "failed" ? ["retry_delivery", "cancel"] : order.status === "draft" ? ["mark_ready", "cancel"] : order.status === "ready_to_send" && order.deliveryStatus === "not_started" ? ["queue_delivery", "cancel"] : ["ready_to_send", "transmission_queued"].includes(order.status) && ["pending_manual", "queued"].includes(order.deliveryStatus) ? ["confirm_delivery", "fail_delivery", "cancel"] : order.status === "sent" ? ["mark_scheduled", "mark_completed", "cancel"] : order.status === "scheduled" ? ["mark_scheduled", "mark_completed", "cancel"] : [];
  const [action, setAction] = useState<OrderAction | "">(actions[0] ?? "");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!actions.length) return null;
  const selected = actions.includes(action as OrderAction) ? action as OrderAction : actions[0];
  const needsNote = ["confirm_delivery", "fail_delivery", "cancel"].includes(selected);
  async function transition() {
    setPending(true); setError("");
    try { await parseResponse(await fetch(`/api/imaging/orders/${order.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: selected, note: note || undefined, scheduledAt: scheduledAt || undefined, completedAt: completedAt || undefined }) })); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Order update failed."); }
    finally { setPending(false); }
  }
  const unavailable = disabled || pending || (needsNote && note.trim().length < 8) || (selected === "mark_scheduled" && !scheduledAt) || (selected === "mark_completed" && !completedAt);
  return <div className="mt-4 space-y-2 border-t border-indigo-100 pt-4"><div className="grid gap-2 lg:grid-cols-[.8fr_1.3fr_auto]"><select className={fieldClass.replace("mt-1 ", "")} onChange={(event) => setAction(event.target.value as OrderAction)} value={selected}>{actions.map((item) => <option key={item} value={item}>{orderLabels[item]}</option>)}</select>{selected === "mark_scheduled" ? <Input onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" value={scheduledAt} /> : selected === "mark_completed" ? <Input onChange={(event) => setCompletedAt(event.target.value)} type="datetime-local" value={completedAt} /> : <Input onChange={(event) => setNote(event.target.value)} placeholder={needsNote ? "Required human confirmation note" : "Optional workflow note"} value={note} />}<Button disabled={unavailable} onClick={transition} size="sm" variant={selected === "cancel" || selected === "fail_delivery" ? "danger" : "primary"}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : selected === "retry_delivery" ? <RotateCcw className="size-3.5" /> : selected === "mark_scheduled" ? <CalendarClock className="size-3.5" /> : <CheckCheck className="size-3.5" />}{orderLabels[selected]}</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

type ResultAction = "review" | "release" | "notify_patient" | "create_follow_up";
const resultLabels: Record<ResultAction, string> = { review: "Document provider review", release: "Approve portal release", notify_patient: "Confirm patient notified", create_follow_up: "Create follow-up" };

export function ImagingResultTransitionControl({ result, canSign, disabled = false }: { result: { id: string; status: string; patientNotificationStatus: string }; canSign: boolean; disabled?: boolean }) {
  const router = useRouter();
  const actions: ResultAction[] = result.status === "needs_review" ? (canSign ? ["review"] : []) : result.status === "reviewed" ? [...(canSign ? ["release"] as ResultAction[] : []), "create_follow_up"] : result.status === "released" ? [...(result.patientNotificationStatus === "notified" ? [] : ["notify_patient"] as ResultAction[]), "create_follow_up"] : [];
  const [action, setAction] = useState<ResultAction | "">(actions[0] ?? "");
  const [note, setNote] = useState("");
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!actions.length) return !canSign && result.status === "needs_review" ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">Awaiting an active provider identity with imaging sign-off permission.</p> : null;
  const selected = actions.includes(action as ResultAction) ? action as ResultAction : actions[0];
  const needsNote = ["review", "notify_patient", "create_follow_up"].includes(selected);
  async function transition() {
    setPending(true); setError("");
    try { await parseResponse(await fetch(`/api/imaging/results/${result.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: selected, note: note || undefined, followUpDueAt: followUpDueAt || undefined }) })); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Report update failed."); }
    finally { setPending(false); }
  }
  const unavailable = disabled || pending || (needsNote && note.trim().length < 8) || (selected === "create_follow_up" && !followUpDueAt);
  return <div className="mt-4 space-y-2 border-t border-indigo-100 pt-4"><div className="grid gap-2 lg:grid-cols-[.8fr_1.3fr_auto]"><select className={fieldClass.replace("mt-1 ", "")} onChange={(event) => setAction(event.target.value as ResultAction)} value={selected}>{actions.map((item) => <option key={item} value={item}>{resultLabels[item]}</option>)}</select>{selected === "create_follow_up" ? <div className="grid grid-cols-2 gap-2"><Input onChange={(event) => setNote(event.target.value)} placeholder="Follow-up action" value={note} /><Input onChange={(event) => setFollowUpDueAt(event.target.value)} type="datetime-local" value={followUpDueAt} /></div> : <Input onChange={(event) => setNote(event.target.value)} placeholder={needsNote ? "Required review or notification note" : "Optional note"} value={note} />}<Button disabled={unavailable} onClick={transition} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : selected === "release" ? <ShieldCheck className="size-3.5" /> : selected === "notify_patient" ? <BellRing className="size-3.5" /> : <CheckCheck className="size-3.5" />}{resultLabels[selected]}</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function CorrectImagingResultControl({ result, canSign }: { result: { id: string; status: string; reportTitle: string; sourceReference: string | null; findings: string | null; impression: string | null; imageReference: string | null; studyPerformedAt: string | null; urgentSourceFlag: boolean }; canSign: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState(result.reportTitle);
  const [sourceReference, setSourceReference] = useState(result.sourceReference ?? "");
  const [findings, setFindings] = useState(result.findings ?? "");
  const [impression, setImpression] = useState(result.impression ?? "");
  const [imageReference, setImageReference] = useState(result.imageReference ?? "");
  const [studyPerformedAt, setStudyPerformedAt] = useState(result.studyPerformedAt ? result.studyPerformedAt.slice(0, 16) : "");
  const [urgentSourceFlag, setUrgentSourceFlag] = useState(result.urgentSourceFlag);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!canSign || result.status === "corrected") return null;
  async function correct() {
    setPending(true); setError("");
    try { await parseResponse(await fetch(`/api/imaging/results/${result.id}/correct`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportTitle, sourceReference: sourceReference || undefined, findings: findings || undefined, impression: impression || undefined, imageReference: imageReference || undefined, studyPerformedAt, urgentSourceFlag, reason }) })); router.refresh(); setOpen(false); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Correction failed."); }
    finally { setPending(false); }
  }
  return <div className="mt-3"><Button onClick={() => setOpen(!open)} size="sm" variant="ghost"><FilePenLine className="size-3.5" /> Correct source report</Button>{open && <div className="mt-2 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start justify-between gap-3"><p className="text-[12px] leading-5 text-amber-900">A correction preserves this version, removes obsolete portal visibility, creates a replacement, and requires provider review again.</p><Button aria-label="Close correction editor" onClick={() => setOpen(false)} size="icon" variant="ghost"><X className="size-4" /></Button></div><div className="grid gap-2 sm:grid-cols-2"><Input onChange={(event) => setReportTitle(event.target.value)} value={reportTitle} /><Input onChange={(event) => setStudyPerformedAt(event.target.value)} type="datetime-local" value={studyPerformedAt} /><Input onChange={(event) => setSourceReference(event.target.value)} placeholder="Source reference" value={sourceReference} /><Input onChange={(event) => setImageReference(event.target.value)} placeholder="Image reference" value={imageReference} /></div><div className="grid gap-2 sm:grid-cols-2"><textarea className={`${fieldClass} min-h-24 py-3`} onChange={(event) => setFindings(event.target.value)} value={findings} /><textarea className={`${fieldClass} min-h-24 py-3`} onChange={(event) => setImpression(event.target.value)} value={impression} /></div><label className="flex items-center gap-2 text-[12px] font-bold text-rose-800"><input checked={urgentSourceFlag} onChange={(event) => setUrgentSourceFlag(event.target.checked)} type="checkbox" /> Corrected source carries urgent flag</label><div className="flex flex-col gap-2 sm:flex-row"><Input onChange={(event) => setReason(event.target.value)} placeholder="Required correction reason" value={reason} /><Button disabled={pending || reason.trim().length < 12 || !studyPerformedAt || (!findings.trim() && !impression.trim())} onClick={correct} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <FilePenLine className="size-3.5" />} Create corrected version</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>}</div>;
}
