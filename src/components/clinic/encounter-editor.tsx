"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Check, ChevronDown, Clock3, FileClock,
  History, LockKeyhole, Plus, Save, ShieldCheck, Signature, Sparkles, Stethoscope,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Encounter, Patient } from "@/lib/types";
import { StatusBadge } from "@/components/clinic/workspace-kit";

const structuredSections = [
  { key: "chiefComplaint", label: "Chief complaint", rows: 2 },
  { key: "hpi", label: "History of present illness", rows: 5 },
  { key: "subjective", label: "Subjective / review of systems", rows: 4 },
  { key: "objective", label: "Objective / physical exam", rows: 4 },
  { key: "assessment", label: "Assessment", rows: 4 },
  { key: "plan", label: "Plan", rows: 5 },
] as const;

export function EncounterEditor({ encounter, patient }: { encounter: Encounter; patient: Patient }) {
  const [fields, setFields] = useState(() => Object.fromEntries(structuredSections.map((section) => [section.key, encounter[section.key]])) as Record<(typeof structuredSections)[number]["key"], string>);
  const [saveState, setSaveState] = useState<"Saved" | "Saving">("Saved");
  const [showAudit, setShowAudit] = useState(true);

  useEffect(() => {
    if (saveState !== "Saving") return;
    const timer = window.setTimeout(() => setSaveState("Saved"), 650);
    return () => window.clearTimeout(timer);
  }, [fields, saveState]);

  function updateField(key: (typeof structuredSections)[number]["key"], value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaveState("Saving");
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3"><Link className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-950" href={`/patients/${patient.id}`}><ArrowLeft className="size-4" /> Back to chart</Link><span className="h-4 w-px bg-slate-200" /><span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">{saveState === "Saving" ? <Clock3 className="size-3.5 animate-pulse" /> : <Check className="size-3.5 text-teal-600" />}{saveState === "Saving" ? "Saving changes..." : "All changes saved"}</span></div>
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.07)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-sm font-extrabold text-teal-700">{patient.initials}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold tracking-[-.04em] text-slate-950">{encounter.type}</h2><StatusBadge status={encounter.status} /></div><p className="mt-1 text-[10px] text-slate-500">{patient.firstName} {patient.lastName} · {patient.mrn} · {encounter.date} · {encounter.provider}</p></div></div><div className="ml-auto flex flex-wrap gap-2"><Button onClick={() => setShowAudit((current) => !current)} variant="secondary"><History className="size-4" /> Audit history</Button><Button variant="secondary"><Save className="size-4" /> Save draft</Button><Button variant="primary"><Signature className="size-4" /> Ready for review</Button></div></div>
    </section>

    <div className="grid gap-5 2xl:grid-cols-[1fr_310px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-700" /><div><p className="text-xs font-extrabold text-sky-950">AI may prepare a draft, never a final clinical note.</p><p className="mt-1 text-[10px] leading-5 text-sky-800">Provider review, signature, note locking, and any addendum remain explicit human actions. This demo does not generate diagnosis or treatment.</p></div><Button className="ml-auto hidden sm:flex" size="sm" variant="secondary"><Sparkles className="size-3.5" /> Draft summary</Button></div></div>
        <Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Stethoscope className="size-5 text-teal-700" /><div><p className="text-sm font-extrabold text-slate-950">SOAP note</p><p className="mt-0.5 text-[10px] text-slate-400">Structured fields · Autosave enabled</p></div><Button className="ml-auto" size="sm" variant="ghost">Templates <ChevronDown className="size-3.5" /></Button></div><div className="space-y-5 p-5">{structuredSections.map((section) => <label className="block" key={section.key}><span className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-500">{section.label}</span><textarea className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-6 text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50" onChange={(event) => updateField(section.key, event.target.value)} rows={section.rows} value={fields[section.key]} /></label>)}</div></Card>
        <section className="grid gap-5 lg:grid-cols-2"><Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-extrabold text-slate-950">Diagnoses · ICD-10</p></div><div className="space-y-2 p-5">{encounter.diagnoses.map((diagnosis) => <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" key={diagnosis.code}><Badge tone="sky">{diagnosis.code}</Badge><p className="text-xs font-bold text-slate-700">{diagnosis.label}</p></div>)}<Button className="mt-2" size="sm" variant="secondary"><Plus className="size-3.5" /> Add diagnosis</Button></div></Card><Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-extrabold text-slate-950">Procedures · CPT</p></div><div className="space-y-2 p-5">{encounter.procedures.map((procedure) => <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" key={procedure.code}><Badge tone="teal">{procedure.code}</Badge><p className="text-xs font-bold text-slate-700">{procedure.label}</p></div>)}<Button className="mt-2" size="sm" variant="secondary"><Plus className="size-3.5" /> Add procedure</Button></div></Card></section>
        <Card className="p-5"><div className="grid gap-5 md:grid-cols-2"><label className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">Patient instructions<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium normal-case leading-6 tracking-normal outline-none focus:border-teal-400" defaultValue="Continue the plan reviewed with the provider. Contact the office with questions or concerns." /></label><label className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">Follow-up plan<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium normal-case leading-6 tracking-normal outline-none focus:border-teal-400" defaultValue={encounter.followUp} /></label></div></Card>
      </div>

      {showAudit && <aside className="space-y-5"><Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="text-sm font-extrabold text-slate-950">Encounter status</p></div><div className="space-y-4 p-4">{[["Draft created", "Nadja R., NP · 9:06 AM", true], ["Required fields", "6 of 8 complete", false], ["Coding review", "Not started", false], ["Provider signature", "Required", false], ["Note lock", "After signature", false]].map(([label, detail, complete]) => <div className="flex gap-3" key={String(label)}><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${complete ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"}`}>{complete ? <Check className="size-3.5" /> : <Clock3 className="size-3.5" />}</span><div><p className="text-[10px] font-extrabold text-slate-800">{label}</p><p className="mt-1 text-[9px] text-slate-400">{detail}</p></div></div>)}</div></Card><Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="text-sm font-extrabold text-slate-950">Audit history</p></div><div className="space-y-5 p-4">{[["Encounter opened", "Nadja R., NP", "9:06 AM"], ["Vitals imported", "Medical Assistant", "9:02 AM"], ["Medication list reconciled", "Nadja R., NP", "9:11 AM"], ["Autosave checkpoint", "System", "Just now"]].map(([action, actor, time], index) => <div className="relative flex gap-3" key={action}><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${index === 3 ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}><FileClock className="size-3.5" /></span><div><p className="text-[10px] font-extrabold text-slate-800">{action}</p><p className="mt-1 text-[9px] text-slate-400">{actor} · {time}</p></div></div>)}</div></Card><Card className="bg-slate-950 p-5 text-white"><LockKeyhole className="size-5 text-lime-300" /><p className="mt-4 text-sm font-extrabold">Signing is final.</p><p className="mt-2 text-[10px] leading-5 text-slate-400">After signature, the note locks. Corrections require a timestamped addendum; the original content remains preserved.</p><Button className="mt-4 w-full border-white/15 bg-white/10 text-white" disabled size="sm" variant="secondary"><UserCheck className="size-3.5" /> Sign & lock note</Button></Card></aside>}
    </div>
  </div>;
}
