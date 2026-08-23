"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileText,
  FlaskConical,
  HeartPulse,
  Image as ImageIcon,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/workspace-kit";
import { vitalHasMeasurement, type PatientVital } from "@/lib/clinical/vital-types";
import type { PatientMedicationHistory } from "@/lib/repositories/medication-repository";
import type {
  Encounter,
  LabResult,
  Patient,
  PatientConsentSummary,
  PatientDocument,
  PatientFormSubmission,
  PatientImagingResult,
} from "@/lib/types";
import styles from "./patient-chart-black-label.module.css";

const tabs = ["Summary", "Encounters", "Medications", "Vitals", "Labs", "Imaging", "Documents", "Forms & consents"] as const;

type ChartTab = (typeof tabs)[number];

type PatientChartProps = {
  consents: PatientConsentSummary[];
  documentPermissions: { canManage: boolean; canUpdate: boolean };
  documents: PatientDocument[];
  encounters: Encounter[];
  formSubmissions: PatientFormSubmission[];
  imagingResults: PatientImagingResult[];
  labResults: LabResult[];
  medicationHistory: PatientMedicationHistory;
  medicationPermissions: { canCreate: boolean; canSign: boolean; canUpdate: boolean };
  patient: Patient;
  vitals: PatientVital[];
};

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function PatientFact({ label, value }: { label: string; value: string }) {
  return <div className={styles.fact}><p className={styles.factLabel}>{label}</p><p className={styles.factValue}>{value || "Not recorded"}</p></div>;
}

function Panel({ title, detail, action, children }: { title: string; detail?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className={styles.panel}><div className={styles.panelHeader}><div><h3 className="text-sm font-semibold text-[var(--k-text)]">{title}</h3>{detail ? <p className="mt-1 text-xs leading-5 text-[var(--k-muted)]">{detail}</p> : null}</div>{action}</div>{children}</section>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}

function DomainLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--k-accent)]" href={href}>{children}<ArrowRight className="size-3.5" aria-hidden="true" /></Link>;
}

export function PatientChartReal({ consents, documentPermissions, documents, encounters, formSubmissions, imagingResults, labResults, medicationHistory, medicationPermissions, patient, vitals }: PatientChartProps) {
  const openEncounter = encounters.find((encounter) => encounter.status === "Draft" || encounter.status === "Ready for Review");
  const labReview = labResults.find((result) => result.reviewStatus === "Needs Review");
  const imagingReview = imagingResults.find((result) => result.status === "needs_review");
  const formReview = formSubmissions.find((submission) => ["staff_review", "provider_review"].includes(submission.status));
  const documentReview = documents.find((document) => document.status === "active" && document.reviewStatus === "needs_review");
  const measuredVitals = vitals.filter(vitalHasMeasurement);

  const reviewTitle = imagingReview
    ? `Review ${imagingReview.title}`
    : labReview
      ? `Review ${labReview.panel}`
      : formReview
        ? `Review ${formReview.templateName}`
        : documentReview
          ? `Review ${documentReview.name}`
          : "No loaded result, form, or document is marked for review.";

  const reviewDetail = imagingReview
    ? `${imagingReview.facility} source report is held from the portal${imagingReview.urgentSourceFlag ? " and carries an urgent source flag" : ""}. ClinicOS has not interpreted the report.`
    : labReview
      ? `${labReview.vendor} source data is held from the portal${labReview.critical ? " and carries a critical source flag" : ""}. ClinicOS has not interpreted the result.`
      : formReview
        ? `${formReview.templateName} version ${formReview.version} is awaiting explicit ${humanize(formReview.status)}.`
        : documentReview
          ? `${documentReview.category} version ${documentReview.version} is held from patient release until an authorized human completes review.`
          : "This statement applies only to the lab, imaging, form, and document records loaded into this chart. It does not infer the state of an external system.";

  const reviewHref = imagingReview ? "/imaging" : labReview ? "/labs" : formReview ? "/forms" : "/documents";
  const medicationAction = medicationPermissions.canCreate || medicationPermissions.canUpdate || medicationPermissions.canSign ? "Manage medications" : "Open medications";
  const documentAction = documentPermissions.canManage || documentPermissions.canUpdate ? "Manage documents" : "Open documents";

  return <div className={`${styles.chart} space-y-5`}>
    <Link className={styles.backLink} href="/patients"><ArrowLeft className="size-4" aria-hidden="true" />Back to patient charts</Link>

    <section className={styles.stage} data-patient-chart-stage aria-labelledby="patient-chart-title">
      <div className={styles.stageMain}>
        <div className={styles.identity}>
          <span className={styles.avatar}>{patient.initials}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 id="patient-chart-title" className="truncate text-2xl font-semibold tracking-[-.04em] text-[var(--k-text)]">{patient.firstName} {patient.lastName}</h1><StatusBadge status={patient.riskLevel} /><StatusBadge status={`Portal ${patient.portalStatus}`} /></div>
            <p className="mt-1 text-xs leading-5 text-[var(--k-muted)]">DOB {patient.dob} · {patient.age} years · {patient.sex} · {patient.pronouns} · MRN {patient.mrn}</p>
          </div>
        </div>

        <div className={styles.factGrid}>
          <PatientFact label="Coverage" value={patient.insurance} />
          <PatientFact label="Provider" value={patient.provider} />
          <PatientFact label="Next visit" value={patient.nextAppointment} />
          <PatientFact label="Balance" value={`$${patient.balance}`} />
        </div>

        {openEncounter ? <Button asChild variant="primary"><Link href={`/encounters/${openEncounter.id}`}><Stethoscope className="size-4" />Open Current Visit</Link></Button> : <Button asChild variant="secondary"><Link href="/encounters">Open encounters <ArrowRight className="size-4" /></Link></Button>}
      </div>

      {patient.riskFlags.length > 0 ? <div className={styles.flags}><span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.13em] text-rose-600"><ShieldAlert className="size-4" aria-hidden="true" />Chart flags</span>{patient.riskFlags.map((flag) => <Badge key={flag} tone="rose">{flag}</Badge>)}</div> : null}
    </section>

    <div className={styles.metricStrip} aria-label="Loaded patient record context">
      <div className={styles.metric}><p className={styles.metricLabel}>Encounters</p><p className={styles.metricValue}>{encounters.length}</p></div>
      <div className={styles.metric}><p className={styles.metricLabel}>Lab panels</p><p className={styles.metricValue}>{labResults.length}</p></div>
      <div className={styles.metric}><p className={styles.metricLabel}>Imaging</p><p className={styles.metricValue}>{imagingResults.length}</p></div>
      <div className={styles.metric}><p className={styles.metricLabel}>Documents</p><p className={styles.metricValue}>{documents.length}</p></div>
    </div>

    <Tabs.Root defaultValue="Summary">
      <div className={styles.tabsBar}><Tabs.List className={styles.tabsList} aria-label="Patient record sections">{tabs.map((tab) => <Tabs.Trigger className={styles.tab} key={tab} value={tab}>{tab}</Tabs.Trigger>)}</Tabs.List></div>

      <Tabs.Content className={styles.content} value="Summary"><Summary patient={patient} reviewTitle={reviewTitle} reviewDetail={reviewDetail} reviewHref={reviewHref} encounters={encounters} labResults={labResults} imagingResults={imagingResults} documents={documents} formSubmissions={formSubmissions} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Encounters"><EncounterList encounters={encounters} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Medications"><MedicationList history={medicationHistory} actionLabel={medicationAction} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Vitals"><VitalsList vitals={measuredVitals} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Labs"><LabsList results={labResults} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Imaging"><ImagingList results={imagingResults} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Documents"><DocumentList documents={documents} actionLabel={documentAction} /></Tabs.Content>
      <Tabs.Content className={styles.content} value="Forms & consents"><FormsAndConsents forms={formSubmissions} consents={consents} /></Tabs.Content>
    </Tabs.Root>
  </div>;
}

function Summary({ patient, reviewTitle, reviewDetail, reviewHref, encounters, labResults, imagingResults, documents, formSubmissions }: { patient: Patient; reviewTitle: string; reviewDetail: string; reviewHref: string; encounters: Encounter[]; labResults: LabResult[]; imagingResults: PatientImagingResult[]; documents: PatientDocument[]; formSubmissions: PatientFormSubmission[] }) {
  return <div className={styles.summaryGrid}>
    <Panel title="Clinical snapshot" detail="Patient summary fields already present in the governed patient record."><div className={styles.panelBody}><div className={styles.clinicalTokens}><TokenGroup label="Medications" values={patient.medications} /><TokenGroup label="Allergies" values={patient.allergies} warning /><TokenGroup label="Problems" values={patient.problems} /></div></div></Panel>

    <Panel title="Record at a glance" detail="Counts and encounter rows reflect only records loaded from the patient-scoped repositories on this page.">
      <div className="grid gap-px bg-[var(--k-line)] sm:grid-cols-2">
        <RecordCount icon={<Stethoscope className="size-4" />} label="Encounters" value={encounters.length} />
        <RecordCount icon={<FlaskConical className="size-4" />} label="Lab panels" value={labResults.length} />
        <RecordCount icon={<ImageIcon className="size-4" />} label="Imaging reports" value={imagingResults.length} />
        <RecordCount icon={<FileText className="size-4" />} label="Documents / forms" value={documents.length + formSubmissions.length} />
      </div>
      <div className="border-t border-[var(--k-line)] p-4"><p className="text-xs leading-6 text-[var(--k-muted)]">Contact: {patient.phone || "Not recorded"} · {patient.email || "Not recorded"}<br />Preferred language: {patient.preferredLanguage || "Not recorded"} · Usual location: {patient.location || "Not recorded"}</p></div>
    </Panel>

    <div className="space-y-5">
      <div className={styles.attention}><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#efaaa1]">Needs review</p><h3 className="mt-3 text-lg font-semibold tracking-[-.03em]">{reviewTitle}</h3><p className="mt-2 text-xs leading-6 text-[#c9b5b1]">{reviewDetail}</p><Button asChild className="mt-4 w-full bg-white text-[#241517] hover:bg-[#f5ece9]" size="sm" variant="secondary"><Link href={reviewHref}>Open governed worklist</Link></Button></div>
      <Panel title="Record scope"><div className={styles.panelBody}><p className="text-xs leading-6 text-[var(--k-muted)]">This chart shows the patient-scoped records loaded by Klinikos from its current authoritative repositories. A missing row is not interpreted as a normal result, completed referral, cleared care gap, or external-system confirmation.</p></div></Panel>
    </div>
  </div>;
}

function RecordCount({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="bg-[var(--k-public-surface)] p-4"><div className="flex items-center gap-2 text-[var(--k-accent)]">{icon}<p className="text-xs font-extrabold uppercase tracking-[.1em] text-[var(--k-muted)]">{label}</p></div><p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--k-text)]">{value}</p></div>;
}

function TokenGroup({ label, values, warning = false }: { label: string; values: string[]; warning?: boolean }) {
  return <div className={styles.tokenGroup}><p className="text-xs font-extrabold uppercase tracking-[.11em] text-[var(--k-muted)]">{label}</p>{values.length ? <div className={styles.tokenList}>{values.map((value) => <span className={`${styles.token} ${warning ? styles.warningToken : ""}`} key={value}>{value}</span>)}</div> : <p className="mt-2 text-xs text-[var(--k-muted)]">No {label.toLowerCase()} are listed in the current patient summary.</p>}</div>;
}

function EncounterList({ encounters }: { encounters: Encounter[] }) {
  return <Panel title="Encounters" detail="Stored encounter records for this patient." action={<DomainLink href="/encounters">Open encounter worklist</DomainLink>}><div>{encounters.length ? encounters.map((encounter) => <Link className={styles.row} href={`/encounters/${encounter.id}`} key={encounter.id}><span className={styles.rowIcon}><Stethoscope className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{encounter.type}</p><p className="mt-1 text-xs text-[var(--k-muted)]">{encounter.date} · {encounter.provider}</p></div><StatusBadge status={encounter.status} /><ArrowRight className="size-4 text-[var(--k-muted)]" /></Link>) : <Empty>No encounter records are loaded for this patient.</Empty>}</div></Panel>;
}

function MedicationList({ history, actionLabel }: { history: PatientMedicationHistory; actionLabel: string }) {
  return <Panel title="Medications" detail="Medication records remain governed by the medication domain." action={<DomainLink href="/medications">{actionLabel}</DomainLink>}><div>{history.medications.length ? history.medications.map((medication) => <div className={styles.row} key={medication.id}><span className={styles.rowIcon}><Pill className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{medication.name}</p><p className="mt-1 text-xs text-[var(--k-muted)]">Updated {formatDate(medication.updatedAt)}</p></div><StatusBadge status={humanize(medication.status)} /></div>) : <Empty>No medication records are loaded for this patient.</Empty>}</div></Panel>;
}

function VitalsList({ vitals }: { vitals: PatientVital[] }) {
  return <Panel title="Vitals" detail="Persisted measurements only; missing values are not inferred." action={null}><div>{vitals.length ? vitals.map((vital) => <div className={styles.row} key={vital.id}><span className={styles.rowIcon}><Activity className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{formatVitalSummary(vital)}</p><p className="mt-1 text-xs text-[var(--k-muted)]">Measured {formatDate(vital.measuredAt)}</p></div></div>) : <Empty>No persisted vital measurements are loaded for this patient.</Empty>}</div></Panel>;
}

function formatVitalSummary(vital: PatientVital) {
  const values: string[] = [];
  if (vital.bloodPressureSystolic !== null && vital.bloodPressureDiastolic !== null) values.push(`BP ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`);
  if (vital.heartRate !== null) values.push(`HR ${vital.heartRate}`);
  if (vital.temperatureF !== null) values.push(`${vital.temperatureF}°F`);
  if (vital.oxygenPercent !== null) values.push(`O₂ ${vital.oxygenPercent}%`);
  if (vital.weightLbs !== null) values.push(`${vital.weightLbs} lb`);
  if (vital.bmi !== null) values.push(`BMI ${vital.bmi}`);
  return values.join(" · ") || "Measurement record";
}

function LabsList({ results }: { results: LabResult[] }) {
  return <Panel title="Laboratory results" detail="Source result flags and human review state are shown without Klinikos interpretation." action={<DomainLink href="/labs">Open laboratory worklist</DomainLink>}><div>{results.length ? results.map((result) => <div className={styles.row} key={result.id}><span className={styles.rowIcon}><FlaskConical className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{result.panel}</p><p className="mt-1 text-xs text-[var(--k-muted)]">{result.vendor} · resulted {formatDate(result.resultedAt)} · {result.items.length} item{result.items.length === 1 ? "" : "s"}{result.abnormalCount ? ` · ${result.abnormalCount} source-flagged abnormal` : ""}{result.critical ? " · source flagged critical" : ""}</p></div><StatusBadge status={result.reviewStatus} /></div>) : <Empty>No laboratory result records are loaded for this patient.</Empty>}</div></Panel>;
}

function ImagingList({ results }: { results: PatientImagingResult[] }) {
  return <Panel title="Imaging" detail="Source imaging report state is shown without clinical interpretation." action={<DomainLink href="/imaging">Open imaging worklist</DomainLink>}><div>{results.length ? results.map((result) => <div className={styles.row} key={result.id}><span className={styles.rowIcon}><ImageIcon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{result.title}</p><p className="mt-1 text-xs text-[var(--k-muted)]">{result.facility} · {result.modality} · performed {formatDate(result.studyPerformedAt)}{result.urgentSourceFlag ? " · urgent source flag" : ""}</p></div><StatusBadge status={humanize(result.status)} /></div>) : <Empty>No imaging result records are loaded for this patient.</Empty>}</div></Panel>;
}

function DocumentList({ documents, actionLabel }: { documents: PatientDocument[]; actionLabel: string }) {
  return <Panel title="Documents" detail="Governed patient-linked document versions and release state." action={<DomainLink href="/documents">{actionLabel}</DomainLink>}><div>{documents.length ? documents.map((document) => <div className={styles.row} key={document.id}><span className={styles.rowIcon}><FileText className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{document.name}</p><p className="mt-1 text-xs text-[var(--k-muted)]">{document.category} · version {document.version} · created {formatDate(document.createdAt)} · release {humanize(document.releaseStatus)}</p></div><StatusBadge status={humanize(document.reviewStatus)} /></div>) : <Empty>No patient-linked document records are loaded.</Empty>}</div></Panel>;
}

function FormsAndConsents({ forms, consents }: { forms: PatientFormSubmission[]; consents: PatientConsentSummary[] }) {
  return <div className="grid gap-5 xl:grid-cols-2"><Panel title="Forms" detail="Patient-linked form submissions and review state." action={<DomainLink href="/forms">Open forms</DomainLink>}><div>{forms.length ? forms.map((form) => <div className={styles.row} key={form.id}><span className={styles.rowIcon}><ClipboardCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{form.templateName}</p><p className="mt-1 text-xs text-[var(--k-muted)]">Version {form.version} · {form.completionPercent}% complete · updated {formatDate(form.updatedAt)}</p></div><StatusBadge status={humanize(form.status)} /></div>) : <Empty>No form submissions are loaded for this patient.</Empty>}</div></Panel><Panel title="Consents" detail="Consent state is shown as its own governed evidence, not inferred from treatment or portal activity."><div>{consents.length ? consents.map((consent) => <div className={styles.row} key={consent.id}><span className={styles.rowIcon}><ShieldCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--k-text)]">{humanize(consent.type)}</p><p className="mt-1 text-xs text-[var(--k-muted)]">Recipient: {consent.recipient} · signed {formatDate(consent.signedAt)}{consent.expiresAt ? ` · expires ${formatDate(consent.expiresAt)}` : ""}</p></div><StatusBadge status={humanize(consent.status)} /></div>) : <Empty>No consent evidence is loaded for this patient.</Empty>}</div></Panel></div>;
}
