"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const laneConfig = {
  product: {
    label: "product or supply",
    examples: "gloves, approved consumables, operational supplies",
    fulfillment: "pickup, local delivery, shipping, request quote",
    participantKind: "seller",
    resourceType: "product",
    policyClass: "general_supply",
    needsAvailability: false,
  },
  equipment: {
    label: "equipment or equipment capacity",
    examples: "ultrasound time, treatment device, diagnostic equipment",
    fulfillment: "onsite use, rental, staffed use, request quote",
    participantKind: "equipment_owner",
    resourceType: "equipment",
    policyClass: "equipment_capacity",
    needsAvailability: true,
  },
  service: {
    label: "professional service",
    examples: "billing, credentialing, cybersecurity, consulting",
    fulfillment: "remote, onsite, project, retainer",
    participantKind: "service_provider",
    resourceType: "service",
    policyClass: "business_service",
    needsAvailability: false,
  },
  education: {
    label: "education capacity",
    examples: "preceptor seat, clinical placement, training session",
    fulfillment: "scheduled cohort, placement, recurring hours",
    participantKind: "education_partner",
    resourceType: "education",
    policyClass: "education_capacity",
    needsAvailability: true,
  },
  referral: {
    label: "referral or partner capacity",
    examples: "specialist consult, imaging capacity, diagnostic availability",
    fulfillment: "governed referral, consultation, partner handoff",
    participantKind: "referral_partner",
    resourceType: "referral",
    policyClass: "referral_capacity",
    needsAvailability: true,
  },
} as const;

type Lane = keyof typeof laneConfig;

type SignupResult = {
  resourceId: string;
  resourceStatus: string;
  reviewStatus: string;
};

function dollarsToCents(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function SellerIntakeForm({ lane }: { lane: Lane }) {
  const config = laneConfig[lane];
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [title, setTitle] = useState("");
  const [access, setAccess] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NY");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [pricingModel, setPricingModel] = useState("quote");
  const [price, setPrice] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [result, setResult] = useState<SignupResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => [
    `Who are you and what ${config.label} are you offering?`,
    "Who can access it and where is it?",
    config.needsAvailability ? "When is it available?" : "How much capacity is available?",
    "What does it cost?",
    "How is it fulfilled?",
  ], [config.label, config.needsAvailability]);

  if (result) {
    return <div className="border border-emerald-200 bg-white p-7 shadow-[0_24px_70px_rgba(5,150,105,.08)]">
      <CheckCircle2 className="size-8 text-emerald-600" />
      <p className="mt-5 text-[12px] font-extrabold uppercase tracking-[.18em] text-emerald-700">Grid account created</p>
      <h3 className="mt-2 text-2xl font-black tracking-[-.04em]">Your first listing is persisted.</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">The listing is now in Klinikos Grid review. It is not public or transactional until the applicable policy review succeeds. You can sign in immediately to manage your Grid account.</p>
      <div className="mt-5 border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600"><strong>Resource:</strong> {result.resourceId}<br /><strong>State:</strong> {result.resourceStatus.replaceAll("_", " ")} / {result.reviewStatus.replaceAll("_", " ")}</div>
      <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href="/login">Sign in to Grid <ArrowRight className="size-4" /></Link></Button><Button asChild variant="secondary"><Link href="/grid/browse">Browse Grid</Link></Button></div>
    </div>;
  }

  function stepReady() {
    if (step === 0) return fullName.trim().length >= 2 && organizationName.trim().length >= 2 && email.includes("@") && password.length >= 12 && title.trim().length >= 3;
    if (step === 1) return access.trim().length >= 3 && city.trim().length >= 2 && state.trim().length === 2;
    if (step === 2) {
      if (!Number.isFinite(Number(capacity)) || Number(capacity) < 1) return false;
      if (!config.needsAvailability) return true;
      return Boolean(startsAt && endsAt && new Date(endsAt) > new Date(startsAt));
    }
    if (step === 3) return pricingModel === "quote" || dollarsToCents(price) !== null;
    if (step === 4) return fulfillment.trim().length >= 5;
    return false;
  }

  async function next() {
    setError(null);
    if (!stepReady()) {
      setError("Complete the required information before continuing.");
      return;
    }
    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    setBusy(true);
    try {
      const numericCapacity = Math.max(1, Math.round(Number(capacity)));
      const response = await fetch("/api/grid/enroll/participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantKind: config.participantKind,
          fullName,
          email,
          password,
          organizationName,
          resource: {
            resourceType: config.resourceType,
            policyClass: config.policyClass,
            subtype: lane,
            title,
            description: `${access}. Fulfillment: ${fulfillment}.`,
            visibility: lane === "referral" ? "matched_only" : "public",
            city,
            state,
            timezone: "America/New_York",
            pricingModel,
            priceCents: pricingModel === "quote" ? null : dollarsToCents(price),
            capacity: numericCapacity,
            credentialRequirements: [],
            insuranceRequirements: [],
            operatorRequirements: [],
            usageRestrictions: [],
            availability: config.needsAvailability ? [{ startsAt: toIso(startsAt), endsAt: toIso(endsAt), capacity: numericCapacity }] : [],
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? payload.details?.[0]?.message ?? "Grid signup could not be completed.");
      setResult(payload.data as SignupResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Grid signup could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
    <div className="flex gap-2">{questions.map((question, index) => <button type="button" key={question} onClick={() => index <= step && setStep(index)} className={`grid size-9 place-items-center rounded-full border text-xs font-black ${index === step ? "border-[#174ea6] bg-[#174ea6] text-white" : index < step ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"}`}>{index + 1}</button>)}</div>
    <p className="mt-6 text-[12px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Step {step + 1} of 5</p>
    <h3 className="mt-2 text-2xl font-black tracking-[-.04em]">{questions[step]}</h3>

    {step === 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Your name<Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label className="text-xs font-bold text-slate-600">Email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="text-xs font-bold text-slate-600">Business / organization name<Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label><label className="text-xs font-bold text-slate-600">Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /><span className="mt-1 block text-[12px] font-normal leading-5 text-slate-400">12+ characters with uppercase, lowercase, number, and symbol.</span></label><label className="text-xs font-bold text-slate-600 sm:col-span-2">What are you offering?<Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`Example: ${config.examples}`} /></label></div>}

    {step === 1 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600 sm:col-span-2">Who can buy or access it?<Input value={access} onChange={(event) => setAccess(event.target.value)} placeholder="Example: verified clinics, approved organizations, eligible professionals" /></label><label className="text-xs font-bold text-slate-600">City<Input value={city} onChange={(event) => setCity(event.target.value)} /></label><label className="text-xs font-bold text-slate-600">State<Input maxLength={2} value={state} onChange={(event) => setState(event.target.value.toUpperCase())} /></label></div>}

    {step === 2 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Capacity / quantity<Input min={1} type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label>{config.needsAvailability && <><label className="text-xs font-bold text-slate-600">Available from<Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label className="text-xs font-bold text-slate-600">Available until<Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label></>}</div>}

    {step === 3 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Pricing<select className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={pricingModel} onChange={(event) => setPricingModel(event.target.value)}><option value="quote">Request quote</option><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="per_unit">Per unit</option><option value="per_seat">Per seat</option></select></label><label className="text-xs font-bold text-slate-600">Price · USD<Input disabled={pricingModel === "quote"} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label></div>}

    {step === 4 && <label className="mt-6 block text-xs font-bold text-slate-600">How is it fulfilled?<textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-[#174ea6] focus:ring-4 focus:ring-blue-50" value={fulfillment} onChange={(event) => setFulfillment(event.target.value)} placeholder={`Example: ${config.fulfillment}`} /></label>}

    {error && <p className="mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800">{error}</p>}
    <div className="mt-8 flex justify-between gap-3"><Button disabled={step === 0 || busy} variant="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</Button><Button disabled={busy || !stepReady()} onClick={next}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{step === 4 ? "Create account & submit" : "Continue"}<ArrowRight className="size-4" /></Button></div>
  </div>;
}
