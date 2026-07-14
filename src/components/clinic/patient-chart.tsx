"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, ChevronRight,
  CircleDollarSign, ClipboardPlus, FileText, FlaskConical, HeartPulse, Image as ImageIcon,
  Mail, MessageSquareText, MoreHorizontal, Pill, Plus, Printer, ShieldAlert,
  ShieldCheck, Stethoscope, Syringe, UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { labResults, patientTimeline, qualityGaps } from "@/lib/clinic-data";
import type { Encounter, Patient, TimelineEvent } from "@/lib/types";
import { SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";

const tabs = ["Summary", "Timeline", "Encounters", "Notes", "Medications", "Allergies", "Problems", "Vitals", "Labs", "Imaging", "Documents", "Referrals", "Billing", "Messages", "Quality", "Cases"];

const timelineIcons = { encounter: Stethoscope, lab: FlaskConical, message: MessageSquareText, document: FileText, billing: CircleDollarSign, task: ClipboardPlus };

export function PatientChart({ encounters, patient }: { encounters: Encounter[]; patient: Patient }) {
  const openEncounter = encounters.find((encounter) => encounter.status === "Draft" || encounter.status === "Ready for Review");
  return <div className="space-y-5">
    <Link className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-950" href="/patients"><ArrowLeft className="size-4" /> Back to patient charts</Link>
    <section className="sticky top-[94px] z-20 rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,.08)] backdrop-blur-xl">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 text-sm font-extrabold text-teal-800">{patient.initials}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-extrabold tracking-[-.045em] text-slate-950">{patient.firstName} {patient.lastName}</h2><StatusBadge status={patient.riskLevel} /><StatusBadge status={`Portal ${patient.portalStatus}`} /></div><p className="mt-1 text-[10px] font-semibold text-slate-500">DOB {patient.dob} · {patient.age} years · {patient.sex} · {patient.pronouns} · MRN {patient.mrn}</p></div></div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 xl:ml-5"><HeaderFact label="Coverage" value={patient.insurance} /><HeaderFact label="Provider" value={patient.provider} /><HeaderFact label="Next visit" value={patient.nextAppointment} /><HeaderFact label="Balance" value={`$${patient.balance}`} /></div>
        <div className="flex gap-2"><Button size="icon" variant="secondary" aria-label="Print chart"><Printer className="size-4" /></Button><Button size="icon" variant="secondary" aria-label="More actions"><MoreHorizontal className="size-4" /></Button>{openEncounter ? <Button asChild variant="primary"><Link href={`/encounters/${openEncounter.id}`}><ClipboardPlus className="size-4" /> Open encounter</Link></Button> : <Button disabled title="Encounter creation is not connected yet" variant="primary"><ClipboardPlus className="size-4" /> New encounter</Button>}</div>
      </div>
      {patient.riskFlags.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-rose-600"><ShieldAlert className="size-3.5" /> Chart flags</span>{patient.riskFlags.map((flag) => <Badge key={flag} tone="rose">{flag}</Badge>)}</div>}
    </section>

    <Tabs.Root defaultValue="Summary">
      <div className="overflow-x-auto"><Tabs.List className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">{tabs.map((tab) => <Tabs.Trigger className="rounded-xl px-3 py-2 text-[10px] font-bold text-slate-500 outline-none transition hover:bg-slate-50 data-[state=active]:bg-slate-950 data-[state=active]:text-white" key={tab} value={tab}>{tab}</Tabs.Trigger>)}</Tabs.List></div>
      <Tabs.Content className="mt-5 outline-none" value="Summary"><SummaryTab patient={patient} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Timeline"><TimelineList full /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Encounters"><EncountersTab encounters={encounters} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Notes"><GenericList title="Clinical notes" items={["Diabetes follow-up note - Draft", "Annual physical - Signed", "Telephone encounter - Signed"]} icon={<FileText className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Medications"><ClinicalList title="Active medications" items={patient.medications} action="Medication reconciliation" icon={<Pill className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Allergies"><ClinicalList title="Allergies and reactions" items={patient.allergies} action="Add allergy" icon={<AlertTriangle className="size-5" />} warning /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Problems"><ClinicalList title="Active problem list" items={patient.problems} action="Add problem" icon={<HeartPulse className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Vitals"><VitalsTab /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Labs"><LabsTab patient={patient} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Imaging"><GenericList title="Imaging history" items={["Chest X-ray - Report received", "MRI lumbar spine - Reviewed"]} icon={<ImageIcon className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Documents"><GenericList title="Chart documents" items={["Insurance card - Verified", "HIPAA acknowledgment - Signed", "Telemedicine consent - Signed"]} icon={<FileText className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Referrals"><GenericList title="Referrals" items={["Endocrinology - Sent Jun 18", "Nutrition services - Scheduled"]} icon={<UsersRound className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Billing"><BillingTab patient={patient} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Messages"><GenericList title="Patient messages" items={["Lab result question - Routed to provider", "Appointment confirmation - Delivered"]} icon={<Mail className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Quality"><QualityTab patient={patient} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Cases"><GenericList title="No-fault / workers' comp cases" items={["No active cases for this demo patient"]} icon={<ShieldCheck className="size-5" />} /></Tabs.Content>
    </Tabs.Root>
  </div>;
}

function HeaderFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 truncate text-[10px] font-bold text-slate-700">{value}</p></div>; }

function SummaryTab({ patient }: { patient: Patient }) {
  return <div className="grid gap-5 xl:grid-cols-[.72fr_1.1fr_.68fr]">
    <div className="space-y-5"><SectionCard title="Clinical snapshot"><div className="space-y-5 p-5"><SnapshotGroup icon={<Pill className="size-4" />} label="Medications" values={patient.medications} /><SnapshotGroup icon={<AlertTriangle className="size-4" />} label="Allergies" values={patient.allergies} warning /><SnapshotGroup icon={<HeartPulse className="size-4" />} label="Problems" values={patient.problems} /></div></SectionCard><SectionCard title="Contact & preferences"><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1"><HeaderFact label="Phone" value={patient.phone} /><HeaderFact label="Email" value={patient.email} /><HeaderFact label="Language" value={patient.preferredLanguage} /><HeaderFact label="Location" value={patient.location} /></div></SectionCard></div>
    <SectionCard title="Clinical timeline" description="Encounters, results, documents, messages, billing, and tasks in sequence." action={<Button size="sm" variant="ghost">Full timeline <ArrowRight className="size-3.5" /></Button>}><TimelineList /></SectionCard>
    <div className="space-y-5"><Card className="bg-slate-950 p-5 text-white"><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-lime-300">Pre-visit brief</p><p className="mt-4 text-lg font-extrabold tracking-[-.03em]">Review A1C before today&apos;s visit.</p><p className="mt-2 text-[10px] leading-5 text-slate-400">The result is held from portal release and a patient question is waiting in the provider queue.</p><Button className="mt-5 w-full bg-white text-slate-950 hover:bg-slate-100" size="sm" variant="secondary">Open provider review</Button></Card><SectionCard title="Open care gaps"><div className="space-y-3 p-4">{qualityGaps.filter((gap) => gap.patient === `${patient.firstName} ${patient.lastName}`).map((gap) => <div className="rounded-xl bg-amber-50 p-3" key={gap.id}><p className="text-xs font-extrabold text-amber-950">{gap.measure}</p><p className="mt-1 text-[9px] text-amber-700">{gap.due}</p><StatusBadge status={gap.status} /></div>)}<div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-extrabold text-slate-800">Depression screening</p><p className="mt-1 text-[9px] text-slate-500">Due at next annual visit</p></div></div></SectionCard></div>
  </div>;
}

function SnapshotGroup({ icon, label, values, warning }: { icon: React.ReactNode; label: string; values: string[]; warning?: boolean }) { return <div><div className="flex items-center gap-2 text-slate-500">{icon}<p className="text-[9px] font-extrabold uppercase tracking-[.14em]">{label}</p></div><div className="mt-2 space-y-1.5">{values.map((value) => <p className={`rounded-lg px-3 py-2 text-[10px] font-bold ${warning ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-700"}`} key={value}>{value}</p>)}</div></div>; }

function TimelineList({ full }: { full?: boolean }) {
  const events = full ? [...patientTimeline, ...patientTimeline] : patientTimeline;
  return <div className="p-5"><div className="relative space-y-6 before:absolute before:bottom-3 before:left-[18px] before:top-3 before:w-px before:bg-slate-200">{events.map((event, index) => <TimelineRow event={event} key={`${event.id}-${index}`} />)}</div></div>;
}

function TimelineRow({ event }: { event: TimelineEvent }) { const Icon = timelineIcons[event.type]; return <div className="relative flex gap-4"><span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-xl ring-4 ring-white ${event.type === "lab" ? "bg-rose-50 text-rose-700" : event.type === "encounter" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{event.title}</p>{event.status && <StatusBadge status={event.status} />}</div><p className="mt-1 text-[10px] leading-5 text-slate-500">{event.detail}</p><p className="mt-1 text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">{event.timestamp}</p></div></div>; }

function EncountersTab({ encounters }: { encounters: Encounter[] }) { return <SectionCard title="Encounter history" action={<Button disabled size="sm" title="Encounter creation is not connected yet" variant="primary"><Plus className="size-3.5" /> New encounter</Button>}><div className="divide-y divide-slate-100">{encounters.length > 0 ? encounters.map((encounter) => <Link className="flex items-center gap-4 p-5 hover:bg-slate-50" href={`/encounters/${encounter.id}`} key={encounter.id}><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Stethoscope className="size-5" /></span><div className="flex-1"><p className="text-xs font-extrabold text-slate-900">{encounter.type}</p><p className="mt-1 text-[10px] text-slate-400">{encounter.date} · {encounter.provider}</p></div><StatusBadge status={encounter.status} /><ChevronRight className="size-4 text-slate-300" /></Link>) : <p className="p-5 text-xs text-slate-500">No encounters are recorded for this patient.</p>}</div></SectionCard>; }

function ClinicalList({ title, items, action, icon, warning }: { title: string; items: string[]; action: string; icon: React.ReactNode; warning?: boolean }) { return <SectionCard title={title} action={<Button size="sm" variant="primary"><Plus className="size-3.5" /> {action}</Button>}><div className="grid gap-3 p-5 md:grid-cols-2">{items.map((item) => <div className={`flex items-center gap-3 rounded-xl border p-4 ${warning ? "border-rose-200 bg-rose-50" : "border-slate-200"}`} key={item}><span className={warning ? "text-rose-700" : "text-teal-700"}>{icon}</span><p className="text-xs font-bold text-slate-800">{item}</p></div>)}</div></SectionCard>; }

function GenericList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) { return <SectionCard title={title}><div className="divide-y divide-slate-100">{items.map((item) => <div className="flex items-center gap-3 p-5" key={item}><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700">{icon}</span><p className="flex-1 text-xs font-extrabold text-slate-800">{item}</p><ChevronRight className="size-4 text-slate-300" /></div>)}</div></SectionCard>; }

function VitalsTab() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Blood pressure", "132/84", "mmHg"], ["Heart rate", "76", "bpm"], ["Weight", "171", "lb"], ["BMI", "29.4", "kg/m²"], ["Temperature", "98.4", "°F"], ["Oxygen", "98", "%"]].map(([label, value, unit]) => <Card className="p-5" key={label}><Activity className="size-4 text-teal-700" /><p className="mt-5 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{value} <span className="text-[10px] font-bold text-slate-400">{unit}</span></p><p className="mt-2 text-[9px] text-slate-400">Jul 14, 2026 · 9:02 AM</p></Card>)}</div>; }

function LabsTab({ patient }: { patient: Patient }) { const results = labResults.filter((result) => result.patientId === patient.id); return <SectionCard title="Lab results"><div className="space-y-4 p-5">{results.length ? results.map((result) => <div className="rounded-2xl border border-slate-200 p-5" key={result.id}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><FlaskConical className="size-5" /></span><div><p className="text-xs font-extrabold text-slate-900">{result.panel}</p><p className="mt-1 text-[10px] text-slate-400">{result.vendor} · {result.resultedAt}</p></div><div className="ml-auto flex gap-2"><StatusBadge status={result.reviewStatus} /><Badge tone={result.abnormalCount ? "rose" : "teal"}>{result.abnormalCount} abnormal</Badge></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{result.items.map((item) => <div className="rounded-xl bg-slate-50 p-3" key={item.name}><p className="text-[9px] font-bold text-slate-400">{item.name}</p><p className="mt-2 text-sm font-extrabold text-slate-900">{item.value} {item.unit}</p>{item.flag && <Badge className="mt-2" tone="rose">{item.flag}</Badge>}</div>)}</div></div>) : <p className="text-xs text-slate-500">No demo lab results for this patient.</p>}</div></SectionCard>; }

function BillingTab({ patient }: { patient: Patient }) { return <div className="grid gap-5 lg:grid-cols-3"><Card className="bg-slate-950 p-6 text-white"><p className="text-[9px] font-bold text-slate-400">PATIENT BALANCE</p><p className="mt-3 text-4xl font-extrabold">${patient.balance}</p><Button className="mt-6 w-full bg-white text-slate-950" variant="secondary">Create payment link</Button></Card><Card className="p-6"><p className="text-[9px] font-bold text-slate-400">PRIMARY COVERAGE</p><p className="mt-3 text-lg font-extrabold text-slate-950">{patient.insurance}</p><p className="mt-1 text-xs text-slate-500">{patient.plan}</p><StatusBadge status="Verified" /></Card><Card className="p-6"><p className="text-[9px] font-bold text-slate-400">LATEST CLAIM</p><p className="mt-3 text-lg font-extrabold text-slate-950">CLM-72014</p><p className="mt-1 text-xs text-slate-500">$224 · Jun 18, 2026</p><StatusBadge status="Ready for review" /></Card></div>; }

function QualityTab({ patient }: { patient: Patient }) { return <SectionCard title="Care gaps and measures"><div className="grid gap-3 p-5 md:grid-cols-2">{qualityGaps.filter((gap) => gap.patient === `${patient.firstName} ${patient.lastName}`).map((gap) => <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" key={gap.id}><div className="flex items-center gap-2"><Syringe className="size-4 text-amber-700" /><p className="text-xs font-extrabold text-amber-950">{gap.measure}</p></div><p className="mt-2 text-[10px] text-amber-800">{gap.due}</p><StatusBadge status={gap.status} /></div>)}</div></SectionCard>; }
