"use client";

import { useState } from "react";
import { AlertTriangle, Check, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RemoteMonitoringWorkspace } from "@/lib/repositories/remote-monitoring-repository";

const controlClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
const areaClass = "min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Remote monitoring action failed.");
}

export function RemoteObservationCreateAction({ patients, enabled }: { patients: RemoteMonitoringWorkspace["patients"]; enabled: boolean }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [type, setType] = useState("blood_pressure");
  const [value, setValue] = useState("132/84");
  const [unit, setUnit] = useState("mmHg");
  const [sourceType, setSourceType] = useState("patient_entered");
  const [deviceId, setDeviceId] = useState("");
  const [thresholdLabel, setThresholdLabel] = useState("Provider review threshold");
  const [thresholdInstruction, setThresholdInstruction] = useState("Use the clinic protocol and provider review queue; do not interpret automatically.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await post("/api/remote-monitoring", { patientId, type, value, unit, sourceType, deviceId: deviceId || null, observedAt: new Date().toISOString(), thresholdConfig: { label: thresholdLabel, instruction: thresholdInstruction }, consentConfirmed: true }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Observation creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can view observations but cannot add a manual or adapter-ready reading.</p>;
  return <div className="space-y-3 p-5"><select aria-label="Remote monitoring patient" className={controlClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}</select><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Observation type" className={controlClass} onChange={(event) => setType(event.target.value)} value={type}><option value="blood_pressure">Blood pressure</option><option value="glucose">Glucose</option><option value="weight">Weight</option><option value="pulse_oximetry">Pulse oximetry</option><option value="symptom_check_in">Symptom check-in</option></select><Input aria-label="Observation value" onChange={(event) => setValue(event.target.value)} placeholder="Value" value={value} /></div><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Observation unit" onChange={(event) => setUnit(event.target.value)} placeholder="Unit" value={unit} /><select aria-label="Observation source" className={controlClass} onChange={(event) => setSourceType(event.target.value)} value={sourceType}><option value="patient_entered">Manual patient entry</option><option value="device_adapter">Device adapter queue</option></select></div>{sourceType === "device_adapter" && <Input aria-label="Device identifier" onChange={(event) => setDeviceId(event.target.value)} placeholder="Device identifier" value={deviceId} />}<Input aria-label="Provider threshold label" onChange={(event) => setThresholdLabel(event.target.value)} placeholder="Provider threshold label" value={thresholdLabel} /><textarea aria-label="Provider threshold instruction" className={areaClass} onChange={(event) => setThresholdInstruction(event.target.value)} value={thresholdInstruction} /><div className="flex items-center justify-between gap-3"><p className="text-[10px] leading-5 text-slate-400">Consent is recorded with the observation; provider review remains mandatory.</p><Button disabled={busy || !patientId || !value.trim()} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add observation</Button></div>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function RemoteObservationReviewActions({ observationId, enabled }: { observationId: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function review(action: "review" | "reject" | "escalate") {
    setBusy(true); setError(null);
    try { await post(`/api/remote-monitoring/${observationId}/review`, { action, note: action === "review" ? "Provider reviewed the observation and documented no automatic clinical interpretation." : action === "reject" ? "Observation rejected during human source and quality review." : "Provider escalation created for manual follow-up of this observation." }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Observation review failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <div className="mt-3 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => review("review")} size="sm" variant="secondary"><Check className="size-3.5" /> Review</Button><Button disabled={busy} onClick={() => review("escalate")} size="sm" variant="danger"><AlertTriangle className="size-3.5" /> Escalate</Button><Button disabled={busy} onClick={() => review("reject")} size="sm" variant="ghost"><X className="size-3.5" /> Reject</Button>{error && <p className="basis-full text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
