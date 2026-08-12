"use client";

import { useDeferredValue, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, CircleCheckBig, LoaderCircle, Radar, ShieldCheck, Sparkles } from "lucide-react";
import {
  buildSyntheticDemoScenario,
  clinicTypeOptions,
  demoOfferKeys,
  demoOffers,
  painPointLabel,
  salesPainPoints,
  type DemoOfferKey,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";
import { StatusPill } from "@/components/sales/status-pill";

const inputClass = "h-12 w-full rounded-xl border border-white/10 bg-white/[.045] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:bg-white/[.07] focus:ring-4 focus:ring-emerald-300/[.06]";
const labelClass = "mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500";

interface IntakeState {
  clinicName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  clinicType: (typeof clinicTypeOptions)[number];
  providerCount: number;
  locationCount: number;
  currentSystems: { ehr: string; scheduling: string; billing: string; crm: string; patientMessaging: string };
  estimatedSoftwareSpendDollars: number;
  biggestPainPoint: SalesPainPoint;
  painPoints: SalesPainPoint[];
  selectedOffer: DemoOfferKey;
  wantsFreeIntro: boolean;
  wantsPaidDemo: boolean;
  wantsFoundingEvaluation: boolean;
  wantsFoundingProgram: boolean;
  acknowledgesSyntheticData: boolean;
  website: string;
}

type SubmissionState = {
  reservationId: string;
  scenarioTitle: string;
  offerName: string;
  offerPrice: string;
  checkoutUrl: string | null;
  expectedAmountCents: number | null;
  checkoutNotice: string;
};

function initialState(defaultOffer: DemoOfferKey): IntakeState {
  return {
    clinicName: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactPhone: "",
    clinicType: "Primary care",
    providerCount: 1,
    locationCount: 1,
    currentSystems: { ehr: "", scheduling: "", billing: "", crm: "", patientMessaging: "" },
    estimatedSoftwareSpendDollars: 0,
    biggestPainPoint: "follow_ups",
    painPoints: ["follow_ups"],
    selectedOffer: defaultOffer,
    wantsFreeIntro: false,
    wantsPaidDemo: true,
    wantsFoundingEvaluation: defaultOffer === "founding_clinic_evaluation",
    wantsFoundingProgram: defaultOffer === "founding_clinic_program",
    acknowledgesSyntheticData: false,
    website: "",
  };
}

export function SalesIntakeForm({ defaultOffer = "private_workflow_demo" }: { defaultOffer?: DemoOfferKey }) {
  const [form, setForm] = useState(() => initialState(defaultOffer));
  const [submission, setSubmission] = useState<SubmissionState | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const deferredForm = useDeferredValue(form);
  const scenario = buildSyntheticDemoScenario({ clinicType: deferredForm.clinicType, biggestPainPoint: deferredForm.biggestPainPoint, painPoints: deferredForm.painPoints });
  const selectedOffer = demoOffers[form.selectedOffer];

  function setField<K extends keyof IntakeState>(key: K, value: IntakeState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePainPoint(key: SalesPainPoint) {
    setForm((current) => {
      const selected = current.painPoints.includes(key);
      if (selected && current.painPoints.length === 1) return current;
      const painPoints = selected ? current.painPoints.filter((item) => item !== key) : [...current.painPoints, key];
      return { ...current, painPoints, biggestPainPoint: selected && current.biggestPainPoint === key ? painPoints[0] : current.biggestPainPoint };
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/sales/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The request could not be saved.");
        setSubmission({
          reservationId: payload.data.reservation.id,
          scenarioTitle: payload.data.scenario.title,
          offerName: payload.data.offer.name,
          offerPrice: selectedOffer.shortPrice,
          checkoutUrl: payload.data.checkout?.checkoutUrl ?? null,
          expectedAmountCents: payload.data.checkout?.expectedAmountCents ?? null,
          checkoutNotice: payload.data.checkoutNotice ?? "Your request is saved for human review.",
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The request could not be saved.");
      }
    });
  }

  if (submission) {
    return (
      <section aria-live="polite" className="relative overflow-hidden rounded-[32px] border border-emerald-300/20 bg-[linear-gradient(145deg,rgba(16,185,129,.12),rgba(255,255,255,.035))] p-7 shadow-[0_40px_120px_rgba(0,0,0,.4)] sm:p-10">
        <div className="absolute right-0 top-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-300/10 blur-3xl" />
        <CircleCheckBig className="size-12 text-emerald-300" strokeWidth={1.5} />
        <p className="mt-7 text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Request saved</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">Your Klinikos review is in motion.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{submission.checkoutNotice}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Reservation</p><p className="mt-2 break-all text-xs font-bold text-white">{submission.reservationId}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Selected</p><p className="mt-2 text-xs font-bold text-white">{submission.offerName}</p><p className="mt-1 text-[10px] text-slate-500">{submission.offerPrice}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Payment</p><p className={`mt-2 text-xs font-bold ${submission.checkoutUrl ? "text-emerald-200" : "text-amber-200"}`}>{submission.checkoutUrl ? "Secure checkout ready" : "Review before checkout"}</p></div>
        </div>
        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-5"><StatusPill status="Demo" /><p className="mt-3 text-sm font-bold">{submission.scenarioTitle}</p><p className="mt-1 text-xs leading-5 text-slate-400">Synthetic preview prepared for human review. No patient information was collected.</p></div>
        {submission.checkoutUrl ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-5">
            <p className="text-xs font-black text-emerald-100">Your selected $500 analysis is locked to this checkout intent.</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Opening GoDaddy does not mark the purchase paid. Klinikos waits for verified or reconciled payment evidence before treating the engagement as paid.</p>
            <a className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 transition hover:bg-emerald-200" href={submission.checkoutUrl}>Continue to secure payment <ArrowRight className="size-4" /></a>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5 text-[11px] leading-5 text-amber-100/75">Klinikos will not open a generic or wrong-amount payment page. Fixed higher-value offers need their matching exact-value checkout configured; implementation scopes still require human confirmation before payment.</div>
        )}
        <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/demo">Explore the demo system</Link><Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/founding-clinic">Review founding options</Link></div>
      </section>
    );
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]" onSubmit={submit}>
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0e14]/90 shadow-[0_40px_120px_rgba(0,0,0,.42)]">
        <div className="border-b border-white/[.08] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Clinic signal intake</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Build the right review, not a generic tour.</h2></div><StatusPill status="Live" /></div>
        </div>

        <div className="space-y-9 p-6 sm:p-8">
          <section>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">01 / Clinic profile</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={labelClass}>Clinic name</span><input className={inputClass} required value={form.clinicName} onChange={(event) => setField("clinicName", event.target.value)} placeholder="Northstar Family Practice" /></label>
              <label><span className={labelClass}>Contact name</span><input className={inputClass} required value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} placeholder="Jordan Rivera" /></label>
              <label><span className={labelClass}>Role</span><input className={inputClass} required value={form.contactRole} onChange={(event) => setField("contactRole", event.target.value)} placeholder="Owner / practice manager" /></label>
              <label><span className={labelClass}>Email</span><input className={inputClass} required type="email" value={form.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)} placeholder="you@clinic.com" /></label>
              <label><span className={labelClass}>Phone</span><input className={inputClass} required type="tel" value={form.contactPhone} onChange={(event) => setField("contactPhone", event.target.value)} placeholder="(212) 555-0100" /></label>
              <label className="sm:col-span-2"><span className={labelClass}>Clinic type</span><select className={inputClass} value={form.clinicType} onChange={(event) => setField("clinicType", event.target.value as IntakeState["clinicType"])}>{clinicTypeOptions.map((option) => <option className="bg-slate-950" key={option}>{option}</option>)}</select></label>
              <label><span className={labelClass}>Providers</span><input className={inputClass} min={1} required type="number" value={form.providerCount} onChange={(event) => setField("providerCount", Math.max(1, Number(event.target.value)))} /></label>
              <label><span className={labelClass}>Locations</span><input className={inputClass} min={1} required type="number" value={form.locationCount} onChange={(event) => setField("locationCount", Math.max(1, Number(event.target.value)))} /></label>
            </div>
          </section>

          <section>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">02 / Where work gets stuck</p>
            <div className="flex flex-wrap gap-2">
              {salesPainPoints.map(([key, label]) => {
                const active = form.painPoints.includes(key);
                return <button aria-pressed={active} className={`rounded-full border px-3.5 py-2 text-[11px] font-bold transition ${active ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[.03] text-slate-400 hover:border-white/20 hover:text-white"}`} key={key} onClick={() => togglePainPoint(key)} type="button">{active && <Check className="mr-1.5 inline size-3" />}{label}</button>;
              })}
            </div>
            <label className="mt-5 block"><span className={labelClass}>Biggest pain point</span><select className={inputClass} value={form.biggestPainPoint} onChange={(event) => { const value = event.target.value as SalesPainPoint; setForm((current) => ({ ...current, biggestPainPoint: value, painPoints: current.painPoints.includes(value) ? current.painPoints : [...current.painPoints, value] })); }}>{form.painPoints.map((key) => <option className="bg-slate-950" key={key} value={key}>{painPointLabel[key]}</option>)}</select></label>
          </section>

          <section>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">03 / Current system map</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {([['ehr', 'Current EHR'], ['scheduling', 'Scheduling'], ['billing', 'Billing'], ['crm', 'CRM / follow-up'], ['patientMessaging', 'Patient messaging']] as const).map(([key, label]) => <label key={key}><span className={labelClass}>{label}</span><input className={inputClass} value={form.currentSystems[key]} onChange={(event) => setForm((current) => ({ ...current, currentSystems: { ...current.currentSystems, [key]: event.target.value } }))} placeholder="None or vendor name" /></label>)}
              <label><span className={labelClass}>Monthly software estimate</span><div className="relative"><span className="absolute left-3.5 top-3.5 text-sm text-slate-500">$</span><input className={`${inputClass} pl-8`} min={0} type="number" value={form.estimatedSoftwareSpendDollars} onChange={(event) => setField("estimatedSoftwareSpendDollars", Math.max(0, Number(event.target.value)))} /></div></label>
            </div>
          </section>

          <section>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">04 / Choose what happens next</p>
            <div className="grid gap-3">
              {demoOfferKeys.map((key) => { const offer = demoOffers[key]; const active = form.selectedOffer === key; return <button className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${active ? "border-cyan-300/35 bg-cyan-300/[.08]" : "border-white/10 bg-white/[.025] hover:border-white/20"}`} key={key} onClick={() => setForm((current) => ({ ...current, selectedOffer: key, wantsPaidDemo: true, wantsFoundingEvaluation: key === "founding_clinic_evaluation", wantsFoundingProgram: key === "founding_clinic_program" }))} type="button"><span className={`grid size-5 shrink-0 place-items-center rounded-full border ${active ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-600"}`}>{active && <Check className="size-3" />}</span><span className="flex-1"><span className="block text-xs font-black text-white">{offer.name}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{offer.creditForward}</span></span><span className="text-sm font-black text-white">{offer.shortPrice}</span></button>; })}
            </div>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-4">
            <input className="mt-0.5 size-4 accent-amber-300" checked={form.acknowledgesSyntheticData} required type="checkbox" onChange={(event) => setField("acknowledgesSyntheticData", event.target.checked)} />
            <span><span className="block text-xs font-black text-amber-100">Demo uses synthetic data only.</span><span className="mt-1 block text-[11px] leading-5 text-amber-100/60">Do not enter real patient information. This intake is for clinic operations and business systems only.</span></span>
          </label>
          <input aria-hidden="true" autoComplete="off" className="hidden" tabIndex={-1} value={form.website} onChange={(event) => setField("website", event.target.value)} />
          {error && <div className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] p-4 text-xs leading-5 text-rose-100" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div>}
          <button className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || !form.acknowledgesSyntheticData} type="submit">{pending ? <><LoaderCircle className="size-4 animate-spin" /> Saving your Klinikos request</> : <>{form.selectedOffer === "private_workflow_demo" ? "Reserve & continue" : "Request"} {selectedOffer.name}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}</button>
          <p className="text-center text-[10px] leading-5 text-slate-600">Your selection is saved before payment. The $500 analysis can continue to its exact configured checkout; larger scopes stop for review instead of opening a generic or wrong-amount payment page.</p>
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(15,23,42,.94),rgba(6,10,15,.98))] shadow-[0_40px_120px_rgba(0,0,0,.45)]">
          <div className="border-b border-white/[.08] p-6 sm:p-8">
            <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[.07] text-cyan-200"><Radar className="size-5" /></span><StatusPill status="Demo" /></div>
            <p className="mt-7 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Live scenario preview</p>
            <h3 className="mt-3 text-3xl font-black tracking-[-.055em]">{scenario.title}</h3>
            <p className="mt-4 text-sm leading-6 text-slate-400">{scenario.summary}</p>
          </div>
          <div className="space-y-3 p-6 sm:p-8">
            {([
              ["Synthetic patient", scenario.syntheticPatient.name, "Demo" as const],
              ["Missing signal", scenario.syntheticDocument.missingItem, "Human review required" as const],
              ["Partner handoff", scenario.syntheticReferral.status, "Manual fallback" as const],
              ["Result control", scenario.syntheticResult.status, "Human review required" as const],
              ["Billing state", scenario.syntheticBillingItem.status, "Requires production review" as const],
            ] as const).map(([label, value, status]) => <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4" key={label}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{label}</p><StatusPill status={status} /></div><p className="mt-2 text-xs font-bold text-slate-200">{value}</p></div>)}
          </div>
          <div className="border-t border-white/[.08] bg-emerald-300/[.045] p-6 sm:p-8">
            <div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-300" /><div><p className="text-xs font-black">Recommended Klinikos workflow</p><p className="mt-2 text-[11px] leading-5 text-slate-400">{scenario.recommendedWorkflow.steps.join(" -> ")}</p></div></div>
            <div className="mt-5 flex items-start gap-3 border-t border-white/[.07] pt-5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-200" /><p className="text-[10px] leading-5 text-slate-500">Illustrative scenario only. No diagnosis, treatment, coverage decision, claim submission, record release, or live vendor delivery occurs.</p></div>
          </div>
        </div>
      </aside>
    </form>
  );
}
