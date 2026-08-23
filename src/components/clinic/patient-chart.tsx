"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, ChevronRight,
  CircleDollarSign, ClipboardCheck, ClipboardPlus, Download, Eye, FileText, FlaskConical, HeartPulse, Image as ImageIcon,
  Mail, MessageSquareText, MoreHorizontal, Pill, Plus, Printer, ShieldAlert,
  ShieldCheck, Stethoscope, Syringe, UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { qualityGaps } from "@/lib/clinic-data";
import { vitalHasMeasurement, type PatientVital } from "@/lib/clinical/vital-types";
import type { Encounter, LabResult, Patient, PatientConsentSummary, PatientDocument, PatientFormSubmission, PatientImagingResult, TimelineEvent } from "@/lib/types";
import type { PatientMedicationHistory } from "@/lib/repositories/medication-repository";
import { SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";

const tabs = ["Summary", "Timeline", "Encounters", "Notes", "Medications", "Allergies", "Problems", "Vitals", "Labs", "Imaging", "Documents", "Forms", "Consents", "Referrals", "Billing", "Messages", "Quality", "Cases"];

const timelineIcons = { encounter: Stethoscope, lab: FlaskConical, imaging: ImageIcon, medication: Pill, message: MessageSquareText, document: FileText, form: ClipboardCheck, billing: CircleDollarSign, task: ClipboardPlus };

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PatientChart({ consents, documentPermissions, documents, encounters, formSubmissions, imagingResults, labResults, medicationHistory, medicationPermissions, patient, vitals }: { consents: PatientConsentSummary[]; documentPermissions: { canManage: boolean; canUpdate: boolean }; documents: PatientDocument[]; encounters: Encounter[]; formSubmissions: PatientFormSubmission[]; imagingResults: PatientImagingResult[]; labResults: LabResult[]; medicationHistory: PatientMedicationHistory; medicationPermissions: { canCreate: boolean; canSign: boolean; canUpdate: boolean }; patient: Patient; vitals: PatientVital[] }) {
  const openEncounter = encounters.find((encounter) => encounter.status === "Draft" || encounter.status === "Ready for Review");
  const timeline = buildPatientTimeline(encounters, labResults, imagingResults, medicationHistory, documents, formSubmissions);
  return <div className="space-y-5">
    <Link className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-950" href="/patients"><ArrowLeft className="size-4" /> Back to patient charts</Link>
    <section className="sticky top-[94px] z-20 rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,.08)] backdrop-blur-xl">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 text-sm font-extrabold text-teal-800">{patient.initials}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-extrabold tracking-[-.045em] text-slate-950">{patient.firstName} {patient.lastName}</h2><StatusBadge status={patient.riskLevel} /><StatusBadge status={`Portal ${patient.portalStatus}`} /></div><p className="mt-1 text-[12px] font-semibold text-slate-500">DOB {patient.dob} · {patient.age} years · {patient.sex} · {patient.pronouns} · MRN {patient.mrn}</p></div></div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 xl:ml-5"><HeaderFact label="Coverage" value={patient.insurance} /><HeaderFact label="Provider" value={patient.provider} /><HeaderFact label="Next visit" value={patient.nextAppointment} /><HeaderFact label="Balance" value={`$${patient.balance}`} /></div>
        <div className="flex gap-2"><Button size="icon" variant="secondary" aria-label="Print chart"><Printer className="size-4" /></Button><Button size="icon" variant="secondary" aria-label="More actions"><MoreHorizontal className="size-4" /></Button>{openEncounter ? <Button asChild variant="primary"><Link href={`/encounters/${openEncounter.id}`}><ClipboardPlus className="size-4" /> Open encounter</Link></Button> : <Button disabled title="Encounter creation is not connected yet" variant="primary"><ClipboardPlus className="size-4" /> New encounter</Button>}</div>
      </div>
      {patient.riskFlags.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-rose-600"><ShieldAlert className="size-3.5" /> Chart flags</span>{patient.riskFlags.map((flag) => <Badge key={flag} tone="rose">{flag}</Badge>)}</div>}
    </section>

    <Tabs.Root defaultValue="Summary">
      <div className="overflow-x-auto"><Tabs.List className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">{tabs.map((tab) => <Tabs.Trigger className="rounded-xl px-3 py-2 text-[12px] font-bold text-slate-500 outline-none transition hover:bg-slate-50 data-[state=active]:bg-slate-950 data-[state=active]:text-white" key={tab} value={tab}>{tab}</Tabs.Trigger>)}</Tabs.List></div>
      <Tabs.Content className="mt-5 outline-none" value="Summary"><SummaryTab documents={documents} formSubmissions={formSubmissions} imagingResults={imagingResults} labResults={labResults} patient={patient} timeline={timeline} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Timeline"><TimelineList events={timeline} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Encounters"><EncountersTab encounters={encounters} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Notes"><GenericList title="Clinical notes" items={["Diabetes follow-up note - Draft", "Annual physical - Signed", "Telephone encounter - Signed"]} icon={<FileText className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Medications"><MedicationsTab history={medicationHistory} permissions={medicationPermissions} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Allergies"><ClinicalList title="Allergies and reactions" items={patient.allergies} action="Add allergy" icon={<AlertTriangle className="size-5" />} warning /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Problems"><ClinicalList title="Active problem list" items={patient.problems} action="Add problem" icon={<HeartPulse className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Vitals"><VitalsTab vitals={vitals} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Labs"><LabsTab results={labResults} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Imaging"><ImagingTab results={imagingResults} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Documents"><DocumentsTab canManage={documentPermissions.canManage} canUpdate={documentPermissions.canUpdate} documents={documents} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Forms"><FormsTab submissions={formSubmissions} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Consents"><ConsentsTab consents={consents} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Referrals"><GenericList title="Referrals" items={["Endocrinology - Sent Jun 18", "Nutrition services - Scheduled"]} icon={<UsersRound className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Billing"><BillingTab patient={patient} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Messages"><GenericList title="Patient messages" items={["Lab result question - Routed to provider", "Appointment confirmation - Delivered"]} icon={<Mail className="size-5" />} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Quality"><QualityTab patient={patient} /></Tabs.Content>
      <Tabs.Content className="mt-5 outline-none" value="Cases"><GenericList title="No-fault / workers' comp cases" items={["No active cases for this demo patient"]} icon={<ShieldCheck className="size-5" />} /></Tabs.Content>
    </Tabs.Root>
  </div>;
}

function HeaderFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 truncate text-[12px] font-bold text-slate-700">{value}</p></div>; }

function SummaryTab({ documents, formSubmissions, imagingResults, labResults, patient, timeline }: { documents: PatientDocument[]; formSubmissions: PatientFormSubmission[]; imagingResults: PatientImagingResult[]; labResults: LabResult[]; patient: Patient; timeline: TimelineEvent[] }) {
  const labReview = labResults.find((result) => result.reviewStatus === "Needs Review");
  const imagingReview = imagingResults.find((result) => result.status === "needs_review");
  const documentReview = documents.find((document) => document.status === "active" && document.reviewStatus === "needs_review");
  const formReview = formSubmissions.find((submission) => ["staff_review", "provider_review"].includes(submission.status));
  const reviewTitle = imagingReview ? `Review ${imagingReview.title} before the next clinical action.` : labReview ? `Review ${labReview.panel} before the next clinical action.` : formReview ? `Review ${formReview.templateName} before chart attachment.` : documentReview ? `Review ${documentReview.name} before portal release.` : "No laboratory, imaging, form, or document item is waiting for review.";
  const reviewDetail = imagingReview ? `${imagingReview.facility} source report is held from the portal${imagingReview.urgentSourceFlag ? " and carries an urgent source flag" : ""}. ClinicOS has not interpreted the report.` : labReview ? `${labReview.vendor} source data is held from the portal${labReview.critical ? " and carries a critical source flag" : ""}. ClinicOS has not interpreted the result.` : formReview ? `${formReview.templateName} version ${formReview.version} is awaiting an explicit ${formReview.status.replaceAll("_", " ")} decision.` : documentReview ? `${documentReview.category} version ${documentReview.version} is encrypted and held from the portal until an authorized human completes review.` : "Released and reviewed source records remain available in this patient's longitudinal record.";
  return <div className="grid gap-5 xl:grid-cols-[.72fr_1.1fr_.68fr]">
    <div className="space-y-5"><SectionCard title="Clinical snapshot"><div className="space-y-5 p-5"><SnapshotGroup icon={<Pill className="size-4" />} label="Medications" values={patient.medications} /><SnapshotGroup icon={<AlertTriangle className="size-4" />} label="Allergies" values={patient.allergies} warning /><SnapshotGroup icon={<HeartPulse className="size-4" />} label="Problems" values={patient.problems} /></div></SectionCard><SectionCard title="Contact & preferences"><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1"><HeaderFact label="Phone" value={patient.phone} /><HeaderFact label="Email" value={patient.email} /><HeaderFact label="Language" value={patient.preferredLanguage} /><HeaderFact label="Location" value={patient.location} /></div></SectionCard></div>
    <SectionCard title="Clinical timeline" description="This patient&apos;s encounters, laboratory results, source imaging reports, and governed documents in sequence." action={<Button size="sm" variant="ghost">Full timeline <ArrowRight className="size-3.5" /></Button>}><TimelineList events={timeline} /></SectionCard>
    <div className="space-y-5"><Card className="bg-slate-950 p-5 text-white"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-lime-300">Provider queue</p><p className="mt-4 text-lg font-extrabold tracking-[-.03em]">{reviewTitle}</p><p className="mt-2 text-[12px] leading-5 text-slate-400">{reviewDetail}</p><Button asChild className="mt-5 w-full bg-white text-slate-950 hover:bg-slate-100" size="sm" variant="secondary"><Link href={imagingReview ? "/imaging" : labReview ? "/labs" : formReview ? "/forms" : "/documents"}>{imagingReview ? "Open imaging worklist" : labReview ? "Open laboratory worklist" : formReview ? "Open form control room" : "Open document airlock"}</Link></Button></Card><SectionCard title="Open care gaps"><div className="space-y-3 p-4">{qualityGaps.filter((gap) => gap.patient === `${patient.firstName} ${patient.lastName}`).map((gap) => <div className="rounded-xl bg-amber-50 p-3" key={gap.id}><p className="text-xs font-extrabold text-amber-950">{gap.measure}</p><p className="mt-1 text-[11px] text-amber-700">{gap.due}</p><StatusBadge status={gap.status} /></div>)}<div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-extrabold text-slate-800">Depression screening</p><p className="mt-1 text-[11px] text-slate-500">Due at next annual visit</p></div></div></SectionCard></div>
  </div>;
}

function SnapshotGroup({ icon, label, values, warning }: { icon: React.ReactNode; label: string; values: string[]; warning?: boolean }) { return <div><div className="flex items-center gap-2 text-slate-500">{icon}<p className="text-[11px] font-extrabold uppercase tracking-[.14em]">{label}</p></div><div className="mt-2 space-y-1.5">{values.map((value) => <p className={`rounded-lg px-3 py-2 text-[12px] font-bold ${warning ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-700"}`} key={value}>{value}</p>)}</div></div>; }

function TimelineList({ events }: { events: TimelineEvent[] }) {
  return <div className="p-5">{events.length > 0 ? <div className="relative space-y-6 before:absolute before:bottom-3 before:left-[18px] before:top-3 before:w-px before:bg-slate-200">{events.map((event) => <TimelineRow event={event} key={event.id} />)}</div> : <p className="text-xs text-slate-500">No longitudinal events are recorded for this patient.</p>}</div>;
}

function buildPatientTimeline(encounters: Encounter[], labResults: LabResult[], imagingResults: PatientImagingResult[], medicationHistory: PatientMedicationHistory, documents: PatientDocument[], formSubmissions: PatientFormSubmission[]): TimelineEvent[] {
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
  const medicationEvents = medicationHistory.events.map((record) => ({
    event: {
      id: `medication-${record.id}`,
      type: "medication" as const,
      title: titleCase(record.eventType),
      detail: `${record.fromStatus ? `${titleCase(record.fromStatus)} to ` : ""}${record.toStatus ? titleCase(record.toStatus) : "Medication workflow recorded"}${record.note ? ` · ${record.note}` : ""}.`,
      timestamp: formatTimelineDate(record.createdAt),
      status: record.toStatus ? titleCase(record.toStatus) : undefined,
    },
    sortAt: new Date(record.createdAt).getTime(),
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
  const documentEvents = documents.filter((document) => document.status !== "superseded").map((document) => ({
    event: { id: `document-${document.id}`, type: "document" as const, title: document.name, detail: `${document.category} · version ${document.version} · ${document.patientVisible ? "portal visible" : "held from portal"}.`, timestamp: formatTimelineDate(document.createdAt), status: titleCase(document.reviewStatus) },
    sortAt: new Date(document.createdAt).getTime(),
  }));
  const formEvents = formSubmissions.map((submission) => ({
    event: { id: `form-${submission.id}`, type: "form" as const, title: submission.templateName, detail: `Form version ${submission.version} · ${submission.completionPercent}% complete${submission.documentId ? " · locked chart artifact attached" : ""}.`, timestamp: formatTimelineDate(submission.updatedAt), status: titleCase(submission.status) },
    sortAt: new Date(submission.updatedAt).getTime(),
  }));
  return [...labEvents, ...imagingEvents, ...medicationEvents, ...formEvents, ...documentEvents, ...encounterEvents]
    .sort((left, right) => right.sortAt - left.sortAt)
    .map(({ event }) => event);
}

function MedicationsTab({ history, permissions }: { history: PatientMedicationHistory; permissions: { canCreate: boolean; canSign: boolean; canUpdate: boolean } }) {
  const openWarnings = history.warnings.filter((warning) => warning.status === "open");
  const active = history.medications.filter((medication) => medication.status === "active");
  return <div className="space-y-5">
    {openWarnings.length > 0 && <section className="rounded-[22px] border border-rose-300 bg-rose-50 p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white"><ShieldAlert className="size-5" /></span><div><p className="text-sm font-extrabold text-rose-950">{openWarnings.length} medication source warning{openWarnings.length === 1 ? "" : "s"} require provider review</p><p className="mt-1 text-[12px] leading-5 text-rose-800">These are exact-match rule signals with retained evidence, not a diagnosis or clinical interpretation.</p></div></div></section>}
    <SectionCard title="Medication history" description="Provider-entered, patient-reported, imported, active, historical, and discontinued records with reconciliation provenance." action={<Button asChild size="sm" variant="secondary"><Link href="/medications">Open medication command <ArrowRight className="size-3.5" /></Link></Button>}>
      <div className="divide-y divide-slate-100">{history.medications.map((medication) => <div className="grid gap-4 p-5 md:grid-cols-[1fr_.65fr_.55fr] md:items-center" key={medication.id}><div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${medication.patientReported ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"}`}><Pill className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{medication.name}</p>{medication.strength && <Badge tone="sky">{medication.strength}</Badge>}<StatusBadge status={titleCase(medication.status)} /></div><p className="mt-1 text-[12px] text-slate-500">{[medication.dose, medication.route, medication.frequency].filter(Boolean).join(" · ") || "Directions not recorded"}</p><p className="mt-1 text-[11px] text-slate-400">{titleCase(medication.source)}{medication.rxNormCode ? ` · RxNorm ${medication.rxNormCode}` : " · RxNorm not mapped"}</p></div></div><div><p className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400">Reconciliation</p><div className="mt-2"><StatusBadge status={titleCase(medication.reconciliationStatus)} /></div><p className="mt-1 text-[11px] text-slate-400">{medication.reconciledAt ? formatTimelineDate(medication.reconciledAt) : "No provider attestation"}</p></div><div><p className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400">Source dates</p><p className="mt-2 text-[11px] font-bold text-slate-600">Start {medication.startDate ? formatTimelineDate(medication.startDate) : "not recorded"}</p>{medication.discontinuedAt && <p className="mt-1 text-[11px] text-slate-400">Stopped {formatTimelineDate(medication.discontinuedAt)}</p>}</div></div>)}{!history.medications.length && <p className="p-6 text-xs text-slate-500">No medication history is recorded for this patient.</p>}</div>
    </SectionCard>
    <div className="grid gap-5 xl:grid-cols-3">
      <SectionCard title="Reconciliation"><div className="divide-y divide-slate-100">{history.reconciliations.slice(0, 5).map((record) => <div className="p-4" key={record.id}><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-extrabold text-slate-800">{record.medicationIds.length} medications</p><StatusBadge status={titleCase(record.status)} /></div><p className="mt-2 text-[11px] text-slate-500">{record.summary ?? "No summary recorded"}</p><p className="mt-2 text-[11px] text-slate-400">{record.completedAt ? `Completed ${formatTimelineDate(record.completedAt)}` : `Opened ${formatTimelineDate(record.createdAt)}`}</p></div>)}{!history.reconciliations.length && <p className="p-4 text-[12px] text-slate-500">No reconciliation recorded.</p>}</div></SectionCard>
      <SectionCard title="Refill activity"><div className="divide-y divide-slate-100">{history.refills.slice(0, 5).map((refill) => { const medication = history.medications.find((item) => item.id === refill.medicationId); return <div className="p-4" key={refill.id}><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-extrabold text-slate-800">{medication?.name ?? "Medication"}</p><StatusBadge status={titleCase(refill.status)} /></div><p className="mt-2 text-[11px] text-slate-500">{titleCase(refill.requestSource)} · {titleCase(refill.urgency)}</p><p className="mt-2 text-[11px] text-slate-400">{formatTimelineDate(refill.createdAt)}</p></div>; })}{!history.refills.length && <p className="p-4 text-[12px] text-slate-500">No refill activity recorded.</p>}</div></SectionCard>
      <SectionCard title="Pharmacy"><div className="divide-y divide-slate-100">{history.pharmacies.map((pharmacy) => <div className="p-4" key={pharmacy.id}><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-extrabold text-slate-800">{pharmacy.name}</p>{pharmacy.preferred && <Badge tone="teal">Preferred</Badge>}</div><p className="mt-2 text-[11px] text-slate-500">{pharmacy.phone ?? "Phone not recorded"}{pharmacy.ncpdpId ? ` · NCPDP ${pharmacy.ncpdpId}` : ""}</p><p className="mt-2 text-[11px] text-slate-400">{pharmacy.electronicPrescribingEnabled ? "Electronic prescribing enabled" : "Manual workflow"}</p></div>)}{!history.pharmacies.length && <p className="p-4 text-[12px] text-slate-500">No pharmacy recorded.</p>}</div></SectionCard>
    </div>
    <Card className="border-[#dfe4f5] bg-[#f8faff] p-5"><div className="flex flex-wrap items-center gap-2"><Badge tone={permissions.canSign ? "teal" : "slate"}>{permissions.canSign ? "Provider signing enabled" : "No provider signing"}</Badge><Badge tone={permissions.canCreate ? "sky" : "slate"}>{permissions.canCreate ? "Intake enabled" : "Read only"}</Badge><Badge tone={permissions.canUpdate ? "amber" : "slate"}>{permissions.canUpdate ? "Workflow updates enabled" : "No workflow updates"}</Badge><span className="ml-auto text-[11px] text-slate-400">{active.length} active medications · {history.prescriptions.length} prescription records</span></div></Card>
  </div>;
}

function DocumentsTab({ canManage, canUpdate, documents }: { canManage: boolean; canUpdate: boolean; documents: PatientDocument[] }) {
  return <SectionCard title="Chart documents" description="Tenant-scoped document versions, human review state, portal visibility, and audited content access." action={<Button asChild size="sm" variant="secondary"><Link href="/documents">Open document airlock <ArrowRight className="size-3.5" /></Link></Button>}><div className="divide-y divide-slate-100">{documents.length ? documents.map((document) => <div className="grid gap-4 p-5 md:grid-cols-[1fr_.55fr_.55fr_auto] md:items-center" key={document.id}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-800"><FileText className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{document.name}</p><Badge>v{document.version}</Badge>{document.supersedesId && <Badge tone="amber">Replacement</Badge>}</div><p className="mt-1 text-[12px] text-slate-400">{document.category} · {document.sourceType} · {(document.sizeBytes / 1024).toFixed(1)} KB</p></div></div><StatusBadge status={titleCase(document.reviewStatus)} /><Badge tone={document.patientVisible ? "teal" : "slate"}>{document.patientVisible ? "Portal visible" : titleCase(document.releaseStatus)}</Badge><div className="flex gap-1">{document.hasStoredContent ? <><Button aria-label={`Preview ${document.name}`} onClick={() => window.open(`/api/documents/${document.id}/content?intent=preview`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Eye className="size-4" /></Button>{canUpdate && <Button aria-label={`Print ${document.name}`} onClick={() => window.open(`/api/documents/${document.id}/content?intent=print`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Printer className="size-4" /></Button>}{canManage && <Button aria-label={`Download ${document.name}`} onClick={() => window.open(`/api/documents/${document.id}/content?intent=download`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Download className="size-4" /></Button>}</> : <Badge tone="slate">External source</Badge>}</div></div>) : <p className="p-6 text-xs text-slate-500">No documents are recorded for this patient.</p>}</div></SectionCard>;
}

function FormsTab({ submissions }: { submissions: PatientFormSubmission[] }) {
  return <SectionCard title="Forms and attestations" description="Immutable template versions, completion state, human review, and locked chart-artifact linkage." action={<Button asChild size="sm" variant="secondary"><Link href="/forms">Open form control room <ArrowRight className="size-3.5" /></Link></Button>}><div className="divide-y divide-slate-100">{submissions.length ? submissions.map((submission) => <div className="grid gap-4 p-5 md:grid-cols-[1fr_.55fr_.45fr_auto] md:items-center" key={submission.id}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><ClipboardCheck className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{submission.templateName}</p><Badge>v{submission.version}</Badge></div><p className="mt-1 text-[12px] text-slate-400">{titleCase(submission.category)} · updated {formatTimelineDate(submission.updatedAt)}</p></div></div><div><StatusBadge status={titleCase(submission.status)} /><p className="mt-2 text-[11px] text-slate-400">{submission.completionPercent}% complete</p></div><Badge tone={submission.documentId ? "teal" : "slate"}>{submission.documentId ? "Chart artifact" : "No artifact"}</Badge>{submission.status === "locked" ? <Button aria-label={`Preview locked ${submission.templateName}`} onClick={() => window.open(`/api/forms/submissions/${submission.id}/pdf`, "_blank", "noopener,noreferrer")} size="icon" variant="ghost"><Eye className="size-4" /></Button> : <span />}</div>) : <p className="p-6 text-xs text-slate-500">No form submissions are recorded for this patient.</p>}</div></SectionCard>;
}

function ConsentsTab({ consents }: { consents: PatientConsentSummary[] }) {
  return <SectionCard title="Consent authorizations" description="Purpose-bound clinical data-sharing consent remains separate from treatment and intake form attestations."><div className="divide-y divide-slate-100">{consents.length ? consents.map((consent) => <div className="grid gap-4 p-5 md:grid-cols-[1fr_.65fr_.5fr] md:items-center" key={consent.id}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-extrabold text-slate-900">{titleCase(consent.type)}</p><p className="mt-1 text-[12px] text-slate-400">{consent.recipient} · {consent.purposeOfUse ? titleCase(consent.purposeOfUse) : "No external purpose"}</p></div></div><div><p className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-400">Authorized categories</p><div className="mt-2 flex flex-wrap gap-1">{consent.dataCategories.map((category) => <Badge key={category}>{titleCase(category)}</Badge>)}{!consent.dataCategories.length && <Badge>Internal consent</Badge>}</div></div><div><StatusBadge status={titleCase(consent.status)} /><p className="mt-2 text-[11px] text-slate-400">Signed {consent.signerName ?? "Not recorded"} · expires {consent.expiresAt ? formatTimelineDate(consent.expiresAt) : "per policy"}</p></div></div>) : <p className="p-6 text-xs text-slate-500">No consent authorizations are recorded for this patient.</p>}</div></SectionCard>;
}

function formatTimelineDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function TimelineRow({ event }: { event: TimelineEvent }) { const Icon = timelineIcons[event.type]; return <div className="relative flex gap-4"><span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-xl ring-4 ring-white ${event.type === "lab" ? "bg-rose-50 text-rose-700" : event.type === "imaging" ? "bg-indigo-50 text-indigo-700" : event.type === "encounter" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{event.title}</p>{event.status && <StatusBadge status={event.status} />}</div><p className="mt-1 text-[12px] leading-5 text-slate-500">{event.detail}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{event.timestamp}</p></div></div>; }

function EncountersTab({ encounters }: { encounters: Encounter[] }) { return <SectionCard title="Encounter history" action={<Button disabled size="sm" title="Encounter creation is not connected yet" variant="primary"><Plus className="size-3.5" /> New encounter</Button>}><div className="divide-y divide-slate-100">{encounters.length > 0 ? encounters.map((encounter) => <Link className="flex items-center gap-4 p-5 hover:bg-slate-50" href={`/encounters/${encounter.id}`} key={encounter.id}><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Stethoscope className="size-5" /></span><div className="flex-1"><p className="text-xs font-extrabold text-slate-900">{encounter.type}</p><p className="mt-1 text-[12px] text-slate-400">{encounter.date} · {encounter.provider}</p></div><StatusBadge status={encounter.status} /><ChevronRight className="size-4 text-slate-300" /></Link>) : <p className="p-5 text-xs text-slate-500">No encounters are recorded for this patient.</p>}</div></SectionCard>; }

function ClinicalList({ title, items, action, icon, warning }: { title: string; items: string[]; action: string; icon: React.ReactNode; warning?: boolean }) { return <SectionCard title={title} action={<Button size="sm" variant="primary"><Plus className="size-3.5" /> {action}</Button>}><div className="grid gap-3 p-5 md:grid-cols-2">{items.map((item) => <div className={`flex items-center gap-3 rounded-xl border p-4 ${warning ? "border-rose-200 bg-rose-50" : "border-slate-200"}`} key={item}><span className={warning ? "text-rose-700" : "text-teal-700"}>{icon}</span><p className="text-xs font-bold text-slate-800">{item}</p></div>)}</div></SectionCard>; }

function GenericList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) { return <SectionCard title={title}><div className="divide-y divide-slate-100">{items.map((item) => <div className="flex items-center gap-3 p-5" key={item}><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700">{icon}</span><p className="flex-1 text-xs font-extrabold text-slate-800">{item}</p><ChevronRight className="size-4 text-slate-300" /></div>)}</div></SectionCard>; }

function VitalsTab({ vitals }: { vitals: PatientVital[] }) {
  const measuredVitals = vitals.filter(vitalHasMeasurement);
  if (measuredVitals.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><Activity className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-700">No vitals recorded for this patient</p><p className="mt-1 text-[12px] text-slate-500">Persisted measurements will appear here after they are captured for this patient.</p></div>;
  }

  return <div className="space-y-4">{measuredVitals.map((vital) => {
    const readings: Array<[string, string] | null> = [
      vital.bloodPressureSystolic !== null && vital.bloodPressureDiastolic !== null ? ["Blood pressure", `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`] : null,
      vital.bloodPressureSystolic !== null && vital.bloodPressureDiastolic === null ? ["Systolic BP", `${vital.bloodPressureSystolic} mmHg`] : null,
      vital.bloodPressureSystolic === null && vital.bloodPressureDiastolic !== null ? ["Diastolic BP", `${vital.bloodPressureDiastolic} mmHg`] : null,
      vital.heartRate !== null ? ["Heart rate", `${vital.heartRate} bpm`] : null,
      vital.temperatureF !== null ? ["Temperature", `${vital.temperatureF} °F`] : null,
      vital.oxygenPercent !== null ? ["Oxygen", `${vital.oxygenPercent}%`] : null,
      vital.weightLbs !== null ? ["Weight", `${vital.weightLbs} lb`] : null,
      vital.heightInches !== null ? ["Height", `${vital.heightInches} in`] : null,
      vital.bmi !== null ? ["BMI", String(vital.bmi)] : null,
    ];
    const measured = readings.filter((reading): reading is [string, string] => reading !== null);
    return <Card className="p-5" key={vital.id}><div className="flex flex-wrap items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><Activity className="size-4" /></span><div><p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-500">Persisted chart measurement</p><p className="mt-1 text-[12px] font-bold text-slate-700">{formatVitalTimestamp(vital.measuredAt)}</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{measured.map(([label, value]) => <div className="rounded-xl bg-slate-50 p-3" key={label}><p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-lg font-extrabold text-slate-950">{value}</p></div>)}</div></Card>;
  })}</div>;
}

function LabsTab({ results }: { results: LabResult[] }) {
  return <SectionCard title="Laboratory history" description="Organization-scoped source results, corrections, review state, and patient-release status." action={<Button asChild size="sm" variant="secondary"><Link href="/labs">Open lab worklist <ArrowRight className="size-3.5" /></Link></Button>}><div className="space-y-4 p-5">{results.length ? results.map((result) => <div className={`rounded-2xl border p-5 ${result.critical ? "border-rose-300 bg-rose-50/50" : "border-slate-200"}`} key={result.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${result.critical ? "bg-rose-600 text-white" : "bg-cyan-50 text-cyan-700"}`}><FlaskConical className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{result.panel}</p>{result.version > 1 && <Badge tone="amber">Version {result.version}</Badge>}{result.correctionOfId && <Badge tone="amber">Correction</Badge>}{result.critical && <Badge tone="rose">Source flagged critical</Badge>}</div><p className="mt-1 text-[12px] text-slate-500">{result.vendor} · {formatLabDate(result.resultedAt)} · {result.source}{result.sourceReference ? ` · ${result.sourceReference}` : ""}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={result.reviewStatus} /><Badge tone={result.patientVisible ? "teal" : "slate"}>{result.patientVisible ? "Released to portal" : "Held from portal"}</Badge><Badge tone={result.abnormalCount ? "rose" : "teal"}>{result.abnormalCount} abnormal</Badge></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{result.items.map((item) => <div className={`rounded-xl p-3 ${item.critical ? "bg-rose-100" : "bg-slate-50"}`} key={item.id}><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-bold text-slate-500">{item.name}</p>{item.critical && <Badge tone="rose">Critical source flag</Badge>}</div><p className="mt-2 text-sm font-extrabold text-slate-900">{item.value}{item.unit ? ` ${item.unit}` : ""}</p>{item.range && <p className="mt-1 text-[11px] text-slate-500">Reference {item.range}</p>}{item.flag && <Badge className="mt-2" tone={item.critical ? "rose" : "amber"}>{item.flag.replaceAll("_", " ")}</Badge>}</div>)}</div></div>) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><FlaskConical className="mx-auto size-6 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-700">No laboratory results recorded</p><p className="mt-1 text-[12px] text-slate-500">Received results will appear here after organization and patient validation.</p></div>}</div></SectionCard>;
}

function ImagingTab({ results }: { results: PatientImagingResult[] }) {
  return <SectionCard title="Imaging history" description="Organization-scoped source reports, provider review state, portal visibility, and correction lineage." action={<Button asChild size="sm" variant="secondary"><Link href="/imaging">Open imaging worklist <ArrowRight className="size-3.5" /></Link></Button>}><div className="space-y-4 p-5">{results.length ? results.map((result) => <article className={`overflow-hidden rounded-2xl border ${result.urgentSourceFlag && result.status === "needs_review" ? "border-rose-300 bg-rose-50/30" : "border-indigo-100 bg-white"}`} key={result.id}><div className="grid sm:grid-cols-[112px_1fr]"><div className="relative grid min-h-28 place-items-center overflow-hidden bg-[#071334] text-blue-200"><div className="absolute size-20 rounded-full border border-blue-300/20" /><ImageIcon className="relative size-7" /><span className="absolute bottom-2 text-[11px] font-black uppercase tracking-[.14em] text-blue-300/60">{result.modality}</span></div><div className="p-4"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-950">{result.title}</p><StatusBadge status={titleCase(result.status)} />{result.version > 1 && <Badge tone="amber">Version {result.version}</Badge>}{result.correctionOfId && <Badge tone="amber">Correction</Badge>}{result.urgentSourceFlag && <Badge tone="rose">Urgent source flag</Badge>}</div><p className="mt-1 text-[12px] text-slate-500">{result.study} · {titleCase(result.modality)} · {result.bodyPart}</p><p className="mt-1 text-[11px] text-slate-400">{result.facility} · {formatTimelineDate(result.studyPerformedAt)} · {result.source}{result.sourceReference ? ` · ${result.sourceReference}` : ""}</p></div><Badge tone={result.patientVisible ? "teal" : "slate"}>{result.patientVisible ? "Portal visible" : "Portal held"}</Badge></div>{(result.findings || result.impression) && <div className="mt-3 grid gap-2 lg:grid-cols-2">{result.findings && <div className="rounded-xl bg-indigo-50/60 p-3"><p className="text-[11px] font-black uppercase tracking-[.13em] text-indigo-600">Source findings</p><p className="mt-2 text-[12px] leading-5 text-slate-700">{result.findings}</p></div>}{result.impression && <div className="rounded-xl bg-indigo-50/60 p-3"><p className="text-[11px] font-black uppercase tracking-[.13em] text-indigo-600">Source impression</p><p className="mt-2 text-[12px] leading-5 text-slate-700">{result.impression}</p></div>}</div>}<p className="mt-3 text-[11px] text-slate-400">Source content only. ClinicOS has not interpreted this report.</p></div></div></article>) : <div className="rounded-2xl border border-dashed border-indigo-200 p-8 text-center"><ImageIcon className="mx-auto size-6 text-indigo-300" /><p className="mt-3 text-xs font-bold text-slate-700">No imaging reports recorded</p><p className="mt-1 text-[12px] text-slate-500">Validated source reports will appear here after receipt.</p></div>}</div></SectionCard>;
}

function formatLabDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatVitalTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function BillingTab({ patient }: { patient: Patient }) { return <div className="grid gap-5 lg:grid-cols-3"><Card className="bg-slate-950 p-6 text-white"><p className="text-[11px] font-bold text-slate-400">PATIENT BALANCE</p><p className="mt-3 text-4xl font-extrabold">${patient.balance}</p><Button className="mt-6 w-full bg-white text-slate-950" variant="secondary">Create payment link</Button></Card><Card className="p-6"><p className="text-[11px] font-bold text-slate-400">PRIMARY COVERAGE</p><p className="mt-3 text-lg font-extrabold text-slate-950">{patient.insurance}</p><p className="mt-1 text-xs text-slate-500">{patient.plan}</p><StatusBadge status="Verified" /></Card><Card className="p-6"><p className="text-[11px] font-bold text-slate-400">LATEST CLAIM</p><p className="mt-3 text-lg font-extrabold text-slate-950">CLM-72014</p><p className="mt-1 text-xs text-slate-500">$224 · Jun 18, 2026</p><StatusBadge status="Ready for review" /></Card></div>; }

function QualityTab({ patient }: { patient: Patient }) { return <SectionCard title="Care gaps and measures"><div className="grid gap-3 p-5 md:grid-cols-2">{qualityGaps.filter((gap) => gap.patient === `${patient.firstName} ${patient.lastName}`).map((gap) => <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" key={gap.id}><div className="flex items-center gap-2"><Syringe className="size-4 text-amber-700" /><p className="text-xs font-extrabold text-amber-950">{gap.measure}</p></div><p className="mt-2 text-[12px] text-amber-800">{gap.due}</p><StatusBadge status={gap.status} /></div>)}</div></SectionCard>; }
