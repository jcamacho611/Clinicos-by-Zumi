"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { salesPainPoints, type SalesPainPoint } from "@/lib/sales-demo-rules";

/**
 * The questions the pre-payment form stopped asking.
 *
 * They were moved here because none of them are needed to take payment, and asking them
 * first made a ready buyer do consulting homework before we would accept money. Here
 * they shape the work rather than gate it — which also means every one of them is
 * genuinely optional. Skipping is a first-class outcome, not an abandoned form.
 */

const inputClass = "mt-1.5 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#efaaa1]/40";
const labelClass = "text-[12px] font-semibold uppercase tracking-[.14em] text-white/45";

type Vendors = { ehr: string; scheduling: string; billing: string; crm: string; patientMessaging: string };

export function AnalysisActivationForm({ token, onDone }: { token: string; onDone: (nextAction: string) => void }) {
  const [providerCount, setProviderCount] = useState("");
  const [locationCount, setLocationCount] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [vendors, setVendors] = useState<Vendors>({ ehr: "", scheduling: "", billing: "", crm: "", patientMessaging: "" });
  const [painPoints, setPainPoints] = useState<SalesPainPoint[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(includeAnswers: boolean) {
    setError("");
    startTransition(async () => {
      // An empty string means "left blank", which is null — not zero, and not "".
      const trimmed = (value: string) => (value.trim() ? value.trim() : null);
      const counted = (value: string) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };
      const anyVendor = Object.values(vendors).some((value) => value.trim());
      const qualification = includeAnswers
        ? {
            contactRole: trimmed(contactRole),
            contactPhone: trimmed(contactPhone),
            providerCount: counted(providerCount),
            locationCount: counted(locationCount),
            currentSystems: anyVendor ? vendors : null,
            painPoints: painPoints.length ? painPoints : null,
            estimatedSoftwareSpendDollars: null,
          }
        : {};

      const response = await fetch("/api/sales/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, qualification }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "That did not save. Nothing was lost — you can try again.");
        return;
      }
      onDone(payload?.data?.nextAction ?? "");
    });
  }

  return (
    <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[.02] p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-[-.03em]">Tell us about the clinic</h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/50">
        None of this is required. It shapes what we look at first, and anything you skip we will ask about
        when we walk through the analysis with you.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Providers</span><input className={inputClass} inputMode="numeric" onChange={(event) => setProviderCount(event.target.value)} placeholder="How many?" value={providerCount} /></label>
        <label><span className={labelClass}>Locations</span><input className={inputClass} inputMode="numeric" onChange={(event) => setLocationCount(event.target.value)} placeholder="How many?" value={locationCount} /></label>
        <label><span className={labelClass}>Your role</span><input className={inputClass} onChange={(event) => setContactRole(event.target.value)} placeholder="Owner, practice manager…" value={contactRole} /></label>
        <label><span className={labelClass}>Phone</span><input className={inputClass} onChange={(event) => setContactPhone(event.target.value)} placeholder="For the review call" type="tel" value={contactPhone} /></label>
      </div>

      <p className="mt-7 text-[12px] font-semibold uppercase tracking-[.14em] text-white/45">What you use today</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {([["ehr", "EHR"], ["scheduling", "Scheduling"], ["billing", "Billing"], ["crm", "Follow-up / CRM"], ["patientMessaging", "Patient messaging"]] as const).map(([key, label]) => (
          <label key={key}>
            <span className={labelClass}>{label}</span>
            <input className={inputClass} onChange={(event) => setVendors((current) => ({ ...current, [key]: event.target.value }))} placeholder="None, or the vendor" value={vendors[key]} />
          </label>
        ))}
      </div>

      <p className="mt-7 text-[12px] font-semibold uppercase tracking-[.14em] text-white/45">Anything else getting stuck</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {salesPainPoints.map(([key, label]) => {
          const active = painPoints.includes(key);
          return (
            <button
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-2 text-[12px] font-semibold transition ${active ? "border-[#efaaa1]/40 bg-[#efaaa1]/10 text-[#ffd9d5]" : "border-white/10 bg-white/[.03] text-white/50 hover:border-white/25 hover:text-white"}`}
              key={key}
              onClick={() => setPainPoints((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}
              type="button"
            >
              {active && <Check aria-hidden="true" className="mr-1.5 inline size-3" />}{label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-5 text-[13px] text-[#ffb4ad]" role="alert">{error}</p>}

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b66d69] px-5 text-xs font-bold text-[#170708] transition hover:bg-[#ca807a] disabled:opacity-50"
          disabled={pending}
          onClick={() => submit(true)}
          type="button"
        >
          {pending ? "Saving…" : "Save and continue"} <ArrowRight aria-hidden="true" className="size-4" />
        </button>
        <button
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-5 text-xs font-semibold text-white/60 transition hover:bg-white/[.04] disabled:opacity-50"
          disabled={pending}
          onClick={() => submit(false)}
          type="button"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
