"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Box, Building2, GraduationCap, PackageSearch, Pause, Send, ShieldCheck, Sparkles, Stethoscope, Wrench } from "lucide-react";

type OwnedResource = {
  id: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  visibility: string;
  status: string;
  city: string | null;
  state: string | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  reviewStatus: string;
  availability: { startsAt: string; endsAt: string; capacity: number }[];
};

type Mode = {
  type: string;
  policyClass: string;
  label: string;
  body: string;
  icon: typeof Box;
  needsAvailability: boolean;
};

const modes: Mode[] = [
  { type: "space", policyClass: "healthcare_space", label: "Space / room", body: "Treatment rooms, exam rooms, chairs, suites, training space, or other approved healthcare capacity.", icon: Building2, needsAvailability: true },
  { type: "equipment", policyClass: "equipment_capacity", label: "Equipment", body: "Rentable diagnostic, treatment, training, or operational equipment capacity with operator restrictions.", icon: Wrench, needsAvailability: true },
  { type: "product", policyClass: "general_supply", label: "General supply", body: "Permitted non-prescription operational supplies and consumables. Regulated products use a different review boundary.", icon: PackageSearch, needsAvailability: false },
  { type: "service", policyClass: "business_service", label: "Business service", body: "Billing, credentialing, staffing, recruiting, compliance, consulting, IT, accounting, and similar support.", icon: Sparkles, needsAvailability: false },
  { type: "organization_capacity", policyClass: "organization_capacity", label: "Organization capacity", body: "Clinic, lab, imaging, specialty, partner, or other organization-level capacity available to the network.", icon: Stethoscope, needsAvailability: false },
  { type: "education", policyClass: "education_capacity", label: "Education capacity", body: "Preceptorships, placements, training seats, internships, simulation, or other learning capacity.", icon: GraduationCap, needsAvailability: true },
  { type: "referral", policyClass: "referral_capacity", label: "Referral capacity", body: "Purpose-bound consultation, specialty, diagnostic, or partner handoff capacity. Never unrestricted public inventory.", icon: ShieldCheck, needsAvailability: true },
];

function money(cents: number | null) {
  if (cents == null) return "Quote";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Status({ value }: { value: string }) {
  const good = /active|approved/i.test(value);
  const bad = /rejected|suspended/i.test(value);
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : bad ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{label(value)}</span>;
}

async function responseData(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Grid resource action failed.");
  return body.data;
}

export function GridResourceOwnerConsole({ resources }: { resources: OwnedResource[] }) {
  const router = useRouter();
  const [modeKey, setModeKey] = useState("space");
  const mode = useMemo(() => modes.find((item) => item.type === modeKey) ?? modes[0], [modeKey]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ good: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subtype: "",
    city: "",
    state: "NY",
    visibility: "matched_only",
    pricingModel: "quote",
    price: "",
    capacity: "1",
    start: "",
    end: "",
    credentialRequirements: "",
    insuranceRequirements: "",
    operatorRequirements: "",
    usageRestrictions: "",
  });

  function splitLines(value: string) {
    return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  async function createAndSubmit() {
    if (!mode || !form.title.trim() || form.description.trim().length < 12) {
      setMessage({ good: false, text: "Add a clear title and a useful description before submitting." });
      return;
    }
    if (mode.needsAvailability && (!form.start || !form.end)) {
      setMessage({ good: false, text: "This capacity type needs an availability window before review." });
      return;
    }
    const capacity = Math.max(1, Math.round(Number(form.capacity || "1")));
    const priceCents = form.pricingModel === "quote" ? null : Math.round(Number(form.price || "0") * 100);
    if (form.pricingModel !== "quote" && (!Number.isFinite(priceCents) || priceCents < 0)) {
      setMessage({ good: false, text: "Enter a valid price or choose Request quote." });
      return;
    }

    setBusy("create");
    setMessage(null);
    try {
      const created = await responseData(await fetch("/api/grid/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: mode.type,
          policyClass: mode.policyClass,
          subtype: form.subtype || null,
          title: form.title,
          description: form.description,
          visibility: mode.type === "referral" && form.visibility === "public" ? "matched_only" : form.visibility,
          city: form.city || null,
          state: form.state || null,
          pricingModel: form.pricingModel,
          priceCents,
          capacity,
          credentialRequirements: splitLines(form.credentialRequirements),
          insuranceRequirements: splitLines(form.insuranceRequirements),
          operatorRequirements: splitLines(form.operatorRequirements),
          usageRestrictions: splitLines(form.usageRestrictions),
          availability: mode.needsAvailability ? [{
            startsAt: new Date(form.start).toISOString(),
            endsAt: new Date(form.end).toISOString(),
            capacity,
          }] : [],
        }),
      }));
      await responseData(await fetch(`/api/grid/resources/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: "pending_review", note: "Owner submitted this Grid resource for Klinikos review." }),
      }));
      setMessage({ good: true, text: "Resource submitted. It stays non-transactional until the required Grid review is approved." });
      setForm((current) => ({ ...current, title: "", description: "", subtype: "", start: "", end: "", price: "" }));
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Resource submission failed." });
    } finally {
      setBusy(null);
    }
  }

  async function pauseResource(resourceId: string) {
    setBusy(resourceId);
    setMessage(null);
    try {
      await responseData(await fetch(`/api/grid/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: "paused", note: "Owner paused this resource and removed its active capacity from Grid." }),
      }));
      setMessage({ good: true, text: "Resource paused." });
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Resource update failed." });
    } finally {
      setBusy(null);
    }
  }

  return <div className="space-y-6">
    {message && <div className={`rounded-2xl border px-4 py-3 text-xs ${message.good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>{message.text}</div>}

    <section className="rounded-[1.8rem] border border-white/10 bg-[#070b13] p-5 sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">I have something</p>
      <h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">Tell Grid what you can make available.</h2>
      <p className="mt-3 max-w-3xl text-xs leading-6 text-white/45">You create the resource once. Klinikos keeps the policy, review, discoverability, and transaction eligibility separate so a listing never silently becomes authorization.</p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{modes.map((item) => <button className={`rounded-2xl border p-4 text-left transition ${modeKey === item.type ? "border-cyan-300/30 bg-cyan-300/[.08]" : "border-white/10 bg-white/[.025] hover:bg-white/[.04]"}`} key={item.type} onClick={() => setModeKey(item.type)}><item.icon className={`size-4 ${modeKey === item.type ? "text-cyan-200" : "text-white/35"}`} /><p className="mt-4 text-sm font-extrabold text-white">{item.label}</p><p className="mt-2 text-[9px] leading-4 text-white/40">{item.body}</p></button>)}</div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 md:grid-cols-2">
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white md:col-span-2" placeholder={`${mode.label} title`} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <textarea className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white md:col-span-2" placeholder="What is available, what can it be used for, and what should a legitimate Grid participant know?" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Subtype (optional)" value={form.subtype} onChange={(event) => setForm({ ...form, subtype: event.target.value })} />
        <div className="grid grid-cols-[1fr_90px] gap-2"><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" maxLength={2} placeholder="NY" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} /></div>
        <select className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}><option value="matched_only">Matched participants only</option><option value="network">Verified network</option>{mode.type !== "referral" && <option value="public">Public discovery</option>}<option value="organization">My organization only</option><option value="invite_only">Invite only</option><option value="private">Private</option></select>
        <div className="grid grid-cols-2 gap-2"><select className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" value={form.pricingModel} onChange={(event) => setForm({ ...form, pricingModel: event.target.value })}><option value="quote">Request quote</option><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="per_unit">Per unit</option><option value="per_seat">Per seat</option></select><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" disabled={form.pricingModel === "quote"} inputMode="decimal" placeholder="Price $" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" inputMode="numeric" placeholder="Capacity" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
        {mode.needsAvailability && <><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" type="datetime-local" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" type="datetime-local" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></>}
        <textarea className="min-h-20 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Credential requirements, comma or line separated" value={form.credentialRequirements} onChange={(event) => setForm({ ...form, credentialRequirements: event.target.value })} />
        <textarea className="min-h-20 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Insurance requirements" value={form.insuranceRequirements} onChange={(event) => setForm({ ...form, insuranceRequirements: event.target.value })} />
        <textarea className="min-h-20 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Operator requirements" value={form.operatorRequirements} onChange={(event) => setForm({ ...form, operatorRequirements: event.target.value })} />
        <textarea className="min-h-20 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Usage restrictions" value={form.usageRestrictions} onChange={(event) => setForm({ ...form, usageRestrictions: event.target.value })} />
        <button className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950 md:col-span-2" disabled={busy === "create"} onClick={createAndSubmit}><Send className="mr-2 inline size-4" />{busy === "create" ? "Submitting…" : "Create and submit for review"}</button>
      </div>
      <p className="mt-3 text-[9px] leading-4 text-white/30">Clinical services belong in professional/provider enrollment. Prescription or otherwise regulated products may be captured for review but remain non-transactional until their dedicated transfer and custody policy exists.</p>
    </section>

    <section className="rounded-[1.8rem] border border-white/10 bg-white/[.03] p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">My supply</p><h2 className="mt-2 text-2xl font-black text-white">Resources & capacity</h2></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-extrabold text-white/40">{resources.length} resource{resources.length === 1 ? "" : "s"}</span></div><div className="mt-5 grid gap-3 xl:grid-cols-2">{resources.length === 0 && <p className="text-xs text-white/40">No universal resources yet.</p>}{resources.map((resource) => <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={resource.id}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Status value={resource.status} /><Status value={resource.reviewStatus} /></div><h3 className="mt-3 text-base font-black text-white">{resource.title}</h3><p className="mt-1 text-[10px] text-white/40">{label(resource.resourceType)} · {label(resource.policyClass)} · {resource.city || resource.state || "Location flexible"}</p></div><p className="text-sm font-black text-cyan-100">{money(resource.priceCents)}</p></div><p className="mt-3 line-clamp-2 text-[10px] leading-5 text-white/45">{resource.description}</p><div className="mt-3 flex items-center justify-between text-[9px] text-white/30"><span>Capacity {resource.capacity}</span><span>{label(resource.visibility)}</span><span>{resource.availability.length} window{resource.availability.length === 1 ? "" : "s"}</span></div>{resource.status === "active" && <button className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-extrabold text-white/60" disabled={busy === resource.id} onClick={() => pauseResource(resource.id)}><Pause className="mr-1 inline size-3" />Pause resource</button>}</article>)}</div></section>
  </div>;
}
