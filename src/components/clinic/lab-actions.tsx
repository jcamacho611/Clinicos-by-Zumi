"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BellRing, FilePenLine, LoaderCircle, Plus, RotateCcw, Send, ShieldCheck, Workflow, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function parseResponse<T>(response: Response) {
  const body = await response.json() as { error?: string; data?: T };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body.data as T;
}

const fieldClass = "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

interface LabPatient { id: string; name: string; mrn: string }
interface LabProvider { id: string; label: string }
interface LabIntegration { id: string; vendor: string; status: string; active: boolean }
interface LabDocument { id: string; patientId: string | null; name: string }
interface LabOrderOption { id: string; patientId: string; patientName: string; vendor: string | null; status: string; tests: { name: string; loincCode?: string }[] }
interface ResultItemInput { clientId: string; name: string; loincCode: string; value: string; numericValue: string; unit: string; referenceRange: string; abnormalFlag: string; critical: boolean }

function Feedback({ error, message }: { error: string; message: string }) {
  return <>{message && <p className="text-[12px] font-bold text-teal-700" role="status">{message}</p>}{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</>;
}

export function CreateLabOrderControl({ patients, providers, integrations, disabled = false }: { patients: LabPatient[]; providers: LabProvider[]; integrations: LabIntegration[]; disabled?: boolean }) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [vendor, setVendor] = useState("Quest Diagnostics");
  const [tests, setTests] = useState("Hemoglobin A1C");
  const [diagnosisCodes, setDiagnosisCodes] = useState("E11.9");
  const [priority, setPriority] = useState("routine");
  const [specimenType, setSpecimenType] = useState("Whole blood");
  const [collectionSite, setCollectionSite] = useState("Clinic");
  const [deliveryMethod, setDeliveryMethod] = useState("manual");
  const [integrationId, setIntegrationId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const activeIntegrations = integrations.filter((integration) => integration.active);

  async function create() {
    setPending(true); setError(""); setMessage("");
    try {
      await parseResponse(await fetch("/api/labs/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        patientId, providerId, vendor,
        tests: tests.split(",").map((name) => ({ name: name.trim() })).filter((test) => test.name),
        diagnosisCodes: diagnosisCodes.split(",").map((code) => code.trim()).filter(Boolean),
        priority, specimenType: specimenType || undefined, collectionSite: collectionSite || undefined, deliveryMethod,
        integrationId: deliveryMethod === "electronic_adapter" ? integrationId : undefined,
      }) }));
      setMessage("Lab order draft created with a linked clinical order and audit receipt.");
      router.refresh();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Lab order creation failed."); }
    finally { setPending(false); }
  }

  const unavailable = disabled || pending || !patientId || !providerId || vendor.trim().length < 2 || !tests.trim() || !diagnosisCodes.trim() || (deliveryMethod === "electronic_adapter" && !integrationId);
  return <div className="space-y-4 p-5">
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-[12px] font-bold text-slate-600">Patient<select className={fieldClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
      <label className="text-[12px] font-bold text-slate-600">Ordering provider<select className={fieldClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</select></label>
      <label className="text-[12px] font-bold text-slate-600">Laboratory<Input className="mt-1" onChange={(event) => setVendor(event.target.value)} value={vendor} /></label>
      <label className="text-[12px] font-bold text-slate-600">Priority<select className={fieldClass} onChange={(event) => setPriority(event.target.value)} value={priority}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></label>
      <label className="text-[12px] font-bold text-slate-600 md:col-span-2">Tests, comma separated<Input className="mt-1" onChange={(event) => setTests(event.target.value)} placeholder="Hemoglobin A1C, CMP" value={tests} /></label>
      <label className="text-[12px] font-bold text-slate-600">Attached diagnosis codes<Input className="mt-1" onChange={(event) => setDiagnosisCodes(event.target.value)} placeholder="E11.9, I10" value={diagnosisCodes} /></label>
      <label className="text-[12px] font-bold text-slate-600">Delivery pathway<select className={fieldClass} onChange={(event) => setDeliveryMethod(event.target.value)} value={deliveryMethod}><option value="manual">Manual order</option><option value="print">Print fallback</option><option value="fax">Fax fallback</option>{activeIntegrations.length > 0 && <option value="electronic_adapter">Active electronic adapter</option>}</select></label>
      {deliveryMethod === "electronic_adapter" && <label className="text-[12px] font-bold text-slate-600 md:col-span-2">Verified interface<select className={fieldClass} onChange={(event) => setIntegrationId(event.target.value)} value={integrationId}><option value="">Select active adapter</option>{activeIntegrations.map((integration) => <option key={integration.id} value={integration.id}>{integration.vendor}</option>)}</select></label>}
      <label className="text-[12px] font-bold text-slate-600">Specimen<Input className="mt-1" onChange={(event) => setSpecimenType(event.target.value)} value={specimenType} /></label>
      <label className="text-[12px] font-bold text-slate-600">Collection site<Input className="mt-1" onChange={(event) => setCollectionSite(event.target.value)} value={collectionSite} /></label>
    </div>
    <div className="flex flex-wrap items-center gap-3"><Button disabled={unavailable} onClick={create} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Create order draft</Button><p className="text-[11px] leading-5 text-slate-400">Codes must already exist on the patient chart. Vendor names do not imply a live interface.</p></div>
    <Feedback error={error} message={message} />
  </div>;
}

type LabOrderAction = "mark_ready" | "queue_delivery" | "confirm_delivery" | "record_collection" | "fail_delivery" | "retry_delivery" | "cancel";
const orderActionLabels: Record<LabOrderAction, string> = { mark_ready: "Mark ready", queue_delivery: "Queue delivery", confirm_delivery: "Confirm delivery", record_collection: "Record collection", fail_delivery: "Record failure", retry_delivery: "Retry delivery", cancel: "Cancel order" };

function availableOrderActions(order: { status: string; deliveryStatus: string }): LabOrderAction[] {
  if (order.status === "draft") return ["mark_ready", "cancel"];
  if (order.deliveryStatus === "failed") return ["retry_delivery", "cancel"];
  if (["ready_to_send", "transmission_queued"].includes(order.status)) {
    if (["pending_manual", "queued"].includes(order.deliveryStatus)) return ["confirm_delivery", "fail_delivery", "cancel"];
    return ["queue_delivery", "cancel"];
  }
  if (order.status === "sent") return ["record_collection", "cancel"];
  return [];
}

export function LabOrderTransitionControl({ order, disabled = false }: { order: { id: string; status: string; deliveryStatus: string }; disabled?: boolean }) {
  const router = useRouter();
  const actions = availableOrderActions(order);
  const [action, setAction] = useState<LabOrderAction | "">(actions[0] ?? "");
  const [note, setNote] = useState("");
  const [collectedAt, setCollectedAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!actions.length) return null;
  const selectedAction = actions.includes(action as LabOrderAction) ? action as LabOrderAction : actions[0];
  const needsNote = ["confirm_delivery", "fail_delivery", "cancel"].includes(selectedAction);

  async function transition() {
    setPending(true); setError("");
    try {
      await parseResponse(await fetch(`/api/labs/orders/${order.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: selectedAction, note: note || undefined, collectedAt: collectedAt || undefined }) }));
      router.refresh();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Order update failed."); }
    finally { setPending(false); }
  }
  const unavailable = disabled || pending || (needsNote && note.trim().length < 8) || (selectedAction === "record_collection" && !collectedAt);
  return <div className="mt-4 space-y-2 border-t border-slate-100 pt-4"><div className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]"><select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700" onChange={(event) => setAction(event.target.value as LabOrderAction)} value={selectedAction}>{actions.map((item) => <option key={item} value={item}>{orderActionLabels[item]}</option>)}</select>{selectedAction === "record_collection" ? <Input aria-label="Specimen collection time" onChange={(event) => setCollectedAt(event.target.value)} type="datetime-local" value={collectedAt} /> : <Input aria-label="Lab order action note" onChange={(event) => setNote(event.target.value)} placeholder={needsNote ? "Required human confirmation or reason" : "Optional workflow note"} value={note} />}<Button disabled={unavailable} onClick={transition} size="sm" variant={["fail_delivery", "cancel"].includes(selectedAction) ? "danger" : "primary"}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Workflow className="size-3.5" />}{orderActionLabels[selectedAction]}</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

let nextResultItemId = 1;
const blankItem = (): ResultItemInput => ({ clientId: `result-item-${nextResultItemId++}`, name: "", loincCode: "", value: "", numericValue: "", unit: "", referenceRange: "", abnormalFlag: "normal", critical: false });

export function ReceiveLabResultControl({ patients, orders, documents, integrations, disabled = false }: { patients: LabPatient[]; orders: LabOrderOption[]; documents: LabDocument[]; integrations: LabIntegration[]; disabled?: boolean }) {
  const router = useRouter();
  const eligibleOrders = orders.filter((order) => ["sent", "collected"].includes(order.status));
  const [orderId, setOrderId] = useState(eligibleOrders[0]?.id ?? "");
  const selectedOrder = eligibleOrders.find((order) => order.id === orderId);
  const [patientId, setPatientId] = useState(selectedOrder?.patientId ?? patients[0]?.id ?? "");
  const [panelName, setPanelName] = useState(selectedOrder?.tests.map((test) => test.name).join(" + ") ?? "");
  const [vendor, setVendor] = useState(selectedOrder?.vendor ?? "");
  const [sourceType, setSourceType] = useState("manual_entry");
  const [sourceDocumentId, setSourceDocumentId] = useState("");
  const [integrationId, setIntegrationId] = useState("");
  const [resultedAt, setResultedAt] = useState("");
  const [items, setItems] = useState<ResultItemInput[]>([blankItem()]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const activeIntegrations = integrations.filter((integration) => integration.active);
  const patientDocuments = documents.filter((document) => document.patientId === patientId);

  function chooseOrder(value: string) {
    setOrderId(value);
    const order = eligibleOrders.find((candidate) => candidate.id === value);
    if (order) { setPatientId(order.patientId); setVendor(order.vendor ?? ""); setPanelName(order.tests.map((test) => test.name).join(" + ")); setItems(order.tests.map((test) => ({ ...blankItem(), name: test.name, loincCode: test.loincCode ?? "" }))); }
  }
  function updateItem(index: number, field: keyof ResultItemInput, value: string | boolean) { setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)); }
  async function receive() {
    setPending(true); setError(""); setMessage("");
    try {
      await parseResponse(await fetch("/api/labs/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        patientId, orderId: orderId || undefined, vendor: vendor || undefined, panelName, sourceType,
        sourceDocumentId: sourceType === "manual_upload" ? sourceDocumentId : undefined,
        integrationId: sourceType === "electronic_interface" ? integrationId : undefined,
        resultedAt,
        items: items.map((item) => ({ name: item.name, loincCode: item.loincCode || undefined, value: item.value, numericValue: item.numericValue ? Number(item.numericValue) : undefined, unit: item.unit || undefined, referenceRange: item.referenceRange || undefined, abnormalFlag: item.critical ? "critical" : item.abnormalFlag, critical: item.critical, resultStatus: "final" })),
      }) }));
      setMessage("Result received, held from the portal, and routed to provider review.");
      setItems([blankItem()]);
      router.refresh();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Result receipt failed."); }
    finally { setPending(false); }
  }
  const unavailable = disabled || pending || !patientId || !panelName.trim() || !resultedAt || items.some((item) => item.name.trim().length < 2 || !item.value.trim()) || (sourceType === "manual_upload" && !sourceDocumentId) || (sourceType === "electronic_interface" && !integrationId);
  return <div className="space-y-4 p-5">
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-[12px] font-bold text-slate-600">Linked order<select className={fieldClass} onChange={(event) => chooseOrder(event.target.value)} value={orderId}><option value="">Unsolicited / external result</option>{eligibleOrders.map((order) => <option key={order.id} value={order.id}>{order.patientName} · {order.vendor} · {order.tests.map((test) => test.name).join(", ")}</option>)}</select></label>
      <label className="text-[12px] font-bold text-slate-600">Patient<select className={fieldClass} disabled={Boolean(orderId)} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label>
      <label className="text-[12px] font-bold text-slate-600">Panel<Input className="mt-1" onChange={(event) => setPanelName(event.target.value)} value={panelName} /></label>
      <label className="text-[12px] font-bold text-slate-600">Resulted at<Input className="mt-1" onChange={(event) => setResultedAt(event.target.value)} type="datetime-local" value={resultedAt} /></label>
      <label className="text-[12px] font-bold text-slate-600">Source pathway<select className={fieldClass} onChange={(event) => setSourceType(event.target.value)} value={sourceType}><option value="manual_entry">Structured manual entry</option><option value="manual_upload">Verified chart document upload</option>{activeIntegrations.length > 0 && <option value="electronic_interface">Active electronic interface</option>}</select></label>
      <label className="text-[12px] font-bold text-slate-600">Source laboratory<Input className="mt-1" onChange={(event) => setVendor(event.target.value)} value={vendor} /></label>
      {sourceType === "manual_upload" && <label className="text-[12px] font-bold text-slate-600 md:col-span-2">Patient source document<select className={fieldClass} onChange={(event) => setSourceDocumentId(event.target.value)} value={sourceDocumentId}><option value="">Select an uploaded document</option>{patientDocuments.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>}
      {sourceType === "electronic_interface" && <label className="text-[12px] font-bold text-slate-600 md:col-span-2">Inbound adapter<select className={fieldClass} onChange={(event) => setIntegrationId(event.target.value)} value={integrationId}><option value="">Select active adapter</option>{activeIntegrations.map((integration) => <option key={integration.id} value={integration.id}>{integration.vendor}</option>)}</select></label>}
    </div>
    <div className="space-y-3">{items.map((item, index) => <div className={`rounded-2xl border p-4 ${item.critical ? "border-rose-300 bg-rose-50/60" : "border-slate-200 bg-slate-50/50"}`} key={item.clientId}><div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[.15em] text-slate-400">Result item {index + 1}</p>{items.length > 1 && <Button aria-label="Remove result item" onClick={() => setItems(items.filter((candidate) => candidate.clientId !== item.clientId))} size="icon" variant="ghost"><X className="size-3.5" /></Button>}</div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Input aria-label="Test name" onChange={(event) => updateItem(index, "name", event.target.value)} placeholder="Test name" value={item.name} /><Input aria-label="LOINC code" onChange={(event) => updateItem(index, "loincCode", event.target.value)} placeholder="LOINC" value={item.loincCode} /><Input aria-label="Result value" onChange={(event) => updateItem(index, "value", event.target.value)} placeholder="Result value" value={item.value} /><Input aria-label="Numeric result value" onChange={(event) => updateItem(index, "numericValue", event.target.value)} placeholder="Numeric value for trend" type="number" value={item.numericValue} /><Input aria-label="Result unit" onChange={(event) => updateItem(index, "unit", event.target.value)} placeholder="Unit" value={item.unit} /><Input aria-label="Reference range" onChange={(event) => updateItem(index, "referenceRange", event.target.value)} placeholder="Reference range" value={item.referenceRange} /><select aria-label="Abnormal flag" className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700" disabled={item.critical} onChange={(event) => updateItem(index, "abnormalFlag", event.target.value)} value={item.critical ? "critical" : item.abnormalFlag}><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option><option value="abnormal">Abnormal</option><option value="critical">Critical</option></select><label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700"><input checked={item.critical} onChange={(event) => updateItem(index, "critical", event.target.checked)} type="checkbox" /> Critical source flag</label></div></div>)}</div>
    <div className="flex flex-wrap gap-3"><Button onClick={() => setItems([...items, blankItem()])} size="sm" variant="secondary"><Plus className="size-3.5" /> Add result item</Button><Button disabled={unavailable} onClick={receive} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Receive and hold for review</Button></div>
    <Feedback error={error} message={message} />
  </div>;
}

type ResultAction = "review" | "release" | "notify_patient" | "create_follow_up" | "repeat_order";
const resultActionLabels: Record<ResultAction, string> = { review: "Document provider review", release: "Approve portal release", notify_patient: "Confirm patient notified", create_follow_up: "Create follow-up", repeat_order: "Create repeat order" };

export function LabResultTransitionControl({ result, canSign, disabled = false }: { result: { id: string; status: string; patientNotificationStatus: string }; canSign: boolean; disabled?: boolean }) {
  const router = useRouter();
  const actions: ResultAction[] = result.status === "needs_review" ? (canSign ? ["review"] : []) : result.status === "reviewed" ? [...(canSign ? ["release"] as ResultAction[] : []), "create_follow_up", "repeat_order"] : result.status === "released" ? [...(result.patientNotificationStatus === "notified" ? [] : ["notify_patient"] as ResultAction[]), "create_follow_up", "repeat_order"] : [];
  const [action, setAction] = useState<ResultAction | "">(actions[0] ?? "");
  const [note, setNote] = useState("");
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!actions.length) return !canSign && result.status === "needs_review" ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">Awaiting a user with provider review permission.</p> : null;
  const selectedAction = actions.includes(action as ResultAction) ? action as ResultAction : actions[0];
  const needsNote = ["review", "notify_patient", "create_follow_up"].includes(selectedAction);
  async function transition() {
    setPending(true); setError("");
    try { await parseResponse(await fetch(`/api/labs/results/${result.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: selectedAction, note: note || undefined, followUpDueAt: followUpDueAt || undefined }) })); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Result update failed."); }
    finally { setPending(false); }
  }
  const unavailable = disabled || pending || (needsNote && note.trim().length < 8) || (selectedAction === "create_follow_up" && !followUpDueAt);
  return <div className="mt-4 space-y-2 border-t border-slate-100 pt-4"><div className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]"><select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700" onChange={(event) => setAction(event.target.value as ResultAction)} value={selectedAction}>{actions.map((item) => <option key={item} value={item}>{resultActionLabels[item]}</option>)}</select>{selectedAction === "create_follow_up" ? <div className="grid grid-cols-2 gap-2"><Input aria-label="Follow-up note" onChange={(event) => setNote(event.target.value)} placeholder="Follow-up action" value={note} /><Input aria-label="Follow-up due date" onChange={(event) => setFollowUpDueAt(event.target.value)} type="datetime-local" value={followUpDueAt} /></div> : <Input aria-label="Result action note" onChange={(event) => setNote(event.target.value)} placeholder={needsNote ? "Required review or notification note" : "Optional workflow note"} value={note} />}<Button disabled={unavailable} onClick={transition} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : selectedAction === "release" ? <ShieldCheck className="size-3.5" /> : selectedAction === "notify_patient" ? <BellRing className="size-3.5" /> : selectedAction === "repeat_order" ? <RotateCcw className="size-3.5" /> : <Workflow className="size-3.5" />}{resultActionLabels[selectedAction]}</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function CorrectLabResultControl({ result, canSign }: { result: { id: string; status: string; panelName: string; vendor: string | null; resultedAt: string | null; items: Array<{ name: string; loincCode: string | null; value: string; numericValue: number | null; unit: string | null; referenceRange: string | null; abnormalFlag: string | null; critical: boolean }> }; canSign: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<ResultItemInput[]>(result.items.map((item, index) => ({ clientId: `${result.id}-${index}`, name: item.name, loincCode: item.loincCode ?? "", value: item.value, numericValue: item.numericValue?.toString() ?? "", unit: item.unit ?? "", referenceRange: item.referenceRange ?? "", abnormalFlag: item.abnormalFlag ?? "normal", critical: item.critical })));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!canSign || result.status === "corrected") return null;
  async function correct() {
    setPending(true); setError("");
    try { await parseResponse(await fetch(`/api/labs/results/${result.id}/correct`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendor: result.vendor || undefined, panelName: result.panelName, resultedAt: result.resultedAt ?? new Date().toISOString(), reason, items: items.map((item) => ({ name: item.name, loincCode: item.loincCode || undefined, value: item.value, numericValue: item.numericValue ? Number(item.numericValue) : undefined, unit: item.unit || undefined, referenceRange: item.referenceRange || undefined, abnormalFlag: item.critical ? "critical" : item.abnormalFlag, critical: item.critical, resultStatus: "corrected" })) }) })); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Correction failed."); }
    finally { setPending(false); }
  }
  return <div className="mt-3"><Button onClick={() => setOpen(!open)} size="sm" variant="ghost"><FilePenLine className="size-3.5" /> Correct source data</Button>{open && <div className="mt-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[12px] leading-5 text-amber-900">Edit the source values below. ClinicOS creates a versioned replacement, preserves the original audit trail, removes obsolete portal visibility, and requires provider review again.</p>{items.map((item, index) => <div className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-2 lg:grid-cols-4" key={item.clientId}><Input aria-label={`Corrected test name ${index + 1}`} onChange={(event) => setItems(items.map((candidate) => candidate.clientId === item.clientId ? { ...candidate, name: event.target.value } : candidate))} value={item.name} /><Input aria-label={`Corrected value ${index + 1}`} onChange={(event) => setItems(items.map((candidate) => candidate.clientId === item.clientId ? { ...candidate, value: event.target.value } : candidate))} value={item.value} /><Input aria-label={`Corrected numeric value ${index + 1}`} onChange={(event) => setItems(items.map((candidate) => candidate.clientId === item.clientId ? { ...candidate, numericValue: event.target.value } : candidate))} placeholder="Numeric value" type="number" value={item.numericValue} /><select aria-label={`Corrected flag ${index + 1}`} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700" onChange={(event) => setItems(items.map((candidate) => candidate.clientId === item.clientId ? { ...candidate, abnormalFlag: event.target.value, critical: event.target.value === "critical" } : candidate))} value={item.critical ? "critical" : item.abnormalFlag}><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option><option value="abnormal">Abnormal</option><option value="critical">Critical</option></select></div>)}<div className="flex flex-col gap-2 sm:flex-row"><Input aria-label="Correction reason" onChange={(event) => setReason(event.target.value)} placeholder="Required correction reason" value={reason} /><Button disabled={pending || reason.trim().length < 12 || items.some((item) => item.name.trim().length < 2 || !item.value.trim())} onClick={correct} size="sm" variant="primary">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <FilePenLine className="size-3.5" />} Create corrected version</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>}</div>;
}

export function LabTrendChart({ trend }: { trend: { label: string; points: Array<{ date: string; value: number; unit: string | null }> } }) {
  const data = trend.points.map((point) => ({ ...point, label: format(new Date(point.date), "MMM d") }));
  return <div><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-extrabold text-slate-900">{trend.label}</p><p className="mt-1 text-[11px] text-slate-400">Structured numeric values · source units preserved</p></div><Badge tone="teal">{data.length} points</Badge></div><div className="h-52 w-full"><ResponsiveContainer height="100%" width="100%"><AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}><defs><linearGradient id="labTrend" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.32} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} /><XAxis axisLine={false} dataKey="label" fontSize={9} tickLine={false} /><YAxis axisLine={false} fontSize={9} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 14, borderColor: "#cbd5e1", fontSize: 10 }} /><Area dataKey="value" fill="url(#labTrend)" stroke="#0891b2" strokeWidth={3} type="monotone" /></AreaChart></ResponsiveContainer></div></div>;
}
