"use client";

import { useDeferredValue, useState } from "react";
import { CheckCircle2, ChevronDown, Database, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/clinic/workspace-kit";
import { completionGateKeys } from "@/lib/feature-registry-canon";

export interface RegistryCapabilityView {
  id: string;
  name: string;
  priority: string;
  deliveryStatus: string;
  deliveryMode: string;
}

export interface RegistrySectionView {
  id: string;
  number: number;
  slug: string;
  title: string;
  mandate: string;
  priority: string;
  deliveryStatus: string;
  deliveryMode: string;
  interfaceRoute: string;
  ownerRoles: string[];
  databaseObjects: string[];
  featureCount: number;
  canonVersion: string;
  capabilities: RegistryCapabilityView[];
}

function statusTone(status: string) {
  if (status === "CONNECTED") return "teal" as const;
  if (status === "DEMO" || status === "FOUNDATION") return "sky" as const;
  if (status === "GOVERNED") return "amber" as const;
  return "slate" as const;
}

export function FeatureRegistryWorkspace({ sections }: { sections: RegistrySectionView[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const capabilityCount = sections.reduce((total, section) => total + section.capabilities.length, 0);
  const filtered = sections.map((section) => ({
    ...section,
    capabilities: section.capabilities.filter((capability) => !deferredQuery || `${section.title} ${capability.name}`.toLowerCase().includes(deferredQuery)),
  })).filter((section) => (status === "ALL" || section.deliveryStatus === status) && (!deferredQuery || section.capabilities.length > 0 || section.title.toLowerCase().includes(deferredQuery)));

  return <div className="space-y-6">
    <PageIntro title="Nothing disappears from ClinicOS." description="Every requirement is immutable Priority Zero. Delivery labels show what is connected today, what is a governed demo, and what remains planned or vendor-dependent. Priority is not the same as implementation status." aside={<Badge tone="rose">P0 constitution</Badge>} />

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        [String(sections.length), "Product domains", "All canon sections"],
        [capabilityCount.toLocaleString(), "P0 capabilities", "No silent removal"],
        [String(completionGateKeys.length), "Completion gates", "Required per capability"],
        [sections[0]?.canonVersion ?? "-", "Canon version", "Database enforced"],
      ].map(([value, label, detail]) => <Card className="p-5" key={label}><p className="text-3xl font-black tracking-[-.05em] text-slate-950">{value}</p><p className="mt-2 text-xs font-extrabold text-slate-800">{label}</p><p className="mt-1 text-[12px] text-slate-400">{detail}</p></Card>)}
    </div>

    <Card className="overflow-hidden">
      <div className="grid gap-4 border-b border-slate-100 p-4 lg:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-teal-400 focus-within:bg-white">
          <Search className="size-4 text-slate-400" />
          <input aria-label="Search Priority Zero capabilities" className="min-w-0 flex-1 bg-transparent text-xs outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search every capability, domain, or workflow..." value={query} />
        </label>
        <div className="flex flex-wrap gap-1.5">{["ALL", "CONNECTED", "DEMO", "FOUNDATION", "PLANNED", "VENDOR_DEPENDENT", "GOVERNED"].map((value) => <button className={`rounded-lg px-2.5 py-2 text-[11px] font-extrabold transition ${status === value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`} key={value} onClick={() => setStatus(value)}>{value.replace("_", " ")}</button>)}</div>
      </div>
      <div className="divide-y divide-slate-100">
        {filtered.map((section) => <details className="group" key={section.id}>
          <summary className="flex cursor-pointer list-none items-start gap-4 p-5 transition hover:bg-slate-50/70">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">{String(section.number).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-extrabold text-slate-950">{section.title}</span><Badge tone={statusTone(section.deliveryStatus)}>{section.deliveryStatus.replace("_", " ")}</Badge><Badge tone="rose">P0</Badge></span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{section.mandate}</span><span className="mt-2 block text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{section.capabilities.length} visible capabilities · {section.interfaceRoute} · {section.deliveryMode}</span></span>
            <ChevronDown className="mt-2 size-4 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 bg-[#f8faf9] p-5">
            <div className="mb-4 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><ShieldCheck className="size-4 text-teal-600" /><p className="mt-2 text-[11px] font-extrabold text-slate-900">OWNERS & ACCESS</p><p className="mt-1 text-[12px] leading-5 text-slate-500">{section.ownerRoles.join(", ")}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><Database className="size-4 text-sky-600" /><p className="mt-2 text-[11px] font-extrabold text-slate-900">DATA ARCHITECTURE</p><p className="mt-1 text-[12px] leading-5 text-slate-500">{section.databaseObjects.join(", ")}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><LockKeyhole className="size-4 text-amber-600" /><p className="mt-2 text-[11px] font-extrabold text-slate-900">DEFINITION OF COMPLETE</p><p className="mt-1 text-[12px] leading-5 text-slate-500">All {completionGateKeys.length} gates must be evidenced before status can become connected.</p></div></div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{section.capabilities.map((capability) => <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3" key={capability.id}><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-teal-600" /><div><p className="text-[12px] font-bold leading-4 text-slate-700">{capability.name}</p><p className="mt-1 text-[11px] font-extrabold uppercase tracking-[.1em] text-slate-400">{capability.priority} · {capability.deliveryStatus.replace("_", " ")}</p></div></div>)}</div>
          </div>
        </details>)}
        {filtered.length === 0 && <div className="p-10 text-center"><p className="text-sm font-extrabold text-slate-900">No matching capability</p><p className="mt-2 text-xs text-slate-500">Change the search or delivery filter. The canon itself has not been changed.</p></div>}
      </div>
    </Card>
  </div>;
}
