"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, LoaderCircle, MapPin, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#174ea6] focus:ring-4 focus:ring-blue-50";
const label = "space-y-1.5 text-xs font-bold text-slate-600";

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function dollarsToCents(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

type SignupResult = {
  organizationSlug: string;
  resourceId: string;
  resourceStatus: string;
  reviewStatus: string;
};

export function CapacityIntakeForm() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [type, setType] = useState("Treatment room");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NY");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [uses, setUses] = useState("");
  const [pricingModel, setPricingModel] = useState("hourly");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignupResult | null>(null);

  const steps = [
    { title: "Create your Grid account", icon: UserRound },
    { title: "Where is the capacity?", icon: MapPin },
    { title: "When can Grid use it?", icon: CheckCircle2 },
    { title: "What can it be used for?", icon: ShieldCheck },
    { title: "What do you want for it?", icon: WalletCards },
  ] as const;

  if (result) {
    return <div className="border border-emerald-200 bg-white p-7 shadow-[0_24px_70px_rgba(5,150,105,.08)]">
      <CheckCircle2 className="size-8 text-emerald-600" />
      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-700">Account created</p>
      <h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">Your space is really in Grid now.</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">Your account is active and the first capacity record has been persisted. The listing is in human review and is not public or bookable until that review succeeds.</p>
      <div className="mt-5 border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
        <strong>Resource:</strong> {result.resourceId}<br />
        <strong>State:</strong> {result.resourceStatus.replaceAll("_", " ")} / {result.reviewStatus.replaceAll("_", " ")}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/login">Sign in to manage Grid <ArrowRight className="size-4" /></Link></Button>
        <Button asChild variant="secondary"><Link href="/grid/browse">Browse Grid</Link></Button>
      </div>
    </div>;
  }

  function stepReady() {
    if (step === 0) return fullName.trim().length >= 2 && organizationName.trim().length >= 2 && email.includes("@") && password.length >= 12 && name.trim().length >= 3;
    if (step === 1) return city.trim().length >= 2 && state.trim().length === 2;
    if (step === 2) return Boolean(startsAt && endsAt && new Date(endsAt) > new Date(startsAt) && Number(capacity) >= 1);
    if (step === 3) return uses.trim().length >= 12;
    if (step === 4) return pricingModel === "quote" || dollarsToCents(rate) !== null;
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
      const priceCents = pricingModel === "quote" ? null : dollarsToCents(rate);
      const response = await fetch("/api/grid/enroll/participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantKind: "space_owner",
          fullName,
          email,
          password,
          organizationName,
          resource: {
            resourceType: "space",
            policyClass: "healthcare_space",
            subtype: type.toLowerCase().replaceAll(" ", "_"),
            title: name,
            description: `${type} capacity in ${city}, ${state}. ${uses}`,
            visibility: "public",
            city,
            state,
            timezone: "America/New_York",
            pricingModel,
            priceCents,
            capacity: numericCapacity,
            credentialRequirements: [],
            insuranceRequirements: [],
            operatorRequirements: [],
            usageRestrictions: [],
            availability: [{ startsAt: toIso(startsAt), endsAt: toIso(endsAt), capacity: numericCapacity }],
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
    <div className="flex flex-wrap gap-2">{steps.map((item, index) => <button key={item.title} className={`rounded-full border px-3 py-2 text-[11px] font-extrabold ${index === step ? "border-[#174ea6] bg-[#174ea6] text-white" : index < step ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"}`} onClick={() => index <= step && setStep(index)} type="button">{index + 1}</button>)}</div>
    <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Step {step + 1} of 5</p>
    <h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">{steps[step].title}</h3>

    {step === 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className={label}>Your name<Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
      <label className={label}>Email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className={label}>Business / owner name<Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Example: Queens Treatment Suites" /></label>
      <label className={label}>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /><span className="block text-[10px] font-normal leading-5 text-slate-400">12+ characters with uppercase, lowercase, number, and symbol.</span></label>
      <label className={label}>Capacity type<select className={field} value={type} onChange={(event) => setType(event.target.value)}><option>Treatment room</option><option>Chair</option><option>Exam room</option><option>Procedure room</option><option>Office</option><option>Training room</option><option>Lab capacity</option><option>Imaging capacity</option><option>Other healthcare capacity</option></select></label>
      <label className={label}>Listing name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Saturday treatment room" /></label>
    </div>}

    {step === 1 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className={label}>City<Input value={city} onChange={(event) => setCity(event.target.value)} /></label><label className={label}>State<Input value={state} maxLength={2} onChange={(event) => setState(event.target.value.toUpperCase())} /></label></div>}

    {step === 2 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className={label}>Available from<Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label className={label}>Available until<Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label><label className={label}>Simultaneous capacity<Input min={1} type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label></div>}

    {step === 3 && <label className={`${label} mt-6 block`}>Permitted uses<textarea className={`${field} min-h-28 py-3`} value={uses} onChange={(event) => setUses(event.target.value)} placeholder="Example: consultations, wellness services, procedures only when separately eligible and permitted..." /></label>}

    {step === 4 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className={label}>Pricing<select className={field} value={pricingModel} onChange={(event) => setPricingModel(event.target.value)}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="fixed">Fixed</option><option value="quote">Request quote</option></select></label><label className={label}>Price · USD<Input disabled={pricingModel === "quote"} inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} placeholder={pricingModel === "quote" ? "Set after request" : "75"} /></label></div>}

    {error && <p className="mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800">{error}</p>}
    <div className="mt-8 flex justify-between gap-3"><Button disabled={step === 0 || busy} onClick={() => setStep((current) => Math.max(0, current - 1))} variant="secondary">Back</Button><Button disabled={busy || !stepReady()} onClick={next}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{step === 4 ? "Create account & submit" : "Continue"}<ArrowRight className="size-4" /></Button></div>
  </div>;
}
