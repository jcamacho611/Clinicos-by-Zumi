"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CapacityWorkspace } from "@/lib/repositories/capacity-repository";

export function CapacityRequestAction({ listingId, patients }: { listingId: string; patients: CapacityWorkspace["patients"] }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [note, setNote] = useState("Manual capacity request requires staff confirmation.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/capacity-exchange", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, patientId, note }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Capacity request failed.");
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Capacity request failed."); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-2"><select aria-label="Capacity request patient" className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700" onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select><Input aria-label="Capacity request note" onChange={(event) => setNote(event.target.value)} value={note} /><Button disabled={busy || !patientId || note.trim().length < 8} onClick={submit} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : null} Request slot</Button>{error && <p className="text-[10px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}
