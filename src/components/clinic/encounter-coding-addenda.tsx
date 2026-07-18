"use client";

import { useState } from "react";
import { FilePlus2, LoaderCircle, Plus, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Encounter } from "@/lib/types";

export function EncounterCodingAddenda({ canSign, editable, encounter }: { canSign: boolean; editable: boolean; encounter: Encounter }) {
  const [diagnoses, setDiagnoses] = useState(encounter.diagnoses);
  const [procedures, setProcedures] = useState(encounter.procedures);
  const [addenda, setAddenda] = useState(encounter.addenda);
  const [diagnosisCode, setDiagnosisCode] = useState(""); const [diagnosisLabel, setDiagnosisLabel] = useState("");
  const [procedureCode, setProcedureCode] = useState(""); const [procedureLabel, setProcedureLabel] = useState("");
  const [reason, setReason] = useState(""); const [text, setText] = useState(""); const [attestation, setAttestation] = useState(false);
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState("");

  function addDiagnosis() {
    if (!diagnosisCode.trim() || !diagnosisLabel.trim()) return;
    setDiagnoses((current) => [...current, { code: diagnosisCode.trim().toUpperCase(), label: diagnosisLabel.trim(), primary: current.length === 0 }]);
    setDiagnosisCode(""); setDiagnosisLabel(""); setMessage("");
  }

  function addProcedure() {
    if (!procedureCode.trim() || !procedureLabel.trim()) return;
    setProcedures((current) => [...current, { code: procedureCode.trim().toUpperCase(), label: procedureLabel.trim(), modifiers: [] }]);
    setProcedureCode(""); setProcedureLabel(""); setMessage("");
  }

  function removeDiagnosis(index: number) {
    setDiagnoses((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      if (next.length > 0 && !next.some((item) => item.primary)) next[0] = { ...next[0], primary: true };
      return next;
    });
  }

  async function saveCoding() {
    setBusy("coding"); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/encounters/${encounter.id}/coding`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagnoses, procedures }) });
      const payload = await response.json() as { error?: string; encounter?: Encounter };
      if (!response.ok || !payload.encounter) throw new Error(payload.error ?? "Coding could not be saved.");
      setDiagnoses(payload.encounter.diagnoses);
      setProcedures(payload.encounter.procedures);
      setMessage("Coding saved with an audit receipt.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Coding could not be saved."); }
    finally { setBusy(""); }
  }

  async function signAddendum() {
    setBusy("addendum"); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/encounters/${encounter.id}/addenda`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason, text, attestation }) });
      const payload = await response.json() as { error?: string; encounter?: Encounter };
      if (!response.ok || !payload.encounter) throw new Error(payload.error ?? "The addendum could not be signed.");
      setAddenda(payload.encounter.addenda); setReason(""); setText(""); setAttestation(false); setMessage("Addendum signed. The original note remains unchanged.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The addendum could not be signed."); }
    finally { setBusy(""); }
  }

  const locked = encounter.status === "Locked" || encounter.status === "Signed" || encounter.status === "Addendum Needed";
  return <div className="space-y-5">
    <section className="grid gap-5 lg:grid-cols-2">
      <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-extrabold text-slate-950">Diagnoses · ICD-10</p></div><div className="space-y-2 p-5">{diagnoses.map((diagnosis, index) => <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3" key={`${diagnosis.code}-${index}`}><Badge tone="sky">{diagnosis.code}</Badge><p className="min-w-40 flex-1 text-xs font-bold text-slate-700">{diagnosis.label}</p>{diagnosis.primary && <Badge tone="teal">Primary</Badge>}{editable && <Button aria-pressed={diagnosis.primary} onClick={() => setDiagnoses((current) => current.map((item, itemIndex) => ({ ...item, primary: itemIndex === index })))} size="sm" type="button" variant="ghost">Set primary</Button>}{editable && <Button aria-label={`Remove ${diagnosis.code}`} onClick={() => removeDiagnosis(index)} size="icon" type="button" variant="ghost"><X className="size-3.5" /></Button>}</div>)}{editable && <div className="grid gap-2 pt-2 sm:grid-cols-[110px_1fr_auto]"><Input onChange={(event) => setDiagnosisCode(event.target.value)} placeholder="E11.65" value={diagnosisCode} /><Input onChange={(event) => setDiagnosisLabel(event.target.value)} placeholder="Diagnosis label" value={diagnosisLabel} /><Button aria-label="Add diagnosis" onClick={addDiagnosis} size="icon" type="button" variant="secondary"><Plus className="size-4" /></Button></div>}</div></Card>
      <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-extrabold text-slate-950">Procedures · CPT / HCPCS</p></div><div className="space-y-2 p-5">{procedures.map((procedure, index) => <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3" key={`${procedure.code}-${index}`}><Badge tone="teal">{procedure.code}</Badge><p className="min-w-40 flex-1 text-xs font-bold text-slate-700">{procedure.label}</p>{editable ? <Input aria-label={`Modifiers for ${procedure.code}`} className="w-28" defaultValue={procedure.modifiers.join(", ")} onChange={(event) => setProcedures((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, modifiers: event.target.value.toUpperCase().split(/[, ]+/).filter(Boolean).slice(0, 4) } : item))} placeholder="25, 59" /> : procedure.modifiers.map((modifier) => <Badge key={modifier} tone="amber">-{modifier}</Badge>)}{editable && <Button aria-label={`Remove ${procedure.code}`} onClick={() => setProcedures((current) => current.filter((_, itemIndex) => itemIndex !== index))} size="icon" type="button" variant="ghost"><X className="size-3.5" /></Button>}</div>)}{editable && <div className="grid gap-2 pt-2 sm:grid-cols-[110px_1fr_auto]"><Input onChange={(event) => setProcedureCode(event.target.value)} placeholder="99214" value={procedureCode} /><Input onChange={(event) => setProcedureLabel(event.target.value)} placeholder="Procedure label" value={procedureLabel} /><Button aria-label="Add procedure" onClick={addProcedure} size="icon" type="button" variant="secondary"><Plus className="size-4" /></Button></div>}</div></Card>
    </section>
    {editable && <div className="flex justify-end"><Button disabled={busy === "coding"} onClick={() => void saveCoding()} variant="secondary">{busy === "coding" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Save coding</Button></div>}
    {locked && <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-extrabold text-slate-950">Signed addenda</p><p className="mt-1 text-[10px] text-slate-500">Addenda append clarification without changing the locked original note.</p></div><div className="space-y-4 p-5">{addenda.map((addendum) => <article className="rounded-xl border border-slate-200 p-4" key={addendum.id}><div className="flex flex-wrap items-center gap-2"><Badge tone="amber">{addendum.reason}</Badge><span className="text-[9px] font-bold text-slate-400">{addendum.author} · {new Date(addendum.signedAt).toLocaleString()}</span></div><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-700">{addendum.text}</p></article>)}{addenda.length === 0 && <p className="text-xs text-slate-500">No addenda have been signed.</p>}{canSign && <div className="grid gap-3 rounded-xl bg-amber-50 p-4"><Input onChange={(event) => setReason(event.target.value)} placeholder="Reason for addendum" value={reason} /><textarea className="min-h-28 rounded-xl border border-amber-200 bg-white p-3 text-xs outline-none focus:ring-4 focus:ring-amber-100" onChange={(event) => setText(event.target.value)} placeholder="Enter the clarification or correction. The original note will remain unchanged." value={text} /><label className="flex items-start gap-2 text-[10px] leading-5 text-amber-900"><input checked={attestation} className="mt-1 accent-amber-700" onChange={(event) => setAttestation(event.target.checked)} type="checkbox" />I attest that this addendum is accurate and understand it will be signed and locked.</label><Button className="justify-self-end" disabled={busy === "addendum" || !reason.trim() || !text.trim() || !attestation} onClick={() => void signAddendum()}>{busy === "addendum" ? <LoaderCircle className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />} Sign addendum</Button></div>}</div></Card>}
    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}{message && <p className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs font-semibold text-teal-800" role="status">{message}</p>}
  </div>;
}
