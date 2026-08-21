"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Boxes, Building2, GraduationCap, PackageSearch, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";

type PublicResource = {
  id: string;
  organizationId: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  city: string | null;
  state: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  credentialRequirements: unknown[];
  insuranceRequirements: unknown[];
  operatorRequirements: unknown[];
  usageRestrictions: unknown[];
  availability: { startsAt: string; endsAt: string; capacity: number }[];
};

const icons: Record<string, typeof Boxes> = {
  space: Building2,
  product: PackageSearch,
  equipment: Wrench,
  service: Sparkles,
  organization_capacity: Building2,
  education: GraduationCap,
  referral: ShieldCheck,
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function money(resource: PublicResource) {
  if (resource.priceCents == null || resource.pricingModel === "quote") return "Request quote";
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(resource.priceCents / 100);
  return `${amount} ${label(resource.pricingModel)}`;
}

function firstWindow(resource: PublicResource) {
  const slot = resource.availability[0];
  if (!slot) return "Availability by request";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(slot.startsAt));
}

export function GridResourceMarketplace({ resources }: { resources: PublicResource[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => resources.filter((resource) => {
    if (type !== "all" && resource.resourceType !== type) return false;
    const haystack = `${resource.title} ${resource.description} ${resource.resourceType} ${resource.subtype ?? ""} ${resource.city ?? ""} ${resource.state ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [query, resources, type]);

  return <div className="space-y-5">
    <div className="grid gap-3 rounded-[1.5rem] border border-[#dfe3e8] bg-white p-4 sm:grid-cols-[1fr_220px]">
      <label className="flex items-center gap-2 rounded-xl border border-[#dfe3e8] bg-[#f8fafc] px-3"><Search className="size-4 text-[#64748b]" /><input className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-[#64748b]" placeholder="Search rooms, equipment, services, training, organizations…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select className="min-h-12 rounded-xl border border-[#dfe3e8] bg-[#f8fafc] px-3 text-sm font-bold" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All resource types</option><option value="space">Space</option><option value="equipment">Equipment</option><option value="product">General supplies</option><option value="service">Business services</option><option value="organization_capacity">Organizations</option><option value="education">Education</option></select>
    </div>

    <div className="flex items-center justify-between gap-4"><p className="text-[12px] font-extrabold uppercase tracking-[.16em] text-[#64748b]">{filtered.length} approved resource{filtered.length === 1 ? "" : "s"}</p><p className="text-[12px] text-[#475569]">Only public, reviewed inventory is shown here.</p></div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((resource) => {const Icon = icons[resource.resourceType] ?? Boxes;return <article className="group flex min-h-[310px] flex-col rounded-[1.5rem] border border-[#dfe3e8] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:border-[#b8c7dc]" key={resource.id}><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eef5ff] text-[#174ea6]"><Icon className="size-5" /></span><span className="rounded-full border border-[#dfe3e8] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64748b]">{label(resource.resourceType)}</span></div><h2 className="mt-5 text-xl font-black tracking-[-.04em] text-[#0b1220]">{resource.title}</h2><p className="mt-2 line-clamp-3 text-[12px] leading-6 text-[#64748b]">{resource.description}</p><div className="mt-5 grid grid-cols-2 gap-3 text-[12px]"><div><p className="font-extrabold uppercase tracking-[.12em] text-[#475569]">Where</p><p className="mt-1 font-bold text-[#334155]">{resource.city || resource.state ? [resource.city, resource.state].filter(Boolean).join(", ") : "Location flexible"}</p></div><div><p className="font-extrabold uppercase tracking-[.12em] text-[#475569]">Capacity</p><p className="mt-1 font-bold text-[#334155]">{resource.capacity}</p></div><div><p className="font-extrabold uppercase tracking-[.12em] text-[#475569]">Price</p><p className="mt-1 font-bold text-[#334155]">{money(resource)}</p></div><div><p className="font-extrabold uppercase tracking-[.12em] text-[#475569]">Next window</p><p className="mt-1 font-bold text-[#334155]">{firstWindow(resource)}</p></div></div><Link className="mt-auto flex items-center justify-between gap-3 border-t border-[#eef1f4] pt-4 text-xs font-extrabold text-[#174ea6]" href={`/grid/resources/request/${resource.id}`}>Request this resource <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></article>})}</div>

    {filtered.length === 0 && <div className="rounded-[1.5rem] border border-dashed border-[#cbd5e1] bg-white px-6 py-16 text-center"><Boxes className="mx-auto size-8 text-[#64748b]" /><h2 className="mt-4 text-lg font-black text-[#0b1220]">No approved resources match yet.</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748b]">Try another resource class or broader search. Grid does not fabricate supply to fill an empty marketplace.</p></div>}
  </div>;
}
