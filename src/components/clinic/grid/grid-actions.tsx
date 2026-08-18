"use client";

import { useState } from "react";
import { BadgeCheck, CalendarPlus, Check, ChevronRight, LoaderCircle, MapPinPlus, Plus, Send, ShieldCheck, Siren, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gridExperienceLevels, gridLocationTypes, gridProviderTypes } from "@/lib/grid-rules";
import type { GridWorkspace } from "@/lib/repositories/grid-repository";

const fieldClass = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/55 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10";
const textAreaClass = "min-h-24 w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-5 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/55 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-400/10";
const labelClass = "space-y-1.5 text-[12px] font-extrabold uppercase tracking-[.14em] text-white/45";
const panelClass = "group rounded-[1.4rem] border border-white/10 bg-white/[0.035] open:bg-white/[0.05]";
const summaryClass = "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-extrabold text-white [&::-webkit-details-marker]:hidden";

function list(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isoDate(value: string) {
  return value ? `${value}T00:00:00.000Z` : null;
}

function isoLocalDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function useGridMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function mutate(url: string, body: unknown, successMessage: string, method = "POST") {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Grid action could not be completed.");
      setSuccess(successMessage);
      window.setTimeout(() => window.location.reload(), 450);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Grid action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, success, mutate };
}

function Feedback({ busy, error, success }: { busy: boolean; error: string | null; success: string | null }) {
  return <div aria-live="polite" className="min-h-5 pt-2">{busy && <p className="flex items-center gap-2 text-[12px] font-bold text-cyan-200"><LoaderCircle className="size-3 animate-spin" /> Recording governed Grid action...</p>}{error && <p className="text-[12px] font-bold text-rose-300" role="alert">{error}</p>}{success && <p className="text-[12px] font-bold text-emerald-300">{success}</p>}</div>;
}

function CheckField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[12px] font-bold text-white/65"><input checked={checked} className="accent-cyan-400" onChange={(event) => onChange(event.target.checked)} type="checkbox" />{label}</label>;
}

export function GridProviderCreateAction({ enabled }: { enabled: boolean }) {
  const mutation = useGridMutation();
  const [displayName, setDisplayName] = useState("Alex Morgan");
  const [legalName, setLegalName] = useState("Alexis Morgan");
  const [providerType, setProviderType] = useState<(typeof gridProviderTypes)[number]>("Nurse Injector");
  const [credential, setCredential] = useState("RN");
  const [specialty, setSpecialty] = useState("Aesthetic services");
  const [licenseType, setLicenseType] = useState("STATE_LICENSE");
  const [licenseNumber, setLicenseNumber] = useState("SYNTH-NY-RN-2048");
  const [licenseState, setLicenseState] = useState("NY");
  const [licenseExpiration, setLicenseExpiration] = useState("2028-12-31");
  const [malpracticeCarrier, setMalpracticeCarrier] = useState("Synthetic Coverage Co.");
  const [malpracticePolicyNumber, setMalpracticePolicyNumber] = useState("SYNTH-MAL-2048");
  const [malpracticeExpiration, setMalpracticeExpiration] = useState("2028-06-30");
  const [services, setServices] = useState("Botox consultation support, Injectable treatment support");
  const [certifications, setCertifications] = useState("Synthetic injector training record, BLS demonstration");
  const [serviceLocations, setServiceLocations] = useState("Brooklyn, Manhattan");
  const [experienceLevel, setExperienceLevel] = useState<(typeof gridExperienceLevels)[number]>("Intermediate");
  const [bio, setBio] = useState("Synthetic provider profile created for a controlled ClinicOS Grid demonstration. Credentials require manual human verification before activation.");
  const [travelRadius, setTravelRadius] = useState(20);
  const [mobile, setMobile] = useState(true);
  const [chair, setChair] = useState(true);
  const [atHome, setAtHome] = useState(false);

  if (!enabled) return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/50">Credentialing create permission is required to add a provider profile.</p>;
  return <details className={panelClass}><summary className={summaryClass}><span className="flex items-center gap-2"><UserRoundPlus className="size-4 text-cyan-300" /> Add synthetic provider profile</span><Plus className="size-4 text-white/40" /></summary><div className="space-y-4 border-t border-white/10 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Display name<input className={fieldClass} onChange={(event) => setDisplayName(event.target.value)} value={displayName} /></label><label className={labelClass}>Legal name · admin only<input className={fieldClass} onChange={(event) => setLegalName(event.target.value)} value={legalName} /></label><label className={labelClass}>Provider category<select className={fieldClass} onChange={(event) => setProviderType(event.target.value as typeof providerType)} value={providerType}>{gridProviderTypes.map((type) => <option className="bg-slate-950" key={type}>{type}</option>)}</select></label><label className={labelClass}>Professional credential<input className={fieldClass} onChange={(event) => setCredential(event.target.value)} value={credential} /></label><label className={labelClass}>Specialty<input className={fieldClass} onChange={(event) => setSpecialty(event.target.value)} value={specialty} /></label><label className={labelClass}>Experience display tier<select className={fieldClass} onChange={(event) => setExperienceLevel(event.target.value as typeof experienceLevel)} value={experienceLevel}>{gridExperienceLevels.map((level) => <option className="bg-slate-950" key={level}>{level}</option>)}</select></label></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className={labelClass}>License type<input className={fieldClass} onChange={(event) => setLicenseType(event.target.value)} value={licenseType} /></label><label className={labelClass}>License number<input className={fieldClass} onChange={(event) => setLicenseNumber(event.target.value)} value={licenseNumber} /></label><label className={labelClass}>License state<input className={fieldClass} onChange={(event) => setLicenseState(event.target.value)} value={licenseState} /></label><label className={labelClass}>License expiration<input className={fieldClass} onChange={(event) => setLicenseExpiration(event.target.value)} type="date" value={licenseExpiration} /></label></div><div className="grid gap-3 sm:grid-cols-3"><label className={labelClass}>Malpractice carrier<input className={fieldClass} onChange={(event) => setMalpracticeCarrier(event.target.value)} value={malpracticeCarrier} /></label><label className={labelClass}>Policy number · admin only<input className={fieldClass} onChange={(event) => setMalpracticePolicyNumber(event.target.value)} value={malpracticePolicyNumber} /></label><label className={labelClass}>Coverage expiration<input className={fieldClass} onChange={(event) => setMalpracticeExpiration(event.target.value)} type="date" value={malpracticeExpiration} /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Services · comma separated<input className={fieldClass} onChange={(event) => setServices(event.target.value)} value={services} /></label><label className={labelClass}>Certifications · comma separated<input className={fieldClass} onChange={(event) => setCertifications(event.target.value)} value={certifications} /></label><label className={labelClass}>Service areas · comma separated<input className={fieldClass} onChange={(event) => setServiceLocations(event.target.value)} value={serviceLocations} /></label><label className={labelClass}>Travel radius<input className={fieldClass} min={0} onChange={(event) => setTravelRadius(Number(event.target.value))} type="number" value={travelRadius} /></label></div><label className={labelClass}>Public-safe bio<textarea className={textAreaClass} onChange={(event) => setBio(event.target.value)} value={bio} /></label><div className="grid gap-2 sm:grid-cols-3"><CheckField checked={mobile} label="Mobile service requested" onChange={setMobile} /><CheckField checked={chair} label="Chair rental requested" onChange={setChair} /><CheckField checked={atHome} label="At-home service requested" onChange={setAtHome} /></div><Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200" disabled={mutation.busy} onClick={() => mutation.mutate("/api/grid/providers", { displayName, legalName, providerType, credential, specialty, subspecialty: null, npi: null, dea: null, licenseType, licenseNumber, licenseState, licenseExpiration: isoDate(licenseExpiration), malpracticeCarrier, malpracticePolicyNumber, malpracticeExpiration: isoDate(malpracticeExpiration), certifications: list(certifications), servicesOffered: list(services), experienceLevel, bio, profilePhoto: null, serviceLocations: list(serviceLocations), mobileServiceAllowed: mobile, chairRentalAllowed: chair, atHomeAllowed: atHome, travelRadiusMiles: travelRadius }, "Provider profile added to the human verification queue.")} size="sm"><ShieldCheck className="size-3.5" /> Create review record</Button><Feedback {...mutation} /></div></details>;
}

export function GridProviderTransitionAction({ canManage, canUpdate, provider }: { canManage: boolean; canUpdate: boolean; provider: GridWorkspace["providers"][number] }) {
  const mutation = useGridMutation();
  const transitions: Record<string, { status: string; label: string; icon: typeof Check }[]> = {
    draft: [{ status: "submitted", label: "Submit for review", icon: Send }],
    submitted: [{ status: "needs_review", label: "Begin review", icon: ChevronRight }, { status: "rejected", label: "Reject", icon: X }],
    needs_review: [{ status: "verified", label: "Verify profile", icon: BadgeCheck }, { status: "rejected", label: "Reject", icon: X }],
    verified: [{ status: "suspended", label: "Suspend", icon: Siren }, { status: "expired", label: "Mark expired", icon: X }],
    rejected: [{ status: "submitted", label: "Resubmit", icon: Send }],
    expired: [{ status: "submitted", label: "Submit renewal", icon: Send }],
    suspended: [{ status: "needs_review", label: "Reopen review", icon: ShieldCheck }],
  };
  const available = transitions[provider.verificationStatus] ?? [];
  const allowed = canManage || (canUpdate && provider.verificationStatus === "draft");
  if (!provider.owned || !allowed || !available.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{available.map(({ status, label, icon: Icon }) => <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[12px] font-extrabold text-white/70 transition hover:border-cyan-300/40 hover:text-white disabled:opacity-50" disabled={mutation.busy || (!canManage && status !== "submitted")} key={status} onClick={() => mutation.mutate(`/api/grid/providers/${provider.id}/transition`, { targetStatus: status, note: `Human Grid credentialing decision recorded: ${label.toLowerCase()} after source evidence review.` }, `${provider.displayName} moved to ${status.replaceAll("_", " ")}.`)}><Icon className="size-3" />{label}</button>)}<Feedback {...mutation} /></div>;
}

export function GridCredentialReviewAction({ canManage, provider }: { canManage: boolean; provider: GridWorkspace["providers"][number] }) {
  const mutation = useGridMutation();
  if (!canManage || !provider.credentialDetails.length) return null;
  return <div className="mt-3 space-y-2">{provider.credentialDetails.map((credential) => <div className="rounded-xl border border-white/8 bg-black/20 p-3" key={credential.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[12px] font-extrabold text-white/70">{credential.type} · {credential.state ?? "State pending"}</p><span className="text-[11px] text-white/35">{credential.verificationStatus}</span></div><p className="mt-1 text-[11px] text-white/35">Evidence: {credential.evidenceReference ?? "No evidence reference"}</p>{credential.verificationStatus !== "verified" && <div className="mt-2 flex gap-2"><button className="rounded-lg bg-emerald-300 px-2.5 py-1.5 text-[11px] font-black text-slate-950" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/providers/${provider.id}/credentials/${credential.id}/review`, { decision: "verified", note: "Human reviewer confirmed the credential against the documented primary source evidence.", verificationSource: "Human primary-source review" }, "Credential verified.")}>Verify license</button><button className="rounded-lg border border-rose-300/25 px-2.5 py-1.5 text-[11px] font-black text-rose-200" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/providers/${provider.id}/credentials/${credential.id}/review`, { decision: "rejected", note: "Human reviewer rejected the credential evidence and requested corrected documentation.", verificationSource: "Human primary-source review" }, "Credential rejected and contractor access held.")}>Reject</button></div>}</div>)}<Feedback {...mutation} /></div>;
}

export function GridMalpracticeReviewAction({ canManage, provider }: { canManage: boolean; provider: GridWorkspace["providers"][number] }) {
  const mutation = useGridMutation();
  if (!canManage || provider.malpracticeVerificationStatus === "verified") return null;
  return <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[12px] font-extrabold text-white/70">Malpractice evidence · {provider.malpracticeVerificationStatus}</p><p className="mt-1 text-[11px] text-white/35">{provider.malpracticeEvidenceReference ?? "No evidence reference"}</p><div className="mt-2 flex gap-2"><button className="rounded-lg bg-emerald-300 px-2.5 py-1.5 text-[11px] font-black text-slate-950" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/providers/${provider.id}/malpractice/review`, { decision: "verified", note: "Human reviewer confirmed current malpractice policy evidence and expiration." }, "Malpractice coverage verified.")}>Verify coverage</button><button className="rounded-lg border border-rose-300/25 px-2.5 py-1.5 text-[11px] font-black text-rose-200" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/providers/${provider.id}/malpractice/review`, { decision: "rejected", note: "Human reviewer rejected the malpractice evidence and requested corrected documentation." }, "Coverage evidence rejected and contractor access held.")}>Reject</button></div><Feedback {...mutation} /></div>;
}

export function GridContractorPreferencesAction({ provider }: { provider: GridWorkspace["providers"][number] }) {
  const mutation = useGridMutation();
  const [serviceArea, setServiceArea] = useState(provider.serviceLocations.find((location) => location !== "Partner locations") ?? "New York City");
  const [travelRadiusMiles, setTravelRadiusMiles] = useState(provider.travelRadiusMiles);
  const [mobile, setMobile] = useState(provider.mobileServiceAllowed);
  const [chair, setChair] = useState(provider.chairRentalAllowed);
  const [partner, setPartner] = useState(provider.partnerLocationAllowed);
  const [atHome, setAtHome] = useState(provider.atHomeAllowed);
  const [onCall, setOnCall] = useState(provider.onCallNow);
  if (!provider.selfManaged) return null;
  return <details className={`${panelClass} mt-3`}><summary className={summaryClass}><span>Update work preferences</span><ChevronRight className="size-3.5" /></summary><div className="space-y-3 border-t border-white/10 p-3"><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Service area<input className={fieldClass} value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} /></label><label className={labelClass}>Travel radius<input className={fieldClass} min={0} type="number" value={travelRadiusMiles} onChange={(event) => setTravelRadiusMiles(Number(event.target.value))} /></label></div><div className="grid gap-2 sm:grid-cols-2"><CheckField checked={mobile} label="Mobile" onChange={setMobile} /><CheckField checked={chair} label="Clinic chair" onChange={setChair} /><CheckField checked={partner} label="Partner location" onChange={setPartner} /><CheckField checked={atHome} label="At-home" onChange={setAtHome} /><CheckField checked={onCall} label="On Call Now" onChange={setOnCall} /></div><Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200" disabled={mutation.busy} size="sm" onClick={() => mutation.mutate("/api/grid/me", { serviceArea, travelRadiusMiles, mobileServiceAllowed: mobile, chairRentalAllowed: chair, partnerLocationAllowed: partner, atHomeAllowed: atHome, onCallNow: onCall }, "Work preferences updated.", "PATCH")}>Save preferences</Button><Feedback {...mutation} /></div></details>;
}

export function GridServiceCreateAction({ enabled, providers }: { enabled: boolean; providers: GridWorkspace["providers"] }) {
  const mutation = useGridMutation();
  const owned = providers.filter((provider) => provider.owned);
  const [providerId, setProviderId] = useState(owned[0]?.id ?? "");
  const [serviceName, setServiceName] = useState("Synthetic provider consultation");
  const [category, setCategory] = useState("Consultation");
  const [description, setDescription] = useState("A controlled synthetic service listing that requires human review before any appointment can be confirmed.");
  const [priceLow, setPriceLow] = useState(150);
  const [priceHigh, setPriceHigh] = useState(300);
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [medicalReview, setMedicalReview] = useState(true);
  const [consent, setConsent] = useState(true);
  const [deposit, setDeposit] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [chair, setChair] = useState(false);
  if (!enabled) return null;
  return <details className={panelClass}><summary className={summaryClass}><span className="flex items-center gap-2"><Plus className="size-4 text-emerald-300" /> Create service listing</span><Plus className="size-4 text-white/40" /></summary><div className="space-y-4 border-t border-white/10 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Provider<select className={fieldClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}>{owned.map((provider) => <option className="bg-slate-950" key={provider.id} value={provider.id}>{provider.displayName} · {provider.verificationStatus}</option>)}</select></label><label className={labelClass}>Listing status<select className={fieldClass} onChange={(event) => setStatus(event.target.value as typeof status)} value={status}><option className="bg-slate-950" value="draft">Draft · Human review required</option><option className="bg-slate-950" value="active">Active · Verified providers only</option></select></label><label className={labelClass}>Service name<input className={fieldClass} onChange={(event) => setServiceName(event.target.value)} value={serviceName} /></label><label className={labelClass}>Category<input className={fieldClass} onChange={(event) => setCategory(event.target.value)} value={category} /></label><label className={`${labelClass} sm:col-span-2`}>Description<textarea className={textAreaClass} onChange={(event) => setDescription(event.target.value)} value={description} /></label><label className={labelClass}>Low price display · dollars<input className={fieldClass} min={0} onChange={(event) => setPriceLow(Number(event.target.value))} type="number" value={priceLow} /></label><label className={labelClass}>High price display · dollars<input className={fieldClass} min={0} onChange={(event) => setPriceHigh(Number(event.target.value))} type="number" value={priceHigh} /></label></div><div className="grid gap-2 sm:grid-cols-3"><CheckField checked={medicalReview} label="Medical review" onChange={setMedicalReview} /><CheckField checked={consent} label="Consent required" onChange={setConsent} /><CheckField checked={deposit} label="Deposit required" onChange={setDeposit} /><CheckField checked={mobile} label="Mobile allowed" onChange={setMobile} /><CheckField checked={chair} label="Chair rental allowed" onChange={setChair} /></div><Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" disabled={mutation.busy || !providerId} onClick={() => mutation.mutate("/api/grid/services", { providerId, serviceName, category, description, priceLowCents: Math.round(priceLow * 100), priceHighCents: Math.round(priceHigh * 100), requiresMedicalReview: medicalReview, requiresConsent: consent, requiresDeposit: deposit, mobileAllowed: mobile, clinicLocationAllowed: true, chairRentalAllowed: chair, status }, "Service listing recorded with its safety gates.")} size="sm"><Plus className="size-3.5" /> Save service listing</Button><Feedback {...mutation} /></div></details>;
}

export function GridLocationCreateAction({ enabled }: { enabled: boolean }) {
  const mutation = useGridMutation();
  const [name, setName] = useState("Synthetic Treatment Suite");
  const [type, setType] = useState("Rental Room / Chair Host");
  const [address, setAddress] = useState("500 Synthetic Grid Avenue");
  const [city, setCity] = useState("Brooklyn");
  const [state, setState] = useState("NY");
  const [zip, setZip] = useState("11201");
  const [rooms, setRooms] = useState("Treatment room, Injector chair");
  const [services, setServices] = useState("Injectables, IV hydration, Consultation");
  const [credentials, setCredentials] = useState("Current state license, Current malpractice coverage");
  const [insurance, setInsurance] = useState("Professional liability coverage");
  const [hourly, setHourly] = useState(125);
  const [daily, setDaily] = useState(750);
  const [chairRental, setChairRental] = useState(true);
  const [visible, setVisible] = useState(true);
  if (!enabled) return null;
  return <details className={panelClass}><summary className={summaryClass}><span className="flex items-center gap-2"><MapPinPlus className="size-4 text-amber-300" /> List a synthetic location</span><Plus className="size-4 text-white/40" /></summary><div className="space-y-4 border-t border-white/10 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Location name<input className={fieldClass} onChange={(event) => setName(event.target.value)} value={name} /></label><label className={labelClass}>Location type<input className={fieldClass} onChange={(event) => setType(event.target.value)} value={type} /></label><label className={`${labelClass} sm:col-span-2`}>Address<input className={fieldClass} onChange={(event) => setAddress(event.target.value)} value={address} /></label><label className={labelClass}>City<input className={fieldClass} onChange={(event) => setCity(event.target.value)} value={city} /></label><div className="grid grid-cols-2 gap-3"><label className={labelClass}>State<input className={fieldClass} onChange={(event) => setState(event.target.value)} value={state} /></label><label className={labelClass}>ZIP<input className={fieldClass} onChange={(event) => setZip(event.target.value)} value={zip} /></label></div><label className={labelClass}>Rooms · comma separated<input className={fieldClass} onChange={(event) => setRooms(event.target.value)} value={rooms} /></label><label className={labelClass}>Services allowed<input className={fieldClass} onChange={(event) => setServices(event.target.value)} value={services} /></label><label className={labelClass}>Credential requirements<input className={fieldClass} onChange={(event) => setCredentials(event.target.value)} value={credentials} /></label><label className={labelClass}>Insurance requirements<input className={fieldClass} onChange={(event) => setInsurance(event.target.value)} value={insurance} /></label><label className={labelClass}>Hourly rate · dollars<input className={fieldClass} min={0} onChange={(event) => setHourly(Number(event.target.value))} type="number" value={hourly} /></label><label className={labelClass}>Daily rate · dollars<input className={fieldClass} min={0} onChange={(event) => setDaily(Number(event.target.value))} type="number" value={daily} /></label></div><div className="grid gap-2 sm:grid-cols-2"><CheckField checked={chairRental} label="Chair/room rental available" onChange={setChairRental} /><CheckField checked={visible} label="Visible in controlled Grid directory" onChange={setVisible} /></div><Button className="bg-amber-300 text-slate-950 hover:bg-amber-200" disabled={mutation.busy} onClick={() => mutation.mutate("/api/grid/locations", { locationName: name, locationType: type, address, city, state, zip, roomTypes: list(rooms), chairRentalAvailable: chairRental, hourlyRateCents: Math.round(hourly * 100), dailyRateCents: Math.round(daily * 100), servicesAllowed: list(services), credentialRequirements: list(credentials), insuranceRequirements: list(insurance), marketplaceVisible: visible }, "Synthetic location listed with access requirements.")} size="sm"><MapPinPlus className="size-3.5" /> List location</Button><Feedback {...mutation} /></div></details>;
}

export function GridAvailabilityCreateAction({ enabled, locations, providers }: { enabled: boolean; locations: GridWorkspace["locations"]; providers: GridWorkspace["providers"] }) {
  const mutation = useGridMutation();
  const owned = providers.filter((provider) => provider.owned);
  const [providerId, setProviderId] = useState(owned[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [day, setDay] = useState(6);
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("18:00");
  const [locationType, setLocationType] = useState<(typeof gridLocationTypes)[number]>("clinic_location");
  const [radius, setRadius] = useState(15);
  const [onCall, setOnCall] = useState(true);
  if (!enabled) return null;
  return <details className={panelClass}><summary className={summaryClass}><span className="flex items-center gap-2"><CalendarPlus className="size-4 text-violet-300" /> Publish availability</span><Plus className="size-4 text-white/40" /></summary><div className="space-y-4 border-t border-white/10 p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className={labelClass}>Provider<select className={fieldClass} onChange={(event) => setProviderId(event.target.value)} value={providerId}>{owned.map((provider) => <option className="bg-slate-950" key={provider.id} value={provider.id}>{provider.displayName}</option>)}</select></label><label className={labelClass}>Location<select className={fieldClass} onChange={(event) => setLocationId(event.target.value)} value={locationId}><option className="bg-slate-950" value="">Mobile / no fixed location</option>{locations.map((location) => <option className="bg-slate-950" key={location.id} value={location.id}>{location.locationName}</option>)}</select></label><label className={labelClass}>Location mode<select className={fieldClass} onChange={(event) => setLocationType(event.target.value as typeof locationType)} value={locationType}>{gridLocationTypes.map((type) => <option className="bg-slate-950" key={type}>{type}</option>)}</select></label><label className={labelClass}>Day of week<select className={fieldClass} onChange={(event) => setDay(Number(event.target.value))} value={day}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((name, index) => <option className="bg-slate-950" key={name} value={index}>{name}</option>)}</select></label><label className={labelClass}>Start<input className={fieldClass} onChange={(event) => setStart(event.target.value)} type="time" value={start} /></label><label className={labelClass}>End<input className={fieldClass} onChange={(event) => setEnd(event.target.value)} type="time" value={end} /></label><label className={labelClass}>Mobile radius<input className={fieldClass} min={0} onChange={(event) => setRadius(Number(event.target.value))} type="number" value={radius} /></label></div><CheckField checked={onCall} label="On-call availability" onChange={setOnCall} /><Button className="bg-violet-300 text-slate-950 hover:bg-violet-200" disabled={mutation.busy || !providerId} onClick={() => mutation.mutate("/api/grid/availability", { providerId, locationId: locationId || null, dayOfWeek: day, startTime: start, endTime: end, locationType, mobileRadius: radius, onCall }, "Availability recorded. Credential gates determined whether it is active or draft.")} size="sm"><CalendarPlus className="size-3.5" /> Publish controlled availability</Button><Feedback {...mutation} /></div></details>;
}

export function GridRequestCreateAction({ enabled, locations, patients, services }: { enabled: boolean; locations: GridWorkspace["locations"]; patients: GridWorkspace["patients"]; services: GridWorkspace["services"] }) {
  const mutation = useGridMutation();
  const active = services.filter((service) => service.status === "active" && service.providerReady);
  const [serviceId, setServiceId] = useState(active[0]?.id ?? "");
  const service = active.find((item) => item.id === serviceId) ?? active[0];
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [start, setStart] = useState("2026-08-15T14:00");
  const [locationType, setLocationType] = useState<(typeof gridLocationTypes)[number]>("clinic_location");
  const [documents, setDocuments] = useState("Synthetic intake summary, Synthetic consent packet");
  const [notes, setNotes] = useState("Please review this synthetic Grid request, confirm credentials and location, and return a manual scheduling decision.");
  if (!enabled) return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/50">Network create permission is required to submit a request.</p>;
  return <details className={panelClass} open><summary className={summaryClass}><span className="flex items-center gap-2"><Send className="size-4 text-cyan-300" /> Create governed service request</span><Plus className="size-4 text-white/40" /></summary><div className="space-y-4 border-t border-white/10 p-4"><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] p-3 text-[12px] leading-5 text-emerald-100">Synthetic demo only. No chart is sent. The receiver sees a synthetic label, requested service, safety gates, and audit receipt.</div><div className="grid gap-3 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Service<select className={fieldClass} onChange={(event) => setServiceId(event.target.value)} value={serviceId}>{active.map((item) => <option className="bg-slate-950" key={item.id} value={item.id}>{item.serviceName} · {item.providerName} · {item.organizationName}</option>)}</select></label><label className={labelClass}>Synthetic patient<select className={fieldClass} onChange={(event) => setPatientId(event.target.value)} value={patientId}>{patients.map((patient) => <option className="bg-slate-950" key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>)}</select></label><label className={labelClass}>Requested time<input className={fieldClass} onChange={(event) => setStart(event.target.value)} type="datetime-local" value={start} /></label><label className={labelClass}>Location<select className={fieldClass} onChange={(event) => setLocationId(event.target.value)} value={locationId}><option className="bg-slate-950" value="">Location review pending</option>{locations.map((location) => <option className="bg-slate-950" key={location.id} value={location.id}>{location.locationName} · {location.organizationName}</option>)}</select></label><label className={labelClass}>Delivery mode<select className={fieldClass} onChange={(event) => setLocationType(event.target.value as typeof locationType)} value={locationType}>{gridLocationTypes.map((type) => <option className="bg-slate-950" key={type}>{type}</option>)}</select></label><label className={`${labelClass} sm:col-span-2`}>Required documents · labels only<input className={fieldClass} onChange={(event) => setDocuments(event.target.value)} value={documents} /></label><label className={`${labelClass} sm:col-span-2`}>Human review note<textarea className={textAreaClass} onChange={(event) => setNotes(event.target.value)} value={notes} /></label></div><Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200" disabled={mutation.busy || !service || !patientId || !start} onClick={() => mutation.mutate("/api/grid/requests", { patientId, syntheticClientLabel: patients.find((patient) => patient.id === patientId)?.name ?? "Synthetic client", syntheticClientReference: patients.find((patient) => patient.id === patientId)?.mrn ?? "SYNTH-GRID", serviceListingId: service?.id, providerId: service?.providerId, locationId: locationId || null, requestedStartAt: isoLocalDateTime(start), requestedEndAt: null, locationType, safetyFlags: service?.requiresMedicalReview ? ["Licensed medical review required"] : [], requiredDocuments: list(documents), consentStatus: service?.requiresConsent ? "pending" : "not_required", notes }, "Grid request created with dual-organization audit receipts.")} size="sm"><Send className="size-3.5" /> Send for human review</Button><Feedback {...mutation} /></div></details>;
}

export function GridRequestTransitionAction({ canUpdate, contractor, request }: { canUpdate: boolean; contractor?: boolean; request: GridWorkspace["requests"][number] }) {
  const mutation = useGridMutation();
  const [counterStartAt, setCounterStartAt] = useState("");
  if (!canUpdate) return null;
  if (contractor ?? request.contractorDecision) {
    if (request.status !== "requested") return null;
    return <div className="mt-3 space-y-2"><div className="flex flex-wrap gap-2"><button className="rounded-lg bg-emerald-300 px-2.5 py-1.5 text-[12px] font-black text-slate-950" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/requests/${request.id}/transition`, { targetStatus: "accepted", note: "Independent contractor accepted this governed GRID request for clinic review." }, "Request accepted and returned to clinic review.")}><Check className="mr-1 inline size-3" />Accept</button><button className="rounded-lg border border-rose-300/25 px-2.5 py-1.5 text-[12px] font-black text-rose-200" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/requests/${request.id}/transition`, { targetStatus: "declined", note: "Independent contractor declined this GRID request after reviewing availability and work setting." }, "Request declined.")}><X className="mr-1 inline size-3" />Decline</button></div><label className={labelClass}>Counter-proposed time<input className={fieldClass} type="datetime-local" value={counterStartAt} onChange={(event) => setCounterStartAt(event.target.value)} /></label><button className="rounded-lg border border-violet-300/25 px-2.5 py-1.5 text-[12px] font-black text-violet-200 disabled:opacity-50" disabled={mutation.busy || !counterStartAt} onClick={() => mutation.mutate(`/api/grid/requests/${request.id}/transition`, { targetStatus: "countered", counterStartAt: isoLocalDateTime(counterStartAt), note: "Independent contractor proposed a different start time for clinic review." }, "Counter-proposal recorded.")}>Counter request</button><Feedback {...mutation} /></div>;
  }
  const nextByStatus: Record<string, { status: string; label: string; consentStatus?: string; depositStatus?: string }> = {
    requested: { status: "provider_review", label: "Begin provider review" },
    accepted: { status: "location_review", label: "Contractor acceptance reviewed" },
    provider_review: { status: "location_review", label: "Provider scope reviewed" },
    location_review: { status: "credential_check", label: "Location reviewed" },
    credential_check: request.depositStatus === "not_required" ? { status: "confirmed", label: "Confirm request", consentStatus: "confirmed" } : { status: "pending_deposit", label: "Credentials cleared", consentStatus: "confirmed" },
    pending_deposit: { status: "confirmed", label: "Record demo deposit + confirm", consentStatus: "confirmed", depositStatus: "recorded" },
    confirmed: { status: "completed", label: "Mark completed" },
    escalated: { status: "provider_review", label: "Resume human review" },
  };
  const next = nextByStatus[request.status];
  const canAdvance = request.direction === "inbound";
  const terminal = ["completed", "cancelled", "declined"].includes(request.status);
  if (terminal) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{next && canAdvance && <button className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-2.5 py-1.5 text-[12px] font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/requests/${request.id}/transition`, { targetStatus: next.status, note: `Human Grid reviewer completed ${next.label.toLowerCase()} using synthetic records.`, consentStatus: next.consentStatus, depositStatus: next.depositStatus }, `Request moved to ${next.status.replaceAll("_", " ")}.`)}><Check className="size-3" />{next.label}</button>}{request.direction === "outbound" && <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-bold text-white/55 hover:text-white" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/requests/${request.id}/transition`, { targetStatus: "cancelled", note: "Requesting organization cancelled this synthetic Grid request after human review." }, "Request cancelled with an audit receipt.")}><X className="size-3" /> Cancel</button>}{!["escalated"].includes(request.status) && <button className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/20 px-2.5 py-1.5 text-[12px] font-bold text-rose-200 hover:border-rose-300/40" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/requests/${request.id}/transition`, { targetStatus: "escalated", note: "Grid request escalated to staff for documented human review and resolution." }, "Request escalated to the human review queue.")}><Siren className="size-3" /> Escalate</button>}<Feedback {...mutation} /></div>;
}

export function GridPayoutTransitionAction({ canManage, payout }: { canManage: boolean; payout: GridWorkspace["payouts"][number] }) {
  const mutation = useGridMutation();
  const [reference, setReference] = useState("");
  if (!canManage || ["paid", "void"].includes(payout.status)) return null;
  return <div className="mt-3 space-y-2">{payout.status === "approved" && <input className={fieldClass} placeholder="Manual payment reference" value={reference} onChange={(event) => setReference(event.target.value)} />}<div className="flex flex-wrap gap-2">{payout.status !== "approved" && <button className="rounded-lg bg-emerald-300 px-2.5 py-1.5 text-[11px] font-black text-slate-950" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/payouts/${payout.id}/transition`, { targetStatus: "approved", note: "Administrator approved this manual payout record after request review." }, "Payout estimate approved.")}>Approve</button>}{payout.status === "approved" && <button className="rounded-lg bg-cyan-300 px-2.5 py-1.5 text-[11px] font-black text-slate-950 disabled:opacity-50" disabled={mutation.busy || !reference} onClick={() => mutation.mutate(`/api/grid/payouts/${payout.id}/transition`, { targetStatus: "paid", note: "Administrator recorded the externally completed payout with a manual reference.", externalReference: reference }, "Payout marked paid with a manual reference.")}>Mark paid</button>}{payout.status !== "hold" && <button className="rounded-lg border border-amber-300/25 px-2.5 py-1.5 text-[11px] font-black text-amber-200" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/payouts/${payout.id}/transition`, { targetStatus: "hold", note: "Administrator placed this estimate on hold for manual review." }, "Payout placed on hold.")}>Hold</button>}<button className="rounded-lg border border-rose-300/25 px-2.5 py-1.5 text-[11px] font-black text-rose-200" disabled={mutation.busy} onClick={() => mutation.mutate(`/api/grid/payouts/${payout.id}/transition`, { targetStatus: "void", note: "Administrator voided this payout estimate after manual review." }, "Payout estimate voided.")}>Void</button></div><Feedback {...mutation} /></div>;
}
