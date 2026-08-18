"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InsuranceWorkspaceData } from "@/lib/repositories/insurance-repository";

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50";

function dollarsToCents(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return Number.NaN;
  return Math.round(amount * 100);
}

export function InsuranceVerificationAction({ coverages }: { coverages: InsuranceWorkspaceData["coverages"] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [insuranceId, setInsuranceId] = useState(coverages[0]?.id ?? "");
  const [eligibilityStatus, setEligibilityStatus] = useState<"active" | "inactive" | "unknown" | "needs_review">("unknown");
  const [copay, setCopay] = useState("");
  const [deductible, setDeductible] = useState("");
  const [coinsurance, setCoinsurance] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const copayCents = dollarsToCents(copay);
    const deductibleCents = dollarsToCents(deductible);
    const coinsurancePercent = coinsurance.trim() ? Number(coinsurance) : null;
    if (Number.isNaN(copayCents) || Number.isNaN(deductibleCents) || (coinsurancePercent !== null && (!Number.isFinite(coinsurancePercent) || coinsurancePercent < 0 || coinsurancePercent > 100))) {
      setError("Enter valid non-negative benefit amounts and a coinsurance percentage from 0 to 100.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/insurance/verifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          insuranceId,
          eligibilityStatus,
          copayCents,
          deductibleCents,
          coinsurancePercent,
          effectiveDate: effectiveDate || null,
          terminationDate: terminationDate || null,
          source,
          notes: notes || null,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Insurance verification evidence could not be recorded.");
      setOpen(false);
      setEligibilityStatus("unknown");
      setCopay(""); setDeductible(""); setCoinsurance(""); setEffectiveDate(""); setTerminationDate(""); setSource(""); setNotes("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Insurance verification evidence could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return <Button disabled={coverages.length === 0} onClick={() => setOpen(true)} variant="primary"><FileCheck2 className="size-4" /> Record verification evidence</Button>;
  }

  return <form className="w-full max-w-4xl rounded-2xl border border-teal-200 bg-teal-50/70 p-5" onSubmit={submit}>
    <div className="flex items-start gap-3">
      <div><p className="text-sm font-extrabold text-slate-950">Record manual eligibility evidence</p><p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">Use a real payer portal, phone response, card/evidence review, or other authorized source. This records what staff observed; it is not a live 270/271 transaction and never guarantees payment.</p></div>
      <Button aria-label="Close verification form" className="ml-auto" disabled={busy} onClick={() => setOpen(false)} size="icon" type="button" variant="ghost"><X className="size-4" /></Button>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="text-xs font-bold text-slate-700 xl:col-span-2">Coverage<select className={`mt-2 ${selectClass}`} onChange={(event) => setInsuranceId(event.target.value)} required value={insuranceId}>{coverages.map((coverage) => <option key={coverage.id} value={coverage.id}>{coverage.patientName} · {coverage.patientMrn} · {coverage.payer} · {coverage.memberId}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-700">Eligibility observed<select className={`mt-2 ${selectClass}`} onChange={(event) => setEligibilityStatus(event.target.value as typeof eligibilityStatus)} value={eligibilityStatus}><option value="active">Active</option><option value="inactive">Inactive</option><option value="unknown">Unknown</option><option value="needs_review">Needs review</option></select></label>
      <label className="text-xs font-bold text-slate-700">Copay ($)<Input className="mt-2" inputMode="decimal" min="0" onChange={(event) => setCopay(event.target.value)} placeholder="Optional" step="0.01" type="number" value={copay} /></label>
      <label className="text-xs font-bold text-slate-700">Deductible ($)<Input className="mt-2" inputMode="decimal" min="0" onChange={(event) => setDeductible(event.target.value)} placeholder="Optional" step="0.01" type="number" value={deductible} /></label>
      <label className="text-xs font-bold text-slate-700">Coinsurance (%)<Input className="mt-2" inputMode="decimal" max="100" min="0" onChange={(event) => setCoinsurance(event.target.value)} placeholder="Optional" step="0.01" type="number" value={coinsurance} /></label>
      <label className="text-xs font-bold text-slate-700">Effective date<Input className="mt-2" onChange={(event) => setEffectiveDate(event.target.value)} type="date" value={effectiveDate} /></label>
      <label className="text-xs font-bold text-slate-700">Termination date<Input className="mt-2" onChange={(event) => setTerminationDate(event.target.value)} type="date" value={terminationDate} /></label>
      <label className="text-xs font-bold text-slate-700">Evidence source<Input className="mt-2" maxLength={160} onChange={(event) => setSource(event.target.value)} placeholder="e.g. payer portal, call ref #..." required value={source} /></label>
      <label className="text-xs font-bold text-slate-700 md:col-span-2 xl:col-span-3">Staff notes<textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50" maxLength={2000} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context or limitations" value={notes} /></label>
    </div>
    {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[12px] text-slate-500">Klinikos timestamps the record, attaches the staff user, and writes an audit receipt. It does not mark external electronic eligibility as connected.</p><Button disabled={busy || !insuranceId || source.trim().length < 3} type="submit">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Save evidence</Button></div>
  </form>;
}
