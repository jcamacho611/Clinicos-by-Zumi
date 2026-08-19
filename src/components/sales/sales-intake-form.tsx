"use client";

import { useDeferredValue, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, CircleCheckBig, LoaderCircle, Radar, ShieldCheck, Sparkles } from "lucide-react";
import {
  buildSyntheticDemoScenario,
  clinicTypeOptions,
  painPointLabel,
  salesPainPoints,
  type DemoOfferKey,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";
import type { PaidAnalysisHandoff } from "@/lib/sales/intake-handoff";
import { StatusPill } from "@/components/sales/status-pill";

const inputClass = "h-12 w-full rounded-xl border border-white/10 bg-white/[.045] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#e6817b]/50 focus:bg-white/[.07] focus:ring-4 focus:ring-[#e6817b]/[.06]";
const labelClass = "mb-2 block text-[12px] font-black uppercase tracking-[.14em] text-slate-500";
const ANALYSIS_OFFER_KEY: DemoOfferKey = "private_workflow_demo";

export type PublicAnalysisOffer = {
  name: string;
  priceLabel: string;
  creditForward: string;
};

/**
 * Only what the purchase needs. Role, phone, provider count, location count, current
 * vendors and monthly spend are deliberately absent: they are not read when creating the
 * reservation or the server-owned checkout, and carrying them here would mean sending
 * placeholder values — `providerCount: 1` for a twelve-provider clinic — that the server
 * would then store as though the buyer had answered. They are collected after payment.
 */
interface IntakeState {
  clinicName: string;
  contactName: string;
  contactEmail: string;
  clinicType: (typeof clinicTypeOptions)[number];
  biggestPainPoint: SalesPainPoint;
  /** Carried from the Zumi operating interview; drives the scenario preview. */
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
  checkoutUrl: string | null;
  expectedAmountCents: number | null;
  checkoutNotice: string;
  /** Signed link to the activation step. Rail-independent, so it survives a fixed
   *  payment link that carries no return URL of its own. */
  activationPath: string | null;
};

function initialState(initialContext?: PaidAnalysisHandoff): IntakeState {
  const carriedPainPoints = initialContext?.painPoints.length ? initialContext.painPoints : ["follow_ups" as SalesPainPoint];
  return {
    clinicName: "",
    contactName: "",
    contactEmail: "",
    clinicType: initialContext?.clinicType ?? "Primary care",
    biggestPainPoint: initialContext?.biggestPainPoint ?? carriedPainPoints[0],
    painPoints: carriedPainPoints,
    selectedOffer: ANALYSIS_OFFER_KEY,
    wantsFreeIntro: false,
    wantsPaidDemo: true,
    wantsFoundingEvaluation: false,
    wantsFoundingProgram: false,
    acknowledgesSyntheticData: false,
    website: "",
  };
}

export function SalesIntakeForm({ analysisOffer, initialContext }: { analysisOffer: PublicAnalysisOffer; initialContext?: PaidAnalysisHandoff }) {
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

  function togglePainPoint(key: SalesPainPoint) {
    setForm((current) => {
      const selected = current.painPoints.includes(key);
      if (selected && current.painPoints.length === 1) return current;
      const painPoints = selected ? current.painPoints.filter((item) => item !== key) : [...current.painPoints, key];
      return {
        ...current,
        painPoints,
        biggestPainPoint: selected && current.biggestPainPoint === key ? painPoints[0] : current.biggestPainPoint,
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
            selectedOffer: ANALYSIS_OFFER_KEY,
            wantsFreeIntro: false,
            wantsPaidDemo: true,
            wantsFoundingEvaluation: false,
            wantsFoundingProgram: false,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The request could not be saved.");
        setSubmission({
          reservationId: payload.data.reservation.id,
          scenarioTitle: payload.data.scenario.title,
          checkoutUrl: payload.data.checkout?.checkoutUrl ?? null,
          expectedAmountCents: payload.data.checkout?.expectedAmountCents ?? null,
          activationPath: payload.data.activationPath ?? null,
          checkoutNotice: payload.data.checkoutNotice ?? "Your request is saved for human review.",
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
        <p className="mt-7 text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">Request saved</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">Your {analysisOffer.name} is reserved.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{submission.checkoutNotice}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Reservation</p><p className="mt-2 break-all text-xs font-bold text-white">{submission.reservationId}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Selected</p><p className="mt-2 text-xs font-bold text-white">{analysisOffer.name}</p><p className="mt-1 text-[12px] text-slate-500">{analysisOffer.priceLabel}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">Payment</p><p className={`mt-2 text-xs font-bold ${submission.checkoutUrl ? "text-[#efaaa1]" : "text-amber-200"}`}>{submission.checkoutUrl ? "Secure checkout ready" : "Saved for follow-up"}</p></div>
        </div>
        <div className="mt-5 rounded-2xl border border-[#e6817b]/15 bg-[#e6817b]/[.05] p-5"><StatusPill status="Demo" /><p className="mt-3 text-sm font-bold">{submission.scenarioTitle}</p><p className="mt-1 text-xs leading-5 text-slate-400">Synthetic preview prepared for human review. No patient information was collected.</p></div>
        {submission.checkoutUrl ? (
          <div className="mt-6 rounded-2xl border border-[#e6817b]/20 bg-[#e6817b]/[.05] p-5">
            <p className="text-xs font-black text-[#ffe2de]">The server-owned {analysisOffer.priceLabel} amount is locked to this checkout intent.</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Opening or returning from the secure payment page does not mark the purchase paid. Klinikos waits for signed processor evidence or authorized reconciliation before treating the engagement as paid.</p>
            <a className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 transition hover:bg-[#efaaa1]" href={submission.checkoutUrl}>Continue to secure payment <ArrowRight className="size-4" /></a>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5 text-[11px] leading-5 text-amber-100/75">Your request is saved. Klinikos will not invent a different payment method or amount when the configured checkout rail is unavailable; authorized follow-up can continue from this reservation.</div>
        )}
        {submission.activationPath ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] p-5">
            <p className="text-xs font-black text-white">While we prepare, tell us about the clinic.</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Optional, and separate from payment. Anything you share goes straight into the analysis; anything you skip we cover on the call. Keep this link — it works whether or not checkout is finished.</p>
            <Link className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-xs font-black text-white transition hover:bg-white/[.05]" href={submission.activationPath}>Continue setup <ArrowRight className="size-4" /></Link>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/pricing">See what comes next</Link><Link className="rounded-full border border-white/15 px-5 py-3 text-xs font-black text-white" href="/">Return home</Link></div>
      </section>
    );
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]" onSubmit={submit}>
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0e14]/90 shadow-[0_40px_120px_rgba(0,0,0,.42)]">
        <div className="border-b border-white/[.08] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">Clinic analysis intake</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Save the clinic once, then continue to the exact checkout.</h2></div><StatusPill status="Live" /></div>
        </div>

        <div className="space-y-9 p-6 sm:p-8">
          {initialContext?.summaryLabels.length ? (
            <section className="rounded-2xl border border-[#e6817b]/18 bg-[#e6817b]/[.055] p-5">
              <div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" /><div><p className="text-xs font-black text-[#ffe2de]">Carried from your operating map</p><p className="mt-1 text-[12px] leading-5 text-slate-500">Only matching clinic-type and bottleneck categories were carried forward. Review or change them below before submitting.</p></div></div>
              <ul className="mt-4 flex flex-wrap gap-2">{initialContext.summaryLabels.map((label) => <li className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[12px] font-bold text-slate-300" key={label}>{label}</li>)}</ul>
            </section>
          ) : null}

          <section>
            <p className="mb-4 text-[12px] font-black uppercase tracking-[.18em] text-slate-500">01 / Clinic profile</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={labelClass}>Clinic name</span><input className={inputClass} required value={form.clinicName} onChange={(event) => setField("clinicName", event.target.value)} placeholder="Northstar Family Practice" /></label>
              <label><span className={labelClass}>Contact name</span><input className={inputClass} required value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} placeholder="Jordan Rivera" /></label>
              <label><span className={labelClass}>Email</span><input className={inputClass} required type="email" value={form.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)} placeholder="you@clinic.com" /></label>
              <label className="sm:col-span-2"><span className={labelClass}>Clinic type</span><select className={inputClass} value={form.clinicType} onChange={(event) => setField("clinicType", event.target.value as IntakeState["clinicType"])}>{clinicTypeOptions.map((option) => <option className="bg-slate-950" key={option}>{option}</option>)}</select></label>
            </div>
          </section>

          <section>
            <p className="mb-4 text-[12px] font-black uppercase tracking-[.18em] text-slate-500">02 / Where work gets stuck</p>
            <label className="block"><span className={labelClass}>What is costing you the most right now?</span><select className={inputClass} value={form.biggestPainPoint} onChange={(event) => setField("biggestPainPoint", event.target.value as SalesPainPoint)}>{salesPainPoints.map(([key, label]) => <option className="bg-slate-950" key={key} value={key}>{label}</option>)}</select></label>
            <p className="mt-3 text-[12px] leading-5 text-slate-600">One answer is enough to prepare the analysis. The rest of the picture is worth having, and we ask for it after payment, when it shapes the work instead of delaying it.</p>
          </section>

          <section>
            <p className="mb-4 text-[12px] font-black uppercase tracking-[.18em] text-slate-500">03 / Paid engagement</p>
            <div className="rounded-2xl border border-[#e6817b]/28 bg-[#e6817b]/[.07] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black text-white">{analysisOffer.name}</p><p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-400">Clinic-specific operating review, synthetic scenario, cost/workflow discussion, and human-reviewed recommendation.</p></div><p className="text-2xl font-black text-[#d6b787]">{analysisOffer.priceLabel}</p></div>
              <p className="mt-4 border-t border-white/10 pt-4 text-[12px] leading-5 text-slate-500">{analysisOffer.creditForward}</p>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-slate-600">Implementation Blueprint, Founding Clinic Implementation, and recurring software are reviewed after this analysis. They are not selectable from this checkout intake.</p>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-4">
            <input className="mt-0.5 size-4 accent-amber-300" checked={form.acknowledgesSyntheticData} required type="checkbox" onChange={(event) => setField("acknowledgesSyntheticData", event.target.checked)} />
            <span><span className="block text-xs font-black text-amber-100">Analysis preparation uses synthetic data only.</span><span className="mt-1 block text-[11px] leading-5 text-amber-100/60">Do not enter real patient information. This intake is for clinic operations and business systems only.</span></span>
          </label>
          <input aria-hidden="true" autoComplete="off" className="hidden" tabIndex={-1} value={form.website} onChange={(event) => setField("website", event.target.value)} />
          {error && <div className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] p-4 text-xs leading-5 text-rose-100" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div>}
          <button className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-black text-slate-950 transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || !form.acknowledgesSyntheticData} type="submit">{pending ? <><LoaderCircle className="size-4 animate-spin" /> Saving your Klinikos request</> : <>Reserve &amp; continue {analysisOffer.name}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}</button>
          <p className="text-center text-[12px] leading-5 text-slate-600">The reservation is saved before payment. Klinikos then creates the exact server-owned checkout intent; browser return is never payment proof.</p>
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(15,23,42,.94),rgba(6,10,15,.98))] shadow-[0_40px_120px_rgba(0,0,0,.45)]">
          <div className="border-b border-white/[.08] p-6 sm:p-8">
            <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl border border-[#e6817b]/15 bg-[#e6817b]/[.06] text-[#efaaa1]"><Radar className="size-5" /></span><StatusPill status="Demo" /></div>
            <p className="mt-7 text-[12px] font-black uppercase tracking-[.2em] text-[#efaaa1]">Synthetic scenario preview</p>
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
            ] as const).map(([label, value, status]) => <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4" key={label}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-600">{label}</p><StatusPill status={status} /></div><p className="mt-2 text-xs font-bold text-slate-200">{value}</p></div>)}
          </div>
          <div className="border-t border-white/[.08] bg-[#e6817b]/[.035] p-6 sm:p-8">
            <div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" /><div><p className="text-xs font-black">Recommended Klinikos workflow</p><p className="mt-2 text-[11px] leading-5 text-slate-400">{scenario.recommendedWorkflow.steps.join(" → ")}</p></div></div>
            <div className="mt-5 flex items-start gap-3 border-t border-white/[.07] pt-5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-200" /><p className="text-[12px] leading-5 text-slate-500">Illustrative scenario only. No diagnosis, treatment, coverage decision, claim submission, record release, or live vendor delivery occurs.</p></div>
          </div>
        </div>
      </aside>
    </form>
  );
}
