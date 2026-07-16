"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Check, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clinicTypeOptions, primaryGoalOptions, teamSizeOptions } from "@/lib/onboarding-rules";

type FormState = {
  organizationName: string;
  clinicType: (typeof clinicTypeOptions)[number];
  locationName: string;
  city: string;
  state: string;
  timezone: string;
  teamSize: (typeof teamSizeOptions)[number];
  ownerName: string;
  email: string;
  password: string;
  primaryGoal: (typeof primaryGoalOptions)[number];
  acceptTerms: boolean;
  syntheticDataOnly: boolean;
};

const initialState: FormState = {
  organizationName: "",
  clinicType: "Primary Care",
  locationName: "Main clinic",
  city: "",
  state: "NY",
  timezone: "America/New_York",
  teamSize: "1-5",
  ownerName: "",
  email: "",
  password: "",
  primaryGoal: "Launch a complete clinic workspace",
  acceptTerms: false,
  syntheticDataOnly: false,
};

const selectClassName = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100";

export function OrganizationOnboardingForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function nextStep() {
    setError("");
    if (!form.organizationName.trim() || !form.locationName.trim() || !form.city.trim() || form.state.trim().length !== 2) {
      setError("Complete the organization and primary location information.");
      return;
    }
    setStep(2);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { error?: string; redirectTo?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to create the workspace.");
        return;
      }
      window.location.assign(result.redirectTo ?? "/dashboard?onboarding=complete");
    } catch {
      setError("Unable to reach ClinicOS. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="rounded-[28px] border border-white/10 bg-white p-5 text-slate-950 shadow-[0_32px_100px_rgba(0,0,0,.35)] sm:p-7" onSubmit={submit}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-cyan-700">Create your organization</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">{step === 1 ? "Tell us how your clinic works." : "Create the owner account."}</h2>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-extrabold text-white">{step} / 2</span>
      </div>

      {step === 1 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-700 sm:col-span-2">Organization name<Input autoComplete="organization" className="mt-2 h-11" onChange={(event) => update("organizationName", event.target.value)} placeholder="Northstar Family Health" required value={form.organizationName} /></label>
          <label className="block text-xs font-bold text-slate-700">Clinic type<select className={selectClassName} onChange={(event) => update("clinicType", event.target.value as FormState["clinicType"])} value={form.clinicType}>{clinicTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="block text-xs font-bold text-slate-700">Team size<select className={selectClassName} onChange={(event) => update("teamSize", event.target.value as FormState["teamSize"])} value={form.teamSize}>{teamSizeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="block text-xs font-bold text-slate-700 sm:col-span-2">Primary goal<select className={selectClassName} onChange={(event) => update("primaryGoal", event.target.value as FormState["primaryGoal"])} value={form.primaryGoal}>{primaryGoalOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="block text-xs font-bold text-slate-700 sm:col-span-2">Primary location<Input className="mt-2 h-11" onChange={(event) => update("locationName", event.target.value)} required value={form.locationName} /></label>
          <label className="block text-xs font-bold text-slate-700">City<Input autoComplete="address-level2" className="mt-2 h-11" onChange={(event) => update("city", event.target.value)} placeholder="Brooklyn" required value={form.city} /></label>
          <label className="block text-xs font-bold text-slate-700">State<Input autoComplete="address-level1" className="mt-2 h-11 uppercase" maxLength={2} onChange={(event) => update("state", event.target.value.toUpperCase())} required value={form.state} /></label>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-bold text-slate-700">Your full name<Input autoComplete="name" className="mt-2 h-11" onChange={(event) => update("ownerName", event.target.value)} required value={form.ownerName} /></label>
          <label className="block text-xs font-bold text-slate-700">Work email<Input autoComplete="email" className="mt-2 h-11" onChange={(event) => update("email", event.target.value)} required type="email" value={form.email} /></label>
          <label className="block text-xs font-bold text-slate-700">Create password<Input autoComplete="new-password" className="mt-2 h-11" minLength={12} onChange={(event) => update("password", event.target.value)} required type="password" value={form.password} /><span className="mt-2 block text-[10px] font-medium leading-5 text-slate-400">12+ characters with uppercase, lowercase, number, and symbol.</span></label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600"><input checked={form.syntheticDataOnly} className="mt-1 accent-cyan-700" onChange={(event) => update("syntheticDataOnly", event.target.checked)} required type="checkbox" /><span><strong className="text-slate-900">Synthetic data boundary.</strong> I will not enter real patient information until ClinicOS confirms approved production infrastructure.</span></label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600"><input checked={form.acceptTerms} className="mt-1 accent-cyan-700" onChange={(event) => update("acceptTerms", event.target.checked)} required type="checkbox" /><span>I accept the service terms and understand vendor connections remain pending until contracts and verification are complete.</span></label>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">{error}</p>}

      <div className="mt-6 flex gap-3">
        {step === 2 && <Button className="shrink-0" onClick={() => { setError(""); setStep(1); }} type="button" variant="secondary"><ArrowLeft className="size-4" /> Back</Button>}
        {step === 1 ? (
          <Button className="flex-1 bg-cyan-700 hover:bg-cyan-600" onClick={nextStep} type="button">Continue <ArrowRight className="size-4" /></Button>
        ) : (
          <Button className="flex-1 bg-cyan-700 hover:bg-cyan-600" disabled={submitting} type="submit">
            {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Creating your workspace...</> : <><Building2 className="size-4" /> Create free workspace</>}
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-[10px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><LockKeyhole className="size-3.5 text-cyan-700" /> No credit card required</span>
        <Link className="font-extrabold text-slate-900 hover:text-cyan-700" href="/login">Already have a workspace?</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{["Tenant isolated", "Audited", "Manual fallbacks ready"].map((label) => <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600" key={label}><Check className="size-3 text-cyan-700" />{label}</span>)}</div>
    </form>
  );
}
