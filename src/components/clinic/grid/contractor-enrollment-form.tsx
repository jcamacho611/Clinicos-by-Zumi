"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  gridContractorProviderTypes,
  gridExperienceLevels,
  gridLocationTypes,
} from "@/lib/grid-rules";

type Availability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationType: (typeof gridLocationTypes)[number];
};

type ExistingGridAccount = {
  email: string;
  name: string | null;
};

type EnrollmentSuccess = {
  providerId: string;
  status: string;
  accountReused?: boolean;
};

const defaultAvailability: Availability = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "17:00",
  locationType: "clinic_location",
};
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fieldClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50";
const labelClass = "space-y-1.5 text-[12px] font-extrabold uppercase tracking-[.12em] text-slate-500";

function isoDate(value: string) {
  return value ? `${value}T00:00:00.000Z` : "";
}

function values(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function ContractorEnrollmentForm({ account = null }: { account?: ExistingGridAccount | null }) {
  const accountReused = Boolean(account);
  const [step, setStep] = useState(1);
  const [organizationSlug, setOrganizationSlug] = useState("luxe-medi");
  const [fullName, setFullName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [providerType, setProviderType] = useState("");
  const [credential, setCredential] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<(typeof gridExperienceLevels)[number]>("Intermediate");
  const [bio, setBio] = useState("");
  const [services, setServices] = useState("");
  const [certifications, setCertifications] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [travelRadiusMiles, setTravelRadiusMiles] = useState(20);
  const [mobile, setMobile] = useState(false);
  const [chair, setChair] = useState(false);
  const [partnerLocation, setPartnerLocation] = useState(false);
  const [atHome, setAtHome] = useState(false);
  const [onCallNow, setOnCallNow] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("NY");
  const [licenseExpiration, setLicenseExpiration] = useState("");
  const [licenseEvidenceReference, setLicenseEvidenceReference] = useState("");
  const [malpracticeCarrier, setMalpracticeCarrier] = useState("");
  const [malpracticePolicyNumber, setMalpracticePolicyNumber] = useState("");
  const [malpracticeExpiration, setMalpracticeExpiration] = useState("");
  const [malpracticeCoverage, setMalpracticeCoverage] = useState(1_000_000);
  const [malpracticeEvidenceReference, setMalpracticeEvidenceReference] = useState("");
  const [availability, setAvailability] = useState<Availability[]>([defaultAvailability]);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EnrollmentSuccess | null>(null);

  function updateSlot(index: number, patch: Partial<Availability>) {
    setAvailability((current) => current.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot));
  }

  const profileReady = fullName.trim().length >= 2
    && email.trim().length >= 5
    && phone.trim().length >= 7
    && (accountReused || password.length >= 12)
    && providerType.trim().length >= 2
    && credential.trim().length >= 2
    && specialty.trim().length >= 2
    && values(services).length > 0
    && bio.trim().length >= 20;

  const credentialsReady = licenseNumber.trim().length >= 2
    && licenseState.trim().length >= 2
    && Boolean(licenseExpiration)
    && licenseEvidenceReference.trim().length >= 2
    && malpracticeCarrier.trim().length >= 2
    && malpracticePolicyNumber.trim().length >= 2
    && Boolean(malpracticeExpiration)
    && malpracticeCoverage > 0
    && malpracticeEvidenceReference.trim().length >= 2;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/grid/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          fullName,
          email,
          phone,
          password: accountReused ? undefined : password,
          providerType,
          credential,
          specialty,
          licenseType: "STATE_LICENSE",
          licenseNumber,
          licenseState,
          licenseExpiration: isoDate(licenseExpiration),
          licenseEvidenceReference,
          malpracticeCarrier,
          malpracticePolicyNumber,
          malpracticeExpiration: isoDate(malpracticeExpiration),
          malpracticeCoverageAmountCents: Math.round(malpracticeCoverage * 100),
          malpracticeEvidenceReference,
          certifications: values(certifications),
          servicesOffered: values(services),
          experienceLevel,
          bio,
          serviceArea,
          travelRadiusMiles,
          mobileServiceAllowed: mobile,
          chairRentalAllowed: chair,
          partnerLocationAllowed: partnerLocation,
          atHomeAllowed: atHome,
          onCallNow,
          availability,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? payload.details?.[0]?.message ?? "Grid enrollment could not be submitted.");
      }
      setSuccess(payload.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Grid enrollment could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    const reused = success.accountReused ?? accountReused;
    return (
      <section className="rounded-[28px] border border-teal-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,118,110,.12)]">
        <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><BadgeCheck className="size-6" /></span>
        <p className="mt-6 text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Application submitted</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950">Human review is next.</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {reused
            ? "Your existing Klinikos account, organization, role, password, and current session stay unchanged while this separate Grid relationship is reviewed."
            : "Your new Grid account remains locked until the applicable identity, license, credential, and malpractice evidence has been reviewed."}
        </p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
          <strong>Application reference:</strong> {success.providerId}<br />
          <strong>Status:</strong> {success.status.replaceAll("_", " ")}
        </div>
        <Button asChild className="mt-6" variant="secondary">
          <Link href={reused ? "/grid" : "/login"}>{reused ? "Return to Grid" : "Go to sign in"} <ArrowRight className="size-4" /></Link>
        </Button>
      </section>
    );
  }

  const progress = ["Profile", "Credentials", "Availability"];

  return (
    <div className="space-y-5">
      {account && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-xs leading-6 text-teal-950">
          <p className="font-extrabold">Signed-in account will be reused</p>
          <p className="mt-1">{account.email}. Applying adds a pending Grid relationship only. It does not switch your current organization or role.</p>
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          {progress.map((label, index) => {
            const n = index + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div className="flex flex-1 items-center gap-2" key={label}>
                <span className={`grid size-7 place-items-center rounded-full text-[12px] font-black ${active ? "bg-teal-700 text-white" : done ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"}`}>{n}</span>
                <span className={`hidden text-[12px] font-extrabold uppercase tracking-[.12em] sm:inline ${active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
                {index < progress.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.07)] sm:p-7">
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Start with the basics</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.045em] text-slate-950">Who are you and what kind of work do you want?</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">Describe the professional role you actually hold. Grid accepts future healthcare professions into review without treating this application as eligibility for any opportunity.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Full legal name<Input readOnly={accountReused} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
            <label className={labelClass}>Email<Input readOnly={accountReused} type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className={labelClass}>Phone<Input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label className={labelClass}>Network / organization code<Input value={organizationSlug} onChange={(event) => setOrganizationSlug(event.target.value)} /><span className="block normal-case tracking-normal text-slate-400">The current pilot uses approved network codes for credential review.</span></label>
            <label className={labelClass}>Professional role<Input list="grid-professional-role-suggestions" placeholder="Example: Physical Therapist" value={providerType} onChange={(event) => setProviderType(event.target.value)} /><datalist id="grid-professional-role-suggestions">{gridContractorProviderTypes.map((type) => <option key={type} value={type} />)}</datalist></label>
            <label className={labelClass}>Primary credential<Input placeholder="Example: PT, RN, MD, RPh" value={credential} onChange={(event) => setCredential(event.target.value)} /></label>
            <label className={labelClass}>Specialty or focus<Input placeholder="Example: Orthopedic rehabilitation" value={specialty} onChange={(event) => setSpecialty(event.target.value)} /></label>
            <label className={labelClass}>Experience<select className={fieldClass} value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as typeof experienceLevel)}>{gridExperienceLevels.map((level) => <option key={level}>{level}</option>)}</select></label>
            <label className={`${labelClass} sm:col-span-2`}>Services you want to offer<Input placeholder="Separate services with commas" value={services} onChange={(event) => setServices(event.target.value)} /></label>
            <label className={`${labelClass} sm:col-span-2`}>Professional summary<textarea className={`${fieldClass} min-h-24 py-3 normal-case tracking-normal`} placeholder="Describe your experience, preferred opportunities, and the settings where you can work." value={bio} onChange={(event) => setBio(event.target.value)} /></label>
            {!accountReused && <label className={`${labelClass} sm:col-span-2`}>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /><span className="block normal-case tracking-normal text-slate-400">12+ characters with uppercase, lowercase, number, and symbol.</span></label>}
          </div>
          <Button className="mt-6 w-full" disabled={!profileReady} variant="primary" onClick={() => setStep(2)}>Continue to credentials <ArrowRight className="size-4" /></Button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.07)] sm:p-7">
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Credentials & coverage</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.045em] text-slate-950">Add the evidence required for regulated work.</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">Grid records what you provide, but a human reviewer and the rules for each opportunity determine whether it is sufficient.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>License number<Input value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} /></label>
            <label className={labelClass}>License state<Input maxLength={2} value={licenseState} onChange={(event) => setLicenseState(event.target.value.toUpperCase())} /></label>
            <label className={labelClass}>License expiration<Input type="date" value={licenseExpiration} onChange={(event) => setLicenseExpiration(event.target.value)} /></label>
            <label className={labelClass}>License evidence reference<Input placeholder="File or primary-source review reference" value={licenseEvidenceReference} onChange={(event) => setLicenseEvidenceReference(event.target.value)} /></label>
            <label className={labelClass}>Malpractice carrier<Input value={malpracticeCarrier} onChange={(event) => setMalpracticeCarrier(event.target.value)} /></label>
            <label className={labelClass}>Policy number<Input value={malpracticePolicyNumber} onChange={(event) => setMalpracticePolicyNumber(event.target.value)} /></label>
            <label className={labelClass}>Policy expiration<Input type="date" value={malpracticeExpiration} onChange={(event) => setMalpracticeExpiration(event.target.value)} /></label>
            <label className={labelClass}>Coverage amount · USD<Input min={1} type="number" value={malpracticeCoverage} onChange={(event) => setMalpracticeCoverage(Number(event.target.value))} /></label>
            <label className={`${labelClass} sm:col-span-2`}>Malpractice evidence reference<Input placeholder="Policy file or review reference" value={malpracticeEvidenceReference} onChange={(event) => setMalpracticeEvidenceReference(event.target.value)} /></label>
            <label className={`${labelClass} sm:col-span-2`}>Certifications<Input placeholder="Separate certifications with commas" value={certifications} onChange={(event) => setCertifications(event.target.value)} /></label>
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-[12px] leading-5 text-amber-900"><ShieldCheck className="mr-1.5 inline size-3.5" />Uploading or referencing evidence does not verify it. Review state remains explicit.</p>
          <div className="mt-6 flex gap-3"><Button className="flex-1" variant="secondary" onClick={() => setStep(1)}><ArrowLeft className="size-4" />Back</Button><Button className="flex-1" disabled={!credentialsReady} variant="primary" onClick={() => setStep(3)}>Set availability <ArrowRight className="size-4" /></Button></div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.07)] sm:p-7">
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Availability & preferences</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.045em] text-slate-950">Tell Grid when and where you want opportunities.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Service area<Input placeholder="City, region, or remote" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} /></label><label className={labelClass}>Travel radius · miles<Input min={0} type="number" value={travelRadiusMiles} onChange={(event) => setTravelRadiusMiles(Number(event.target.value))} /></label></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[["Mobile", mobile, setMobile], ["Chair / room rental", chair, setChair], ["Clinic / partner location", partnerLocation, setPartnerLocation], ["At-home", atHome, setAtHome], ["Available now", onCallNow, setOnCallNow]].map(([label, checked, setter]) => (
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700" key={String(label)}><input type="checkbox" checked={Boolean(checked)} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} />{String(label)}</label>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {availability.map((slot, index) => (
              <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1fr_.7fr_.7fr_1.2fr_auto]" key={`${slot.dayOfWeek}-${index}`}>
                <select aria-label="Availability day" className={fieldClass} value={slot.dayOfWeek} onChange={(event) => updateSlot(index, { dayOfWeek: Number(event.target.value) })}>{weekdays.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}</select>
                <Input aria-label="Availability start" type="time" value={slot.startTime} onChange={(event) => updateSlot(index, { startTime: event.target.value })} />
                <Input aria-label="Availability end" type="time" value={slot.endTime} onChange={(event) => updateSlot(index, { endTime: event.target.value })} />
                <select aria-label="Availability work setting" className={fieldClass} value={slot.locationType} onChange={(event) => updateSlot(index, { locationType: event.target.value as Availability["locationType"] })}>{gridLocationTypes.filter((type) => type !== "virtual").map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
                <Button aria-label="Remove availability" disabled={availability.length === 1} size="icon" variant="ghost" onClick={() => setAvailability((current) => current.filter((_, slotIndex) => slotIndex !== index))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => setAvailability((current) => [...current, defaultAvailability])}><Plus className="size-3.5" />Add availability</Button>
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600"><input className="mt-1" type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I am applying as an independent contractor, understand approval and work are not guaranteed, and will use synthetic demonstration information only in this environment.</span></label>
          {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700" role="alert">{error}</p>}
          <div className="mt-6 flex gap-3"><Button className="flex-1" variant="secondary" onClick={() => setStep(2)}><ArrowLeft className="size-4" />Back</Button><Button className="flex-1" disabled={busy || !accepted || serviceArea.trim().length < 2 || !(mobile || chair || partnerLocation || atHome)} variant="primary" onClick={submit}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}Submit for review</Button></div>
        </section>
      )}
    </div>
  );
}
