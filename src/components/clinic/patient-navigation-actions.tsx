"use client";

import { useState } from "react";
import { Check, LoaderCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PatientNavigationWorkspace } from "@/lib/repositories/patient-navigation-repository";

export function NavigationDraftActions({ patients }: { patients: PatientNavigationWorkspace["patients"] }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [request, setRequest] = useState("I need help with my next appointment.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/patient-navigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, request }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Navigation request failed.");
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Navigation request failed."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 p-5"><select aria-label="Navigation patient" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.mrn}</option>)}</select><Input aria-label="Navigation request" onChange={(event) => setRequest(event.target.value)} value={request} /><Button disabled={busy || !patientId || request.trim().length < 4} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Create review draft</Button>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
export function NavigationReviewActions({ draftId, disabled = false }: { draftId: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function review(decision: "approve" | "reject") {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/patient-navigation/${draftId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, notes: decision === "approve" ? "Reviewed as an administrative handoff; no clinical answer was sent." : "Rejected during human review; keep the request in the staff queue." }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Navigation review failed.");
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Navigation review failed."); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 flex flex-wrap gap-2"><Button disabled={disabled || busy} onClick={() => review("approve")} size="sm" variant="secondary"><Check className="size-3.5" /> Approve handoff</Button><Button disabled={disabled || busy} onClick={() => review("reject")} size="sm" variant="ghost"><X className="size-3.5" /> Reject</Button>{error && <p className="basis-full text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
