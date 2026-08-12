"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";
import type { ClinicActivationDraft } from "@/lib/commercial/clinic-activation-rules";

type FormState = ClinicActivationDraft & {
  password: string;
  acceptTerms: boolean;
  syntheticDataOnly: true;
};

const defaultDraft: ClinicActivationDraft = {
  ownerName: "",
  clinicType: "Primary care",
  locationName: "Main clinic",
  city: "",
  state: "NY",
  timezone: "America/New_York",
  teamSize: "1-5",
  primaryGoal: "Bring clinic operations, follow-up, and visibility into one workspace",
  currentSystems: "",
  migrationExpectation: "needs_review",
  communicationsState: "needs_review",
};

function draftFromForm(form: FormState): ClinicActivationDraft {
  return {
    ownerName: form.ownerName,
    clinicType: form.clinicType,
    locationName: form.locationName,
    city: form.city,
    state: form.state,
    timezone: form.timezone,
    teamSize: form.teamSize,
    primaryGoal: form.primaryGoal,
    currentSystems: form.currentSystems,
    migrationExpectation: form.migrationExpectation,
    communicationsState: form.communicationsState,
  };
}

export function ClinicActivationForm({ token, organizationName, email, productLabel, initialDraft }: { token: string; organizationName: string; email: string; productLabel: string; initialDraft?: ClinicActivationDraft }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const skipInitialSave = useRef(true);
  const [form, setForm] = useState<FormState>({
    ...defaultDraft,
    ...initialDraft,
    password: "",
    acceptTerms: false,
    syntheticDataOnly: true,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch("/api/onboarding/activate", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...draftFromForm(form) }),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Progress could not be saved.");
        setSaveState("saved");
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setSaveState("error");
      }
    }, 850);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [form.ownerName, form.clinicType, form.locationName, form.city, form.state, form.timezone, form.teamSize, form.primaryGoal, form.currentSystems, form.migrationExpectation, form.communicationsState, token]);

  function submit() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/onboarding/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, token }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Clinic activation could not be completed.");
        window.location.assign(payload.redirectTo || "/dashboard");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Clinic activation could not be completed.");
      }
    });
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Organization</p><p className="mt-2 text-sm font-black text-slate-900">{organizationName}</p></div>
        <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Paid plan</p><p className="mt-2 text-sm font-black text-slate-900">{productLabel}</p></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-6 text-slate-500">Owner account: <strong className="text-slate-800">{email}</strong>. Organization, email, role, plan, and payment state come from the signed activation link and cannot be changed by this form.</p>
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.12em] ${saveState === "error" ? "text-rose-700" : "text-slate-400"}`}>{saveState === "saving" ? <LoaderCircle className="size-3 animate-spin" /> : saveState === "saved" ? <Check className="size-3 text-emerald-600" /> : null}{saveState === "saving" ? "Saving progress" : saveState === "saved" ? "Progress saved" : saveState === "error" ? "Save retry needed" : "Progress autosaves"}</span>
      </div>

      {error && <div className="border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800" role="alert">{error}</div>}
      {saveState === "error" && <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">Your current page is still usable, but Klinikos could not persist the latest non-secret setup changes. Keep this page open or retry a field change before refreshing.</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">Your name<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" value={form.ownerName} onChange={(event) => update("ownerName", event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600">Create password<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} /><span className="mt-1 block text-[10px] font-medium text-slate-400">For security, your password is never included in autosaved onboarding progress.</span></label>
        <label className="text-xs font-bold text-slate-600">Clinic type<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" value={form.clinicType} onChange={(event) => update("clinicType", event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600">Primary location name<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" value={form.locationName} onChange={(event) => update("locationName", event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600">City<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#174ea6]" value={form.city} onChange={(event) => update("city", event.target.value)} /></label>
        <label className="text-xs font-bold text-slate-600">State<input className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm uppercase outline-none focus:border-[#174ea6]" maxLength={2} value={form.state} onChange={(event) => update("state", event.target.value.toUpperCase())} /></label>
        <label className="text-xs font-bold text-slate-600">Timezone<select className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#174ea6]" value={form.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option><option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option></select></label>
        <label className="text-xs font-bold text-slate-600">Team size<select className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#174ea6]" value={form.teamSize} onChange={(event) => update("teamSize", event.target.value)}><option>1-5</option><option>6-15</option><option>16-30</option><option>31-75</option><option>75+</option></select></label>
      </div>

      <label className="block text-xs font-bold text-slate-600">What should Klinikos help you control first?<textarea className="mt-2 min-h-24 w-full border border-slate-300 p-3 text-sm outline-none focus:border-[#174ea6]" value={form.primaryGoal} onChange={(event) => update("primaryGoal", event.target.value)} /></label>
      <label className="block text-xs font-bold text-slate-600">Systems you currently use<textarea className="mt-2 min-h-20 w-full border border-slate-300 p-3 text-sm outline-none focus:border-[#174ea6]" placeholder="EHR, scheduling, billing, phone, messaging, spreadsheets, etc." value={form.currentSystems} onChange={(event) => update("currentSystems", event.target.value)} /></label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">Migration expectation<select className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#174ea6]" value={form.migrationExpectation} onChange={(event) => update("migrationExpectation", event.target.value as FormState["migrationExpectation"])}><option value="needs_review">Review with Klinikos first</option><option value="not_now">No migration now</option><option value="manual_import">Manual import</option><option value="assisted_import">Assisted import</option></select></label>
        <label className="text-xs font-bold text-slate-600">Communications today<select className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#174ea6]" value={form.communicationsState} onChange={(event) => update("communicationsState", event.target.value as FormState["communicationsState"])}><option value="needs_review">Needs review</option><option value="existing_vendor">Existing vendor</option><option value="manual_fallback">Manual workflow</option><option value="not_connected">Not connected</option></select></label>
      </div>

      <div className="border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>Paid software access does not itself approve production patient-data use or turn pending external integrations into live connections. Until the organization completes production review, use synthetic/non-PHI data and the displayed manual fallbacks.</p></div></div>
      <label className="flex items-start gap-3 text-xs leading-6 text-slate-600"><input className="mt-1" type="checkbox" checked={form.acceptTerms} onChange={(event) => update("acceptTerms", event.target.checked)} /><span>I confirm I am authorized to activate this clinic workspace and I will not enter PHI until Klinikos marks the deployment approved for production patient-data use.</span></label>
      <button className="inline-flex min-h-12 items-center gap-2 bg-[#174ea6] px-6 text-xs font-black text-white disabled:opacity-50" disabled={pending || !form.acceptTerms || !form.ownerName.trim() || !form.password || !form.city.trim()} onClick={submit}>{pending && <LoaderCircle className="size-4 animate-spin" />} Activate my Klinikos workspace</button>
    </div>
  );
}
