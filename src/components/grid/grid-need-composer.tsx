"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Crosshair, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const kinds = [
  ["work", "Work / staffing"],
  ["provider", "Professional / provider"],
  ["space", "Space / room"],
  ["product", "Products / supplies"],
  ["equipment", "Equipment"],
  ["service", "Business service"],
  ["network", "Network capacity"],
  ["education", "Education / placement"],
  ["organization", "Organization capacity"],
  ["referral", "Referral capacity"],
] as const;

type Kind = (typeof kinds)[number][0];

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function dollarsToCents(value: string) {
  if (!value.trim()) return null;
  const dollars = Number(value);
  return Number.isFinite(dollars) && dollars >= 0 ? Math.round(dollars * 100) : null;
}

function split(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

export function GridNeedComposer({ initialKind = "service" }: { initialKind?: Kind }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(initialKind);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NY");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState("25");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [budget, setBudget] = useState("");
  const [locationType, setLocationType] = useState("");
  const [requirements, setRequirements] = useState("");
  const [clinical, setClinical] = useState(["work", "provider"].includes(initialKind));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const kindLabel = useMemo(() => kinds.find(([value]) => value === kind)?.[1] ?? "Grid need", [kind]);

  function changeKind(next: Kind) {
    setKind(next);
    if (["work", "provider"].includes(next)) setClinical(true);
  }

  function useCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("This browser does not provide location access. City and state matching is still available.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      (reason) => {
        setError(reason.code === reason.PERMISSION_DENIED
          ? "Location permission was not granted. Grid will use city and state without claiming an exact radius."
          : "Grid could not read this device location. City and state matching is still available.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  async function submit() {
    setError(null);
    if (title.trim().length < 3 || description.trim().length < 8 || category.trim().length < 2) {
      setError("Add a clear title, description, and category so Grid has enough structure to search.");
      return;
    }
    if (state && state.trim().length !== 2) {
      setError("Use a two-letter state code or leave state blank.");
      return;
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("The requested end time must be after the start time.");
      return;
    }

    const maxPriceCents = dollarsToCents(budget);
    if (budget.trim() && maxPriceCents == null) {
      setError("Enter a valid maximum budget or leave it blank.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/grid/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          description,
          category,
          serviceName: serviceName.trim() || null,
          requestedStartAt: toIso(startsAt),
          requestedEndAt: toIso(endsAt),
          locationType: locationType.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          latitude,
          longitude,
          radiusMiles: radiusMiles.trim() ? Math.max(0, Math.round(Number(radiusMiles))) : null,
          maxPriceCents,
          quantity: Math.max(1, Math.round(Number(quantity || "1"))),
          requiresClinicalEligibility: clinical,
          requirements: split(requirements),
          status: "open",
          visibility: "matched_only",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? payload.details?.[0]?.message ?? "Grid could not save this need.");
      const id = payload.data?.id as string | undefined;
      if (!id) throw new Error("Grid saved the request without returning a usable reference.");
      setCreatedId(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Grid could not save this need.");
    } finally {
      setBusy(false);
    }
  }

  if (createdId) {
    return <div className="rounded-[1.6rem] border border-emerald-300/20 bg-emerald-300/[.06] p-6">
      <CheckCircle2 className="size-7 text-emerald-200" />
      <p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Need saved</p>
      <h2 className="mt-2 text-2xl font-black text-white">Grid can search this now.</h2>
      <p className="mt-3 max-w-2xl text-xs leading-6 text-white/50">This is a saved demand, not a booking. Discovery can surface candidates, but offer, authorization, eligibility, reservation, payment, and fulfillment gates still apply.</p>
      <div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => router.push(`/grid/needs/${createdId}/matches`)}>Find candidates <ArrowRight className="size-4" /></Button><Button variant="secondary" onClick={() => router.push("/grid/opportunities")}>Back to opportunities</Button></div>
    </div>;
  }

  return <div className="rounded-[1.8rem] border border-white/10 bg-[#070b13] p-5 sm:p-7">
    <div className="flex flex-wrap gap-2">{kinds.map(([value, label]) => <button className={`rounded-full border px-3 py-2 text-[10px] font-extrabold ${kind === value ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-white/45 hover:text-white"}`} key={value} onClick={() => changeKind(value)} type="button">{label}</button>)}</div>
    <p className="mt-7 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">I need · {kindLabel}</p>
    <h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">Describe the outcome. Grid structures the search.</h2>
    <p className="mt-3 max-w-3xl text-xs leading-6 text-white/45">Do not put patient names, diagnoses, records, or other PHI in a general Grid need. This object is for marketplace/resource requirements only.</p>

    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45 md:col-span-2">Need title<Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: RN coverage Friday 9–5" /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45 md:col-span-2">What do you need?<textarea className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white outline-none" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the resource, capacity, service, or work requirement without patient information." /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Category<Input className="mt-2" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="RN coverage, treatment room, billing…" /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Specific service or capability<Input className="mt-2" value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="Optional" /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">City<Input className="mt-2" value={city} onChange={(event) => setCity(event.target.value)} /></label>
      <div className="grid grid-cols-[100px_1fr] gap-2"><label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">State<Input className="mt-2" maxLength={2} value={state} onChange={(event) => setState(event.target.value.toUpperCase())} /></label><label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Radius miles<Input className="mt-2" min={0} type="number" value={radiusMiles} onChange={(event) => setRadiusMiles(event.target.value)} /></label></div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4 md:col-span-2"><div><p className="text-xs font-extrabold text-white">Use a real search origin</p><p className="mt-1 text-[10px] leading-5 text-white/40">Optional. Grid asks only after you choose this button. Without it, results use city/state and do not claim exact distance.</p></div><Button disabled={locating} onClick={useCurrentLocation} type="button" variant="secondary">{locating ? <LoaderCircle className="size-4 animate-spin" /> : <Crosshair className="size-4" />}{latitude != null && longitude != null ? "Location captured" : "Use my location"}</Button></div>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Start<Input className="mt-2" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">End<Input className="mt-2" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Quantity / capacity<Input className="mt-2" min={1} type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Max budget · USD<Input className="mt-2" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Optional" /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Setting / location type<Input className="mt-2" value={locationType} onChange={(event) => setLocationType(event.target.value)} placeholder="Mobile, clinic, remote…" /></label>
      <label className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Requirements<textarea className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white outline-none" value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="One per line or comma separated" /></label>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4 text-xs text-white/60 md:col-span-2"><input checked={clinical} className="mt-0.5" onChange={(event) => setClinical(event.target.checked)} type="checkbox" /><span><strong className="block text-white">Clinical / regulated eligibility required</strong><span className="mt-1 block text-[10px] leading-5 text-white/40">Keep this on whenever the opportunity requires professional licensing, credential, jurisdiction, malpractice, or other regulated eligibility.</span></span></label>
    </div>

    {error && <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[.06] px-4 py-3 text-xs text-rose-100">{error}</div>}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="flex max-w-2xl gap-2 text-[10px] leading-5 text-amber-100/60"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-200" />A saved need starts matching. It does not expose private clinical information or authorize a transaction.</p><Button disabled={busy} onClick={submit}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}Save need & search <ArrowRight className="size-4" /></Button></div>
  </div>;
}
