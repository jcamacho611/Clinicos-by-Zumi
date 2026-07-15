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
import { qualityGaps } from "@/lib/clinic-data";
import type { Encounter, LabResult, Patient, PatientImagingResult, TimelineEvent } from "@/lib/types";
import { SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";

const tabs = ["Summary", "Timeline", "Encounters", "Notes", "Medications", "Allergies", "Problems", "Vitals", "Labs", "Imaging", "Documents", "Referrals", "Billing", "Messages", "Quality", "Cases"];

const timelineIcons = { encounter: Stethoscope, lab: FlaskConical, imaging: ImageIcon, message: MessageSquareText, document: FileText, billing: CircleDollarSign, task: ClipboardPlus };

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PatientChart({ encounters, imagingResults, labResults, patient }: { encounters: Encounter[]; imagingResults: PatientImagingResult[]; labResults: LabResult[]; patient: Patient }) {
  const openEncounter = encounters.find((encounter) => encounter.status === "Draft" || encounter.status === "Ready for Review");
  const timeline = buildPatientTimeline(encounters, labResults, imagingResults);
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
      <Tabs.Content className="mt-5 outline-none" value="Summary"><SummaryTab imagingResults={imagingResults} labResults={labResults} patient={patient} timeline={timeline} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Timeline"><TimelineList events={timeline} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Encounters"><EncountersTab encounters={encounters} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Notes"><GenericList title="Clinical notes" items={["Diabetes follow-up note - Draft", "Annual physical - Signed", "Telephone encounter - Signed"]} icon={<FileText className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Medications"><ClinicalList title="Active medications" items={patient.medications} action="Medication reconciliation" icon={<Pill className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Allergies"><ClinicalList title="Allergies and reactions" items={patient.allergies} action="Add allergy" icon={<AlertTriangle className="size-5" />} warning /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Problems"><ClinicalList title="Active problem list" items={patient.problems} action="Add problem" icon={<HeartPulse className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Vitals"><VitalsTab /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Labs"><LabsTab results={labResults} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Imaging"><ImagingTab results={imagingResults} /></Tabs.Content>
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

function SummaryTab({ imagingResults, labResults, patient, timeline }: { imagingResults: PatientImagingResult[]; labResults: LabResult[]; patient: Patient; timeline: TimelineEvent[] }) {
  const labReview = labResults.find((result) => result.reviewStatus === "Needs Review");
  const imagingReview = imagingResults.find((result) => result.status === "needs_review");
  const reviewTitle = imagingReview ? `Review ${imagingReview.title} before the next clinical action.` : labReview ? `Review ${labReview.panel} before the next clinical action.` : "No laboratory or imaging result is waiting for provider review.";
  const reviewDetail = imagingReview ? `${imagingReview.facility} source report is held from the portal${imagingReview.urgentSourceFlag ? " and carries an urgent source flag" : ""}. ClinicOS has not interpreted the report.` : labReview ? `${labReview.vendor} source data is held from the portal${labReview.critical ? " and carries a critical source flag" : ""}. ClinicOS has not interpreted the result.` : "Released and reviewed source results remain available in this patient's longitudinal record.";
  return <div className="grid gap-5 xl:grid-cols-[.72fr_1.1fr_.68fr]">
    <div className="space-y-5"><SectionCard title="Clinical snapshot"><div className="space-y-5 p-5"><SnapshotGroup icon={<Pill className="size-4" />} label="Medications" values={patient.medications} /><SnapshotGroup icon={<AlertTriangle className="size-4" />} label="Allergies" values={patient.allergies} warning /><SnapshotGroup icon={<HeartPulse className="size-4" />} label="Problems" values={patient.problems} /></div></SectionCard><SectionCard title="Contact & preferences"><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1"><HeaderFact label="Phone" value={patient.phone} /><HeaderFact label="Email" value={patient.email} /><HeaderFact label="Language" value={patient.preferredLanguage} /><HeaderFact label="Location" value={patient.location} /></div></SectionCard></div>
    <SectionCard title="Clinical timeline" description="This patient&apos;s encounters, laboratory results, and source imaging reports in sequence." action={<Button size="sm" variant="ghost">Full timeline <ArrowRight className="size-3.5" /></Button>}><TimelineList events={timeline} /></SectionCard>
    <div className="space-y-5"><Card className="bg-slate-950 p-5 text-white"><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-lime-300">Provider queue</p><p className="mt-4 text-lg font-extrabold tracking-[-.03em]">{reviewTitle}</p><p className="mt-2 text-[10px] leading-5 text-slate-400">{reviewDetail}</p><Button asChild className="mt-5 w-full bg-white text-slate-950 hover:bg-slate-100" size="sm" variant="secondary"><Link href={imagingReview ? "/imaging" : "/labs"}>{imagingReview ? "Open imaging worklist" : "Open laboratory worklist"}</Link></Button></Card><SectionCard title="Open care gaps"><div className="space-y-3 p-4">{qualityGaps.filter((gap) => gap.patient === `${patient.firstName} ${patient.lastName}`).map((gap) => <div className="rounded-xl bg-amber-50 p-3" key={gap.id}><p className="text-xs font-extrabold text-amber-950">{gap.measure}</p><p className="mt-1 text-[9px] text-amber-700">{gap.due}</p><StatusBadge status={gap.status} /></div>)}<div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-extrabold text-slate-800">Depression screening</p><p className="mt-1 text-[9px] text-slate-500">Due at next annual visit</p></div></div></SectionCard></div>
  </div>;
}

function SnapshotGroup({ icon, label, values, warning }: { icon: React.ReactNode; label: string; values: string[]; warning?: boolean }) { return <div><div className="flex items-center gap-2 text-slate-500">{icon}<p className="text-[9px] font-extrabold uppercase tracking-[.14em]">{label}</p></div><div className="mt-2 space-y-1.5">{values.map((value) => <p className={`rounded-lg px-3 py-2 text-[10px] font-bold ${warning ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-700"}`} key={value}>{value}</p>)}</div></div>; }

function TimelineList({ events }: { events: TimelineEvent[] }) {
  return <div className="p-5">{events.length > 0 ? <div className="relative space-y-6 before:absolute before:bottom-3 before:left-[18px] before:top-3 before:w-px before:bg-slate-200">{events.map((event) => <TimelineRow event={event} key={event.id} />)}</div> : <p className="text-xs text-slate-500">No longitudinal events are recorded for this patient.</p>}</div>;
}

function buildPatientTimeline(encounters: Encounter[], labResults: LabResult[], imagingResults: PatientImagingResult[]): TimelineEvent[] {
  const labEvents = labResults.map((result) => ({
    event: {
      id: `lab-${result.id}`,
      type: "lab" as const,
      title: `${result.panel} result received`,
      detail: `${result.vendor} source data${result.abnormalCount ? ` contains ${result.abnormalCount} abnormal flag${result.abnormalCount === 1 ? "" : "s"}` : " has no abnormal source flags"}${result.critical ? " and is source flagged critical" : ""}.`,
      timestamp: formatTimelineDate(result.resultedAt),
      status: result.reviewStatus,
    },
    sortAt: new Date(result.resultedAt).getTime(),
  }));
  const imagingEvents = imagingResults.map((result) => ({
    event: {
      id: `imaging-${result.id}`,
      type: "imaging" as const,
      title: result.title,
      detail: `${result.facility} source report · ${result.modality.toUpperCase()} · ${result.bodyPart}${result.urgentSourceFlag ? " · urgent source flag" : ""}. ClinicOS has not interpreted this report.`,
      timestamp: formatTimelineDate(result.studyPerformedAt),
      status: titleCase(result.status),
    },
    sortAt: new Date(result.studyPerformedAt).getTime(),
  }));
  const encounterEvents = encounters.map((encounter) => ({
    event: {
      id: `encounter-${encounter.id}`,
      type: "encounter" as const,
      title: encounter.type,
      detail: encounter.chiefComplaint || "Clinical encounter recorded.",
      timestamp: formatTimelineDate(encounter.date),
      status: encounter.status,
    },
    sortAt: new Date(encounter.date).getTime(),
  }));
  return [...labEvents, ...imagingEvents, ...encounterEvents]
    .sort((left, right) => right.sortAt - left.sortAt)
    .map(({ event }) => event);
}

function formatTimelineDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function TimelineRow({ event }: { event: TimelineEvent }) { const Icon = timelineIcons[event.type]; return <div className="relative flex gap-4"><span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-xl ring-4 ring-white ${event.type === "lab" ? "bg-rose-50 text-rose-700" : event.type === "imaging" ? "bg-indigo-50 text-indigo-700" : event.type === "encounter" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{event.title}</p>{event.status && <StatusBadge status={event.status} />}</div><p className="mt-1 text-[10px] leading-5 text-slate-500">{event.detail}</p><p className="mt-1 text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">{event.timestamp}</p></div></div>; }

function EncountersTab({ encounters }: { encounters: Encounter[] }) { return <SectionCard title="Encounter history" action={<Button disabled size="sm" title="Encounter creation is not connected yet" variant="primary"><Plus className="size-3.5" /> New encounter</Button>}><div className="divide-y divide-slate-100">{encounters.length > 0 ? encounters.map((encounter) => <Link className="flex items-center gap-4 p-5 hover:bg-slate-50" href={`/encounters/${encounter.id}`} key={encounter.id}><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Stethoscope className="size-5" /></span><div className="flex-1"><p className="text-xs font-extrabold text-slate-900">{encounter.type}</p><p className="mt-1 text-[10px] text-slate-400">{encounter.date} · {encounter.provider}</p></div><StatusBadge status={encounter.status} /><ChevronRight className="size-4 text-slate-300" /></Link>) : <p className="p-5 text-xs text-slate-500">No encounters are recorded for this patient.</p>}</div></SectionCard>; }

function ClinicalList({ title, items, action, icon, warning }: { title: string; items: string[]; action: string; icon: React.ReactNode; warning?: boolean }) { return <SectionCard title={title} action={<Button size="sm" variant="primary"><Plus className="size-3.5" /> {action}</Button>}><div className="grid gap-3 p-5 md:grid-cols-2">{items.map((item) => <div className={`flex items-center gap-3 rounded-xl border p-4 ${warning ? "border-rose-200 bg-rose-50" : "border-slate-200"}`} key={item}><span className={warning ? "text-rose-700" : "text-teal-700"}>{icon}</span><p className="text-xs font-bold text-slate-800">{item}</p></div>)}</div></SectionCard>; }

function GenericList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) { return <SectionCard title={title}><div className="divide-y divide-slate-100">{items.map((item) => <div className="flex items-center gap-3 p-5" key={item}><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700">{icon}</span><p className="flex-1 text-xs font-extrabold text-slate-800">{item}</p><ChevronRight className="size-4 text-slate-300" /></div>)}</div></SectionCard>; }

function VitalsTab() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Blood pressure", "132/84", "mmHg"], ["Heart rate", "76", "bpm"], ["Weight", "171", "lb"], ["BMI", "29.4", "kg/m²"], ["Temperature", "98.4", "°F"], ["Oxygen", "98", "%"]].map(([label, value, unit]) => <Card className="p-5" key={label}><Activity className="size-4 text-teal-700" /><p className="mt-5 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{value} <span className="text-[10px] font-bold text-slate-400">{unit}</span></p><p className="mt-2 text-[9px] text-slate-400">Jul 14, 2026 · 9:02 AM</p></Card>)}</div>; }

function LabsTab({ results }: { results: LabResult[] }) {
  return <SectionCard title="Laboratory history" description="Organization-scoped source results, corrections, review state, and patient-release status." action={<Button asChild size="sm" variant="secondary"><Link href="/labs">Open lab worklist <ArrowRight className="size-3.5" /></Link></Button>}><div className="space-y-4 p-5">{results.length ? results.map((result) => <div className={`rounded-2xl border p-5 ${result.critical ? "border-rose-300 bg-rose-50/50" : "border-slate-200"}`} key={result.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${result.critical ? "bg-rose-600 text-white" : "bg-cyan-50 text-cyan-700"}`}><FlaskConical className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{result.panel}</p>{result.version > 1 && <Badge tone="amber">Version {result.version}</Badge>}{result.correctionOfId && <Badge tone="amber">Correction</Badge>}{result.critical && <Badge tone="rose">Source flagged critical</Badge>}</div><p className="mt-1 text-[10px] text-slate-500">{result.vendor} · {formatLabDate(result.resultedAt)} · {result.source}{result.sourceReference ? ` · ${result.sourceReference}` : ""}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={result.reviewStatus} /><Badge tone={result.patientVisible ? "teal" : "slate"}>{result.patientVisible ? "Released to portal" : "Held from portal"}</Badge><Badge tone={result.abnormalCount ? "rose" : "teal"}>{result.abnormalCount} abnormal</Badge></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{result.items.map((item) => <div className={`rounded-xl p-3 ${item.critical ? "bg-rose-100" : "bg-slate-50"}`} key={item.id}><div className="flex items-start justify-between gap-2"><p className="text-[9px] font-bold text-slate-500">{item.name}</p>{item.critical && <Badge tone="rose">Critical source flag</Badge>}</div><p className="mt-2 text-sm font-extrabold text-slate-900">{item.value}{item.unit ? ` ${item.unit}` : ""}</p>{item.range && <p className="mt-1 text-[9px] text-slate-500">Reference {item.range}</p>}{item.flag && <Badge className="mt-2" tone={item.critical ? "rose" : "amber"}>{item.flag.replaceAll("_", " ")}</Badge>}</div>)}</div></div>) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><FlaskConical className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-700">No laboratory results recorded</p><p className="mt-1 text-[10px] text-slate-500">Received results will appear here after organization and patient validation.</p></div>}</div></SectionCard>;
}

function ImagingTab({ results }: { results: PatientImagingResult[] }) {
  return <SectionCard title="Imaging history" description="Organization-scoped source reports, provider review state, portal visibility, and correction lineage." action={<Button asChild size="sm" variant="secondary"><Link href="/imaging">Open imaging worklist <ArrowRight className="size-3.5" /></Link></Button>}><div className="space-y-4 p-5">{results.length ? results.map((result) => <article className={`overflow-hidden rounded-2xl border ${result.urgentSourceFlag && result.status === "needs_review" ? "border-rose-300 bg-rose-50/30" : "border-indigo-100 bg-white"}`} key={result.id}><div className="grid sm:grid-cols-[112px_1fr]"><div className="relative grid min-h-28 place-items-center overflow-hidden bg-[#071334] text-blue-200"><div className="absolute size-20 rounded-full border border-blue-300/20" /><ImageIcon className="relative size-7" /><span className="absolute bottom-2 text-[8px] font-black uppercase tracking-[.14em] text-blue-300/60">{result.modality}</span></div><div className="p-4"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-950">{result.title}</p><StatusBadge status={titleCase(result.status)} />{result.version > 1 && <Badge tone="amber">Version {result.version}</Badge>}{result.correctionOfId && <Badge tone="amber">Correction</Badge>}{result.urgentSourceFlag && <Badge tone="rose">Urgent source flag</Badge>}</div><p className="mt-1 text-[10px] text-slate-500">{result.study} · {titleCase(result.modality)} · {result.bodyPart}</p><p className="mt-1 text-[9px] text-slate-400">{result.facility} · {formatTimelineDate(result.studyPerformedAt)} · {result.source}{result.sourceReference ? ` · ${result.sourceReference}` : ""}</p></div><Badge tone={result.patientVisible ? "teal" : "slate"}>{result.patientVisible ? "Portal visible" : "Portal held"}</Badge></div>{(result.findings || result.impression) && <div className="mt-3 grid gap-2 lg:grid-cols-2">{result.findings && <div className="rounded-xl bg-indigo-50/60 p-3"><p className="text-[8px] font-black uppercase tracking-[.13em] text-indigo-600">Source findings</p><p className="mt-2 text-[10px] leading-5 text-slate-700">{result.findings}</p></div>}{result.impression && <div className="rounded-xl bg-indigo-50/60 p-3"><p className="text-[8px] font-black uppercase tracking-[.13em] text-indigo-600">Source impression</p><p className="mt-2 text-[10px] leading-5 text-slate-700">{result.impression}</p></div>}</div>}<p className="mt-3 text-[9px] text-slate-400">Source content only. ClinicOS has not interpreted this report.</p></div></div></article>) : <div className="rounded-2xl border border-dashed border-indigo-200 p-8 text-center"><ImageIcon className="mx-auto size-6 text-indigo-300" /><p className="mt-3 text-xs font-bold text-slate-700">No imaging reports recorded</p><p className="mt-1 text-[10px] text-slate-500">Validated source reports will appear here after receipt.</p></div>}</div></SectionCard>;
}

function formatLabDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function BillingTab({ patient }: { patient: Patient }) { return <div className="grid gap-5 lg:grid-cols-3"><Card className="bg-slate-950 p-6 text-white"><p className="text-[9px] font-bold text-slate-400">PATIENT BALANCE</p><p className="mt-3 text-4xl font-extrabold">${patient.balance}</p><Button className="mt-6 w-full bg-white text-slate-950" variant="secondary">Create payment link</Button></Card><Card className="p-6"><p className="text-[9px] font-bold text-slate-400">PRIMARY COVERAGE</p><p className="mt-3 text-lg font-extrabold text-slate-950">{patient.insurance}</p><p className="mt-1 text-xs text-slate-500">{patient.plan}</p><StatusBadge status="Verified" /></Card><Card className="p-6"><p className="text-[9px] font-bold text-slate-400">LATEST CLAIM</p><p className="mt-3 text-lg font-extrabold text-slate-950">CLM-72014</p><p className="mt-1 text-xs text-slate-500">$224 · Jun 18, 2026</p><StatusBadge status="Ready for review" /></Card></div>; }

function QualityTab({ patient }: { patient: Patient }) { return <SectionCard title="Care gaps and measures"><div className="grid gap-3 p-5 md:grid-cols-2">{qualityGaps.filter((gap) => gap.patient === `${patient.firstName} ${patient.lastName}`).map((gap) => <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" key={gap.id}><div className="flex items-center gap-2"><Syringe className="size-4 text-amber-700" /><p className="text-xs font-extrabold text-amber-950">{gap.measure}</p></div><p className="mt-2 text-[10px] text-amber-800">{gap.due}</p><StatusBadge status={gap.status} /></div>)}</div></SectionCard>; }
