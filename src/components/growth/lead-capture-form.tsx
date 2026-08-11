"use client";

import { useState, useTransition } from "react";
import { commandSurfaces } from "@/lib/design/command-system";
import {
  clinicTypeLabels,
  clinicTypes,
  LEAD_CAPTURE_NO_PHI_NOTICE,
  scaleBandLabels,
  scaleBands,
} from "@/lib/growth/lead-rules";

/**
 * Public lead capture.
 *
 * Asks about a business and nothing else. There is no free-text box anywhere in this
 * form, which is deliberate: a public marketing page must not solicit protected health
 * information, and an open notes field is how it arrives regardless of intent.
 *
 * Phone is optional. Requiring it costs more enquiries than it produces calls.
 */

type Field = "contactName" | "clinicName" | "email" | "phone" | "website";

export function LeadCaptureForm({
  interest = "overview",
  referralCode,
  submitLabel = "Send me the Klinikos overview",
}: {
  interest?: "overview" | "pricing" | "operational_audit" | "demo" | "grid" | "other";
  referralCode?: string;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<Field, string>>({
    contactName: "", clinicName: "", email: "", phone: "", website: "",
  });
  const [clinicType, setClinicType] = useState<(typeof clinicTypes)[number]>("medical_spa");
  const [locationCount, setLocationCount] = useState<(typeof scaleBands)[number]>("1");
  const [providerCount, setProviderCount] = useState<(typeof scaleBands)[number]>("2_5");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string[]>>>({});
  const [outcome, setOutcome] = useState<{ tone: "idle" | "ok" | "error"; message: string }>({ tone: "idle", message: "" });
  const [pending, startTransition] = useTransition();

  function set(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setFieldErrors({});
    setOutcome({ tone: "idle", message: "" });

    startTransition(async () => {
      const response = await fetch("/api/growth/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: values.contactName.trim(),
          clinicName: values.clinicName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          website: values.website.trim() || undefined,
          clinicType, locationCount, providerCount, interest,
          referralCode,
        }),
      }).catch(() => null);

      if (!response) {
        setOutcome({ tone: "error", message: "We could not reach Klinikos. Try again shortly." });
        return;
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setFieldErrors(payload?.fields ?? {});
        setOutcome({ tone: "error", message: payload?.error ?? "That request could not be sent." });
        return;
      }

      setOutcome({ tone: "ok", message: payload?.data?.message ?? "Received." });
    });
  }

  if (outcome.tone === "ok") {
    return (
      <div className={`${commandSurfaces.panelReview} p-6`}>
        <p className="text-sm font-extrabold text-[#f0dda0]">{outcome.message}</p>
        <p className="mt-2 text-[12px] leading-6 text-slate-300">
          A person reviews every request. If Klinikos is a fit for how your clinic runs, you will hear from us directly.
        </p>
      </div>
    );
  }

  return (
    <form className={`${commandSurfaces.panel} grid gap-4 p-6`} noValidate onSubmit={submit}>
      <Text errors={fieldErrors.contactName} label="Your name" onChange={(value) => set("contactName", value)} value={values.contactName} />
      <Text errors={fieldErrors.clinicName} label="Clinic name" onChange={(value) => set("clinicName", value)} value={values.clinicName} />
      <Text errors={fieldErrors.email} label="Work email" onChange={(value) => set("email", value)} type="email" value={values.email} />
      <Text errors={fieldErrors.phone} hint="Optional" label="Phone" onChange={(value) => set("phone", value)} value={values.phone} />
      <Text errors={fieldErrors.website} hint="Optional" label="Website" onChange={(value) => set("website", value)} value={values.website} />

      <Select label="Clinic type" onChange={(value) => setClinicType(value as (typeof clinicTypes)[number])} value={clinicType}
        options={clinicTypes.map((type) => ({ value: type, label: clinicTypeLabels[type] }))} />
      <Select label="Locations" onChange={(value) => setLocationCount(value as (typeof scaleBands)[number])} value={locationCount}
        options={scaleBands.map((band) => ({ value: band, label: scaleBandLabels[band] }))} />
      <Select label="Providers" onChange={(value) => setProviderCount(value as (typeof scaleBands)[number])} value={providerCount}
        options={scaleBands.map((band) => ({ value: band, label: scaleBandLabels[band] }))} />

      <p className="text-[11px] leading-5 text-slate-500">{LEAD_CAPTURE_NO_PHI_NOTICE}</p>

      <button
        className={`${commandSurfaces.interactive} border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0] disabled:opacity-50`}
        disabled={pending}
        type="submit"
      >
        {pending ? "Sending…" : submitLabel}
      </button>

      <p aria-live="polite" className={`text-[12px] leading-5 ${outcome.tone === "error" ? "text-rose-300" : "text-slate-400"}`} role="status">
        {outcome.message}
      </p>
    </form>
  );
}

function Text({ label, value, onChange, type = "text", hint, errors }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; hint?: string; errors?: string[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-500">
        {label}{hint && <span className="ml-2 font-semibold normal-case tracking-normal text-slate-600">{hint}</span>}
      </span>
      <input
        className="min-h-[44px] border border-white/10 bg-[#070d15] px-3 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
        type={type}
        value={value}
      />
      {errors?.length ? <span className="text-[11px] text-rose-300">{errors[0]}</span> : null}
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-500">{label}</span>
      <select
        className="min-h-[44px] border border-white/10 bg-[#070d15] px-3 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
