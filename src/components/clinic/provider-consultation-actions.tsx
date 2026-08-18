"use client";

import { useState } from "react";
import { Check, CalendarClock, LoaderCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProviderConsultationWorkspace } from "@/lib/repositories/provider-consultation-repository";

export function ProviderConsultationCreateAction({ patients, providers }: { patients: ProviderConsultationWorkspace["patients"]; providers: ProviderConsultationWorkspace["providers"] }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const eligible = providers.filter((provider) => provider.verified);
  const [consultantProviderId, setConsultantProviderId] = useState(eligible[0]?.id ?? "");
  const [specialty, setSpecialty] = useState(eligible[0]?.specialty ?? "Family Medicine");
  const [clinicalQuestion, setClinicalQuestion] = useState("Please review this clinical question and return a documented recommendation to the requesting provider.");
  const [priority, setPriority] = useState("routine");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/provider-consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, consultantProviderId: consultantProviderId || undefined, specialty, clinicalQuestion, priority }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Consultation request failed.");
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Consultation request failed."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 p-5"><select aria-label="Consultation patient" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}</select><select aria-label="Consultant provider" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" onChange={(event) => { setConsultantProviderId(event.target.value); setSpecialty(eligible.find((provider) => provider.id === event.target.value)?.specialty ?? specialty); }} value={consultantProviderId}><option value="">Open specialty request</option>{eligible.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}, {provider.credential} · {provider.specialty} · {provider.organizationName}</option>)}</select><Input aria-label="Consultation specialty" onChange={(event) => setSpecialty(event.target.value)} value={specialty} /><textarea aria-label="Clinical question" className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-500" onChange={(event) => setClinicalQuestion(event.target.value)} value={clinicalQuestion} /><select aria-label="Consultation priority" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" onChange={(event) => setPriority(event.target.value)} value={priority}><option value="routine">Routine</option><option value="high">High</option><option value="urgent">Urgent</option></select><Button disabled={busy || !patientId || clinicalQuestion.trim().length < 12} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Request consultation</Button>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
export function ProviderConsultationTransitionActions({ consultationId, status }: { consultationId: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function transition(action: "accept" | "decline" | "schedule" | "close") {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/provider-consultations/${consultationId}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note: `Human provider review recorded: ${action}.`, ...(action === "schedule" ? { scheduledAt: new Date(Date.now() + 86400000).toISOString() } : {}) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Consultation transition failed.");
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Consultation transition failed."); }
    finally { setBusy(false); }
  }
  if (["closed", "declined"].includes(status)) return null;
  return <div className="mt-3 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => transition("accept")} size="sm" variant="secondary"><Check className="size-3.5" /> Accept</Button>{status === "accepted" && <Button disabled={busy} onClick={() => transition("schedule")} size="sm" variant="secondary"><CalendarClock className="size-3.5" /> Schedule</Button>}<Button disabled={busy} onClick={() => transition("decline")} size="sm" variant="ghost"><X className="size-3.5" /> Decline</Button><Button disabled={busy} onClick={() => transition("close")} size="sm" variant="ghost">Close</Button>{error && <p className="basis-full text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
