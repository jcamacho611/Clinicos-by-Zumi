"use client";

import { useDeferredValue, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheckBig, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import {
  buildSyntheticDemoScenario,
  clinicTypeOptions,
  salesPainPoints,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";
import type { FirstValueHandoff } from "@/lib/sales/intake-handoff";
import { StatusPill } from "@/components/sales/status-pill";

const inputClass = "h-12 w-full rounded-xl border border-white/10 bg-white/[.045] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#e6817b]/50 focus:bg-white/[.07] focus:ring-4 focus:ring-[#e6817b]/[.06]";
const labelClass = "mb-2 block text-[12px] font-black uppercase tracking-[.14em] text-slate-500";

interface IntakeState {
  clinicName: string;
  contactName: string;
  contactEmail: string;
  clinicType: (typeof clinicTypeOptions)[number];
  biggestPainPoint: SalesPainPoint;
  painPoints: SalesPainPoint[];
  acknowledgesSyntheticData: boolean;
  website: string;
}

type SubmissionState = {
  reservationId: string;
  scenarioTitle: string;
  nextAction: string;
};

function initialState(initialContext?: FirstValueHandoff): IntakeState {
  const carriedPainPoints = initialContext?.painPoints.length ? initialContext.painPoints : ["follow_ups" as SalesPainPoint];
  return {
    clinicName: "",
    contactName: "",
    contactEmail: "",
    clinicType: initialContext?.clinicType ?? "Primary care",
    biggestPainPoint: initialContext?.biggestPainPoint ?? carriedPainPoints[0],
    painPoints: carriedPainPoints,
    acknowledgesSyntheticData: false,
    website: "",
  };
}

export function SalesIntakeForm({ initialContext }: { initialContext?: FirstValueHandoff }) {
  const [form, setForm] = useState<IntakeState>(() => initialState(initialContext));
  const [submission, setSubmission] = useState<SubmissionState | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const deferredForm = useDeferredValue(form);
  const scenario = buildSyntheticDemoScenario({
    clinicType: deferredForm.clinicType,
    biggestPainPoint: deferredForm.biggestPainPoint,
    painPoints: deferredForm.painPoints,
  });

  function setField<K extends keyof IntakeState>(key: K, value: IntakeState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePainPoint(value: SalesPainPoint) {
    setForm((current) => {
      const painPoints = current.painPoints.includes(value)
        ? current.painPoints.filter((item) => item !== value)
        : [...current.painPoints, value];
      const normalized = painPoints.length ? painPoints : [value];
      return {
        ...current,
        painPoints: normalized,
        biggestPainPoint: normalized.includes(current.biggestPainPoint) ? current.biggestPainPoint : normalized[0],
      };
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
          body: JSON.stringify({
            ...form,
            selectedOffer: "first_value",
            contactRole: null,
            contactPhone: null,
            providerCount: null,
            locationCount: null,
            currentSystems: null,
            estimatedSoftwareSpendDollars: null,
            wantsFirstValue: true,
            wantsProof: false,
            wantsDeepOperatingAudit: false,
            wantsDeployment: false,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The request could not be saved.");
        setSubmission({
          reservationId: payload.data.reservation.id,
          scenarioTitle: payload.data.scenario.title,
          nextAction: payload.data.nextAction,
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The request could not be saved.");
      }
    });
  }

  if (submission) {
    return (
      <section aria-live="polite" className="relative overflow-hidden rounded-[32px] border border-[#e6817b]/20 bg-[linear-gradient(145deg,rgba(230,129,123,.1),rgba(255,255,255,.035))] p-7 shadow-[0_40px_120px_rgba(0,0,0,.4)] sm:p-10">
        <div className="absolute right-0 top-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#e6817b]/10 blur-3xl" />
        <CircleCheckBig className="size-12 text-[#efaaa1]" strokeWidth={1.5} />
        <p className="mt-7 text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">First-value request saved</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">Klinikos has the unfinished-work context.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{submission.nextAction}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Reference</p><p className="mt-2 break-all text-xs font-bold text-white">{submission.reservationId}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Commercial state</p><p className="mt-2 text-xs font-bold text-white">No payment requested</p><p className="mt-1 text-[12px] text-slate-500">No meeting scheduled</p></div>
        </div>
        <div className="mt-5 rounded-2xl border border-[#e6817b]/15 bg-[#e6817b]/[.05] p-5"><StatusPill status="Demo" /><p className="mt-3 text-sm font-bold">{submission.scenarioTitle}</p><p className="mt-1 text-xs leading-5 text-slate-400">Synthetic preview prepared for human review. No patient information was collected.</p></div>
        <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/pricing">Explore governed capabilities</Link><Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/">Return home</Link></div>
      </section>
    );
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]" onSubmit={submit}>
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0e14]/90 shadow-[0_40px_120px_rgba(0,0,0,.42)]">
        <div className="border-b border-white/[.08] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">First useful result</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Tell Klinikos what still needs to happen.</h2></div><StatusPill status="Live" /></div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          {initialContext?.summaryLabels.length ? (
            <section className="rounded-2xl border border-[#e6817b]/18 bg-[#e6817b]/[.055] p-5">
              <div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" /><div><p className="text-xs font-black text-[#ffe2de]">Carried from your unfinished-work map</p><p className="mt-1 text-[12px] leading-5 text-slate-500">Only predefined organization and operating categories were carried forward.</p></div></div>
              <ul className="mt-4 flex flex-wrap gap-2">{initialContext.summaryLabels.map((label) => <li className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[12px] font-bold text-slate-300" key={label}>{label}</li>)}</ul>
            </section>
          ) : null}

          <section className="grid gap-5 sm:grid-cols-2">
            <label><span className={labelClass}>Organization</span><input className={inputClass} required value={form.clinicName} onChange={(event) => setField("clinicName", event.target.value)} /></label>
            <label><span className={labelClass}>Your name</span><input className={inputClass} required value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} /></label>
            <label><span className={labelClass}>Work email</span><input className={inputClass} required type="email" value={form.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)} /></label>
            <label><span className={labelClass}>Organization type</span><select className={inputClass} value={form.clinicType} onChange={(event) => setField("clinicType", event.target.value as IntakeState["clinicType"])}>{clinicTypeOptions.map((option) => <option className="bg-slate-950" key={option} value={option}>{option}</option>)}</select></label>
          </section>

          <section>
            <p className={labelClass}>Where is unfinished work showing up?</p>
            <div className="flex flex-wrap gap-2">{salesPainPoints.map(([key, label]) => {
              const active = form.painPoints.includes(key);
              return <button aria-pressed={active} className={`rounded-full border px-3 py-2 text-xs font-bold ${active ? "border-[#e6817b]/50 bg-[#e6817b]/10 text-[#ffe2de]" : "border-white/10 text-slate-400"}`} key={key} onClick={() => togglePainPoint(key)} type="button">{label}</button>;
            })}</div>
          </section>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs leading-5 text-slate-400">
            <input checked={form.acknowledgesSyntheticData} className="mt-1" onChange={(event) => setField("acknowledgesSyntheticData", event.target.checked)} required type="checkbox" />
            <span>I understand this public flow uses synthetic examples and I will not enter PHI or patient-identifying information.</span>
          </label>
          <input aria-hidden="true" className="hidden" tabIndex={-1} value={form.website} onChange={(event) => setField("website", event.target.value)} />

          {error ? <div className="flex gap-3 rounded-2xl border border-red-300/20 bg-red-300/[.05] p-4 text-xs text-red-100"><CircleAlert className="size-4 shrink-0" />{error}</div> : null}

          <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 transition hover:bg-[#efaaa1] disabled:opacity-50" disabled={pending || !form.acknowledgesSyntheticData} type="submit">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Request first useful result
          </button>
          <div className="flex items-start gap-3 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" />No payment is requested, no meeting is accepted or scheduled, and no production authority is created by this form.</div>
        </div>
      </div>

      <aside className="rounded-[32px] border border-white/10 bg-white/[.025] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-slate-500">Synthetic preview</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-.04em] text-white">{scenario.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{scenario.summary}</p>
        <div className="mt-6 grid gap-3 text-xs text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><strong className="text-white">Named next action</strong><p className="mt-1 text-slate-400">{scenario.syntheticTask.title}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><strong className="text-white">Evidence boundary</strong><p className="mt-1 text-slate-400">Illustrative only until a real workflow and baseline are reviewed.</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><strong className="text-white">Commercial boundary</strong><p className="mt-1 text-slate-400">Paid capability follows only if the first result shows additional economic value.</p></div>
        </div>
      </aside>
    </form>
  );
}
