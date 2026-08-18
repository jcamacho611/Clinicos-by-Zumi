"use client";

import { useState } from "react";
import { CheckCircle2, Download, FilePlus2, LoaderCircle, Plus, RefreshCw, RotateCcw, Save, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CaseRoom, CaseWorkspace } from "@/lib/repositories/case-repository";

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50";
const areaClass = "min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50";

async function requestJson(url: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Case action failed.");
  return payload.data;
}

function dateTime(value: string) {
  return value ? `${value}T12:00:00.000Z` : null;
}

export function CaseCreateAction({ patients, enabled }: { patients: CaseWorkspace["patients"]; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [caseType, setCaseType] = useState<"nofault" | "workers_comp">("nofault");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [accidentDate, setAccidentDate] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [bodyParts, setBodyParts] = useState("");
  const [diagnoses, setDiagnoses] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [narrativeDue, setNarrativeDue] = useState("");
  const [adjusterName, setAdjusterName] = useState("");
  const [attorneyName, setAttorneyName] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const result = await requestJson("/api/cases", "POST", {
        caseType, patientId, accidentDate, claimNumber, carrier,
        policyNumber: policyNumber || null,
        injuredBodyParts: bodyParts.split(",").map((value) => value.trim()).filter(Boolean),
        diagnosisCodes: diagnoses.split(",").map((value) => value.trim()).filter(Boolean),
        treatmentPlan: treatmentPlan || null,
        workStatus: workStatus || null,
        narrativeDueAt: dateTime(narrativeDue),
        adjuster: adjusterName ? { name: adjusterName } : null,
        attorney: attorneyName ? { name: attorneyName } : null,
        employer: caseType === "workers_comp" && employerName ? { name: employerName } : null,
      });
      window.location.assign(`/cases/${result.caseType}/${result.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Case creation failed."); }
    finally { setBusy(false); }
  }

  if (!enabled) return null;
  if (!open) return <Button onClick={() => setOpen(true)} variant="primary"><Plus className="size-4" /> New case</Button>;
  return <div className="w-full rounded-3xl border border-teal-200 bg-teal-50/70 p-5 xl:w-[720px]">
    <div className="flex items-center justify-between"><div><p className="text-xs font-black text-slate-950">Open governed case room</p><p className="mt-1 text-[12px] text-slate-500">Creates a persistent packet checklist, owner task, and audit event.</p></div><Button aria-label="Close case form" onClick={() => setOpen(false)} size="sm" variant="ghost"><X className="size-4" /></Button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <select aria-label="Case type" className={selectClass} onChange={(event) => setCaseType(event.target.value as typeof caseType)} value={caseType}><option value="nofault">No-fault</option><option value="workers_comp">Workers compensation</option></select>
      <select aria-label="Case patient" className={selectClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select>
      <Input aria-label="Accident date" onChange={(event) => setAccidentDate(event.target.value)} type="date" value={accidentDate} />
      <Input aria-label="Claim number" onChange={(event) => setClaimNumber(event.target.value)} placeholder="Claim number" value={claimNumber} />
      <Input aria-label="Carrier" onChange={(event) => setCarrier(event.target.value)} placeholder="Carrier" value={carrier} />
      {caseType === "nofault" ? <Input aria-label="Policy number" onChange={(event) => setPolicyNumber(event.target.value)} placeholder="Policy number (optional)" value={policyNumber} /> : <Input aria-label="Employer" onChange={(event) => setEmployerName(event.target.value)} placeholder="Employer name" value={employerName} />}
      <Input aria-label="Injured body parts" onChange={(event) => setBodyParts(event.target.value)} placeholder="Body parts, comma separated" value={bodyParts} />
      <Input aria-label="Diagnosis codes" onChange={(event) => setDiagnoses(event.target.value)} placeholder="ICD-10 codes, comma separated" value={diagnoses} />
      <Input aria-label="Adjuster name" onChange={(event) => setAdjusterName(event.target.value)} placeholder="Adjuster name (optional)" value={adjusterName} />
      <Input aria-label="Attorney name" onChange={(event) => setAttorneyName(event.target.value)} placeholder="Attorney name (optional)" value={attorneyName} />
      {caseType === "workers_comp" && <Input aria-label="Work status" onChange={(event) => setWorkStatus(event.target.value)} placeholder="Current work status" value={workStatus} />}
      <Input aria-label="Narrative due date" onChange={(event) => setNarrativeDue(event.target.value)} type="date" value={narrativeDue} />
    </div>
    <textarea aria-label="Treatment plan" className={`${areaClass} mt-3`} onChange={(event) => setTreatmentPlan(event.target.value)} placeholder="Human-authored treatment-plan summary (optional)" value={treatmentPlan} />
    <div className="mt-3 flex items-center gap-3"><Button disabled={busy || !patientId || !accidentDate || claimNumber.trim().length < 3 || carrier.trim().length < 2 || bodyParts.trim().length < 2 || (caseType === "workers_comp" && employerName.trim().length < 2)} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Create case room</Button><p className="text-[11px] text-slate-500">No external transmission occurs.</p></div>
    {error && <p className="mt-3 text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

export function CaseUpdateAction({ room, enabled }: { room: CaseRoom; enabled: boolean }) {
  const item = room.case;
  const [status, setStatus] = useState(item.status);
  const [authorizationStatus, setAuthorizationStatus] = useState(item.authorizationStatus ?? "");
  const [formStatus, setFormStatus] = useState(item.caseType === "nofault" ? item.formStatus.nf2 ?? "" : item.formStatus.c4 ?? "");
  const [denialStatus, setDenialStatus] = useState(item.denialStatus ?? "");
  const [appealStatus, setAppealStatus] = useState(item.appealStatus ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try {
      await requestJson(`/api/cases/${item.caseType}/${item.id}`, "PATCH", { status, ...(item.caseType === "nofault" ? { priorAuthStatus: authorizationStatus || null, nf2Status: formStatus || null } : { authorizationStatus: authorizationStatus || null, c4Status: formStatus || null }), denialStatus: denialStatus || null, appealStatus: appealStatus || null, note });
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Case update failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="text-[12px] text-slate-500">Read-only case access.</p>;
  return <div className="space-y-3">
    <select aria-label="Case status" className={selectClass} onChange={(event) => setStatus(event.target.value)} value={status}><option value="active">Active</option><option value="on_hold">On hold</option><option value="disputed">Disputed</option><option value="closed">Closed</option></select>
    <Input aria-label="Authorization status" onChange={(event) => setAuthorizationStatus(event.target.value)} placeholder="Authorization status" value={authorizationStatus} />
    <Input aria-label={item.caseType === "nofault" ? "NF-2 status" : "C-4 status"} onChange={(event) => setFormStatus(event.target.value)} placeholder={item.caseType === "nofault" ? "NF-2 status" : "C-4 status"} value={formStatus} />
    <div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Denial status" onChange={(event) => setDenialStatus(event.target.value)} placeholder="Denial status" value={denialStatus} /><Input aria-label="Appeal status" onChange={(event) => setAppealStatus(event.target.value)} placeholder="Appeal status" value={appealStatus} /></div>
    <textarea aria-label="Case update note" className={areaClass} onChange={(event) => setNote(event.target.value)} placeholder="Required human update note" value={note} />
    <Button disabled={busy || note.trim().length < 8} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save reviewed update</Button>
    {error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}

export function CaseTaskCreateAction({ room, enabled }: { room: CaseRoom; enabled: boolean }) {
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await requestJson(`/api/cases/${room.case.caseType}/${room.case.id}/tasks`, "POST", { title, ownerId: ownerId || null, priority, dueAt: dateTime(dueAt), note }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Task creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2"><Input aria-label="Case task title" onChange={(event) => setTitle(event.target.value)} placeholder="New case task" value={title} /><select aria-label="Case task owner" className={selectClass} onChange={(event) => setOwnerId(event.target.value)} value={ownerId}><option value="">Unassigned</option>{room.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.roleKey.replaceAll("_", " ")}</option>)}</select><select aria-label="Case task priority" className={selectClass} onChange={(event) => setPriority(event.target.value)} value={priority}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><Input aria-label="Case task due date" onChange={(event) => setDueAt(event.target.value)} type="date" value={dueAt} /><textarea aria-label="Case task details" className={`${areaClass} sm:col-span-2`} onChange={(event) => setNote(event.target.value)} placeholder="Task evidence or instructions" value={note} /><div className="sm:col-span-2"><Button disabled={busy || title.trim().length < 3 || note.trim().length < 8} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add task</Button>{error && <p className="mt-2 text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div></div>;
}

export function CaseTaskTransitionAction({ room, task, enabled }: { room: CaseRoom; task: CaseRoom["tasks"][number]; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "complete" | "reopen" | "cancel") {
    setBusy(true); setError(null);
    try { await requestJson(`/api/cases/${room.case.caseType}/${room.case.id}/tasks/${task.id}/transition`, "POST", { action, note: `Human case task review recorded: ${action}.` }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Task update failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{task.status === "open" ? <><Button disabled={busy} onClick={() => transition("complete")} size="sm" variant="primary"><CheckCircle2 className="size-3.5" /> Complete</Button><Button disabled={busy} onClick={() => transition("cancel")} size="sm" variant="ghost"><X className="size-3.5" /> Cancel</Button></> : <Button disabled={busy} onClick={() => transition("reopen")} size="sm" variant="secondary"><RotateCcw className="size-3.5" /> Reopen</Button>}{error && <p className="basis-full text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function CasePacketCreateAction({ room, enabled }: { room: CaseRoom; enabled: boolean }) {
  const [type, setType] = useState("attorney_packet");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await requestJson(`/api/cases/${room.case.caseType}/${room.case.id}/packets`, "POST", { type, note: "Human requested a new manual case packet workflow." }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Packet creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="flex flex-wrap items-center gap-2"><select aria-label="New packet type" className={selectClass} onChange={(event) => setType(event.target.value)} value={type}><option value="carrier_submission">Carrier submission</option><option value="attorney_packet">Attorney packet</option><option value="billing_packet">Billing packet</option><option value="medical_necessity">Medical necessity</option></select><Button disabled={busy} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <FilePlus2 className="size-3.5" />} New packet</Button>{error && <p className="basis-full text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function CasePacketActions({ room, packet, enabled }: { room: CaseRoom; packet: CaseRoom["packets"][number]; enabled: boolean }) {
  const [note, setNote] = useState("Reviewed against the available case evidence.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "mark_item" | "mark_ready" | "generate_manual" | "approve" | "reopen", itemKey?: string, complete?: boolean) {
    setBusy(true); setError(null);
    try { await requestJson(`/api/cases/${room.case.caseType}/${room.case.id}/packets/${packet.id}/transition`, "POST", { action, itemKey, complete, note }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Packet update failed."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 border-t border-slate-100 pt-4">
    {enabled && ["draft", "needs_attention"].includes(packet.status) && <><Input aria-label="Packet review note" onChange={(event) => setNote(event.target.value)} placeholder="Checklist review evidence" value={note} /><div className="mt-3 space-y-2">{packet.checklist.map((item) => <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3" key={item.key}><span className={`grid size-6 place-items-center rounded-lg ${item.complete ? "bg-teal-100 text-teal-700" : "bg-white text-slate-400"}`}>{item.complete ? <CheckCircle2 className="size-3.5" /> : <span className="size-2 rounded-full bg-current" />}</span><p className="min-w-0 flex-1 text-[12px] font-bold text-slate-700">{item.label}{item.required ? " *" : ""}</p><Button disabled={busy || note.trim().length < 8} onClick={() => transition("mark_item", item.key, !item.complete)} size="sm" variant="ghost">{item.complete ? "Mark missing" : "Mark reviewed"}</Button></div>)}</div></>}
    {enabled && <div className="mt-3 flex flex-wrap gap-2">{["draft", "needs_attention"].includes(packet.status) && <Button disabled={busy || packet.readiness < 100} onClick={() => transition("mark_ready")} size="sm" variant="primary"><ShieldCheck className="size-3.5" /> Mark ready</Button>}{packet.status === "ready" && <Button disabled={busy} onClick={() => transition("generate_manual")} size="sm" variant="primary"><FilePlus2 className="size-3.5" /> Generate manual packet</Button>}{packet.status === "generated_manual" && <Button disabled={busy} onClick={() => transition("approve")} size="sm" variant="primary"><CheckCircle2 className="size-3.5" /> Approve reviewed packet</Button>}{["ready", "generated_manual", "approved"].includes(packet.status) && <Button disabled={busy} onClick={() => transition("reopen")} size="sm" variant="ghost"><RefreshCw className="size-3.5" /> Reopen</Button>}{["generated_manual", "approved"].includes(packet.status) && <Button asChild size="sm" variant="secondary"><a href={`/api/cases/${room.case.caseType}/${room.case.id}/packets/${packet.id}/export`}><Download className="size-3.5" /> Export PDF</a></Button>}</div>}
    {error && <p className="mt-2 text-[12px] font-bold text-rose-600" role="alert">{error}</p>}
  </div>;
}
