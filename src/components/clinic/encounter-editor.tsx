"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, Check, ChevronDown, Clock3, FileClock, History,
  LoaderCircle, LockKeyhole, Save, ShieldCheck, Signature, Sparkles,
  Stethoscope, UserCheck,
} from "lucide-react";
import { CurrentVisitClinicalEvidenceCard } from "@/components/clinic/current-visit-clinical-evidence";
import { EncounterCodingAddenda } from "@/components/clinic/encounter-coding-addenda";
import { StatusBadge } from "@/components/clinic/workspace-kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CurrentVisitClinicalEvidence } from "@/lib/clinical/current-visit-evidence";
import { buildCurrentVisitModel } from "@/lib/clinical/current-visit-model";
import type { PatientVital } from "@/lib/clinical/vital-types";
import type { Encounter, Patient } from "@/lib/types";

const todaySections = [
  { key: "chiefComplaint", label: "Chief complaint", rows: 2 },
  { key: "hpi", label: "History of present illness", rows: 5 },
] as const;

const clinicalSections = [
  { key: "subjective", label: "Subjective / review of systems", rows: 4 },
  { key: "objective", label: "Objective / physical exam", rows: 4 },
] as const;

const assessmentPlanSections = [
  { key: "assessment", label: "Assessment", rows: 4 },
  { key: "plan", label: "Plan", rows: 5 },
] as const;

type DraftFields = Pick<
  Encounter,
  | "chiefComplaint"
  | "hpi"
  | "subjective"
  | "objective"
  | "assessment"
  | "plan"
  | "patientInstructions"
  | "followUp"
>;

type SaveState = "Saved" | "Saving" | "Error";
type EncounterAction = "ready_for_review" | "sign_and_lock";

function initialDraft(encounter: Encounter): DraftFields {
  return {
    chiefComplaint: encounter.chiefComplaint,
    hpi: encounter.hpi,
    subjective: encounter.subjective,
    objective: encounter.objective,
    assessment: encounter.assessment,
    plan: encounter.plan,
    patientInstructions: encounter.patientInstructions,
    followUp: encounter.followUp,
  };
}

function SnapshotList({ empty, items }: { empty: string; items: string[] }) {
  if (items.length === 0) return <p className="text-[12px] leading-5 text-slate-400">{empty}</p>;
  return <div className="flex flex-wrap gap-1.5">{items.map((item) => <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700" key={item}>{item}</span>)}</div>;
}

function VitalReading({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-400">{label}</p><p className="mt-1 text-[12px] font-extrabold text-slate-800">{value}</p></div>;
}

function StaffHandoff({ visit }: { visit: ReturnType<typeof buildCurrentVisitModel> }) {
  if (visit.staffHandoff.status !== "partial") {
    return <><p className="mt-2 text-[12px] leading-5 text-slate-500">{visit.staffHandoff.message}</p><p className="mt-3 text-[11px] font-bold text-slate-400">Encounter-specific intake will become a governed staff → provider handoff in a later persistence slice.</p></>;
  }

  const vital = visit.staffHandoff.vital;
  const readings: Array<[string, string] | null> = [
    vital.bloodPressureSystolic !== null && vital.bloodPressureDiastolic !== null ? ["Blood pressure", `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`] : null,
    vital.heartRate !== null ? ["Heart rate", `${vital.heartRate} bpm`] : null,
    vital.temperatureF !== null ? ["Temperature", `${vital.temperatureF} °F`] : null,
    vital.oxygenPercent !== null ? ["Oxygen", `${vital.oxygenPercent}%`] : null,
    vital.weightLbs !== null ? ["Weight", `${vital.weightLbs} lb`] : null,
    vital.heightInches !== null ? ["Height", `${vital.heightInches} in`] : null,
    vital.bmi !== null ? ["BMI", String(vital.bmi)] : null,
  ];
  const measured = readings.filter((reading): reading is [string, string] => reading !== null);

  return <>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-teal-700">Vitals captured</p>
      <p className="text-[10px] font-bold text-slate-400">{new Date(vital.measuredAt).toLocaleString()}</p>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{measured.map(([label, value]) => <VitalReading key={label} label={label} value={value} />)}</div>
    <p className="mt-3 text-[12px] leading-5 text-slate-500">{visit.staffHandoff.message}</p>
    <p className="mt-2 text-[11px] font-bold text-amber-700">Other staff intake remains incomplete until encounter-specific reconciliation, screening, symptom, or delegated-work evidence is actually persisted.</p>
  </>;
}

function NoteFields({
  editable,
  fields,
  sections,
  updateField,
}: {
  editable: boolean;
  fields: DraftFields;
  sections: ReadonlyArray<{ key: keyof DraftFields; label: string; rows: number }>;
  updateField: (key: keyof DraftFields, value: string) => void;
}) {
  return <div className="space-y-5">{sections.map((section) => <label className="block" key={section.key}><span className="text-[12px] font-extrabold uppercase tracking-[.13em] text-slate-500">{section.label}</span><textarea className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-6 text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" disabled={!editable} onChange={(event) => updateField(section.key, event.target.value)} rows={section.rows} value={fields[section.key]} /></label>)}</div>;
}

export function EncounterEditor({ canSign, clinicalEvidence, encounter, patient, vital }: {
  canSign: boolean;
  clinicalEvidence: CurrentVisitClinicalEvidence;
  encounter: Encounter;
  patient: Patient;
  vital: PatientVital | null;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<DraftFields>(() => initialDraft(encounter));
  const [status, setStatus] = useState(encounter.status);
  const [auditHistory, setAuditHistory] = useState(encounter.auditHistory);
  const [saveState, setSaveState] = useState<SaveState>("Saved");
  const [error, setError] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(true);
  const [actionPending, setActionPending] = useState<EncounterAction | null>(null);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const editable = status === "Draft";
  const visit = buildCurrentVisitModel(patient, { ...encounter, ...fields, status }, { vital });

  const saveDraft = useCallback(async (snapshot: DraftFields, targetRevision: number) => {
    if (!editable) return true;
    setSaveState("Saving");
    setError(null);

    try {
      const response = await fetch(`/api/encounters/${encounter.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      const payload = await response.json() as { error?: string; encounter?: Encounter };
      if (!response.ok || !payload.encounter) throw new Error(payload.error ?? "The encounter could not be saved.");

      savedRevision.current = Math.max(savedRevision.current, targetRevision);
      setAuditHistory(payload.encounter.auditHistory);
      if (revision.current === targetRevision) setSaveState("Saved");
      return true;
    } catch (caught) {
      setSaveState("Error");
      setError(caught instanceof Error ? caught.message : "The encounter could not be saved.");
      return false;
    }
  }, [editable, encounter.id]);

  useEffect(() => {
    const currentRevision = revision.current;
    if (!editable || currentRevision === savedRevision.current) return;
    const timer = window.setTimeout(() => void saveDraft(fields, currentRevision), 750);
    return () => window.clearTimeout(timer);
  }, [editable, fields, saveDraft]);

  function updateField(key: keyof DraftFields, value: string) {
    if (!editable) return;
    revision.current += 1;
    setFields((current) => ({ ...current, [key]: value }));
    setSaveState("Saving");
  }

  async function runTransition(action: EncounterAction) {
    setActionPending(action);
    setError(null);

    try {
      if (action === "ready_for_review") {
        const saved = await saveDraft(fields, revision.current);
        if (!saved) return;
      }

      const response = await fetch(`/api/encounters/${encounter.id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transition: action }),
      });
      const payload = await response.json() as { error?: string; encounter?: Encounter };
      if (!response.ok || !payload.encounter) throw new Error(payload.error ?? "The encounter could not be updated.");

      setStatus(payload.encounter.status);
      setAuditHistory(payload.encounter.auditHistory);
      setSaveState("Saved");
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The encounter could not be updated.");
    } finally {
      setActionPending(null);
    }
  }

  const requiredComplete = 4 - visit.closeVisit.missingRequiredSections.length;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3">
      <Link className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-950" href={`/patients/${patient.id}`}><ArrowLeft className="size-4" /> Back to chart</Link>
      <span className="h-4 w-px bg-slate-200" />
      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
        {saveState === "Saving" ? <LoaderCircle className="size-3.5 animate-spin" /> : saveState === "Error" ? <AlertCircle className="size-3.5 text-rose-600" /> : <Check className="size-3.5 text-teal-600" />}
        {saveState === "Saving" ? "Saving changes..." : saveState === "Error" ? "Save needs attention" : "All changes saved"}
      </span>
    </div>

    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.07)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-sm font-extrabold text-teal-700">{patient.initials}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold tracking-[-.04em] text-slate-950">Current Visit</h2><StatusBadge status={status} /></div>
            <p className="mt-1 text-[12px] font-bold text-slate-700">{encounter.type}</p>
            <p className="mt-1 text-[12px] text-slate-500">{patient.firstName} {patient.lastName} · {patient.mrn} · {encounter.date} · {encounter.provider}</p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={() => setShowAudit((current) => !current)} variant="secondary"><History className="size-4" /> Audit history</Button>
          <Button disabled={!editable || actionPending !== null} onClick={() => void saveDraft(fields, revision.current)} variant="secondary"><Save className="size-4" /> Save draft</Button>
          <Button disabled={!editable || actionPending !== null} onClick={() => void runTransition("ready_for_review")} variant="primary">{actionPending === "ready_for_review" ? <LoaderCircle className="size-4 animate-spin" /> : <Signature className="size-4" />} Ready for review</Button>
        </div>
      </div>
      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-bold leading-5 text-rose-700">{error}</p>}
    </section>

    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-extrabold text-slate-950">Patient snapshot</p>
        <p className="mt-1 text-[12px] text-slate-500">The minimum clinical context already authorized for this encounter. Open the full chart for deeper history.</p>
      </div>
      <div className="grid gap-px bg-slate-100 lg:grid-cols-4">
        <div className="bg-white p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Identity & context</p>
          <p className="mt-2 text-[13px] font-extrabold text-slate-900">{visit.patientSnapshot.patientName}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">MRN {visit.patientSnapshot.mrn} · Age {visit.patientSnapshot.age} · {visit.patientSnapshot.preferredLanguage}</p>
          <p className="mt-2 text-[11px] font-bold text-slate-700">Risk: {visit.patientSnapshot.riskLevel}</p>
          {visit.patientSnapshot.riskFlags.length > 0 && <p className="mt-1 text-[11px] leading-5 text-amber-700">{visit.patientSnapshot.riskFlags.join(" · ")}</p>}
        </div>
        <div className="bg-white p-4"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Allergies</p><SnapshotList empty="No allergies listed in the current patient summary." items={visit.patientSnapshot.allergies} /></div>
        <div className="bg-white p-4"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Medications</p><SnapshotList empty="No medications listed in the current patient summary." items={visit.patientSnapshot.medications} /></div>
        <div className="bg-white p-4"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Problems</p><SnapshotList empty="No active problems listed in the current patient summary." items={visit.patientSnapshot.problems} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] text-slate-500">
        <span><strong className="text-slate-700">Coverage:</strong> {visit.patientSnapshot.insurance || "Not listed"}{visit.patientSnapshot.plan ? ` · ${visit.patientSnapshot.plan}` : ""}</span>
        <span><strong className="text-slate-700">Last visit:</strong> {visit.patientSnapshot.lastVisit || "Not listed"}</span>
        <span><strong className="text-slate-700">Usual location:</strong> {visit.patientSnapshot.location || "Not listed"}</span>
      </div>
    </Card>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <p className="text-sm font-extrabold text-slate-950">What changed</p>
        <p className="mt-2 text-[12px] leading-5 text-slate-500">{visit.change.message}</p>
        <Link className="mt-3 inline-flex text-[11px] font-extrabold text-teal-700 hover:text-teal-900" href={`/patients/${patient.id}`}>Review longitudinal chart →</Link>
      </Card>
      <Card className="p-5">
        <p className="text-sm font-extrabold text-slate-950">Staff handoff</p>
        <StaffHandoff visit={visit} />
      </Card>
    </div>

    <div className="grid gap-5 2xl:grid-cols-[1fr_310px]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-700" /><div><p className="text-xs font-extrabold text-sky-950">AI may prepare a draft, never a final clinical note.</p><p className="mt-1 text-[12px] leading-5 text-sky-800">Provider review, signature, and note locking remain explicit human actions. This build does not generate diagnosis or treatment.</p></div><Button className="ml-auto hidden sm:flex" disabled size="sm" title="AI drafting is not configured" variant="secondary"><Sparkles className="size-3.5" /> Draft summary</Button></div></div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Stethoscope className="size-5 text-teal-700" /><div><p className="text-sm font-extrabold text-slate-950">Today</p><p className="mt-0.5 text-[12px] text-slate-400">Current reason and interval history · {editable ? "Autosave enabled" : "Read-only after review"}</p></div><Button className="ml-auto" disabled size="sm" title="Templates are not connected" variant="ghost">Templates <ChevronDown className="size-3.5" /></Button></div>
          <div className="space-y-6 p-5">
            <NoteFields editable={editable} fields={fields} sections={todaySections} updateField={updateField} />
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-extrabold text-slate-950">Clinical</p>
              <p className="mt-1 text-[12px] text-slate-400">Review of systems and examination findings.</p>
              <div className="mt-4"><NoteFields editable={editable} fields={fields} sections={clinicalSections} updateField={updateField} /></div>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-extrabold text-slate-950">Assessment & plan</p>
              <p className="mt-1 text-[12px] text-slate-400">Provider-authored assessment, treatment plan, and next clinical steps.</p>
              <div className="mt-4"><NoteFields editable={editable} fields={fields} sections={assessmentPlanSections} updateField={updateField} /></div>
            </div>
          </div>
        </Card>

        <CurrentVisitClinicalEvidenceCard evidence={clinicalEvidence} />

        <Card className="p-5">
          <p className="text-sm font-extrabold text-slate-950">Documentation & coding</p>
          <p className="mt-1 text-[12px] text-slate-500">Human-reviewed diagnoses, procedures, modifiers, instructions, and follow-up remain tied to the governed encounter.</p>
        </Card>
        <EncounterCodingAddenda canSign={canSign} editable={editable} encounter={{ ...encounter, ...fields, status }} />

        <Card className="p-5"><div className="grid gap-5 md:grid-cols-2"><label className="text-[12px] font-extrabold uppercase tracking-[.12em] text-slate-500">Patient instructions<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium normal-case leading-6 tracking-normal outline-none focus:border-teal-400 disabled:cursor-not-allowed disabled:bg-slate-100" disabled={!editable} onChange={(event) => updateField("patientInstructions", event.target.value)} value={fields.patientInstructions} /></label><label className="text-[12px] font-extrabold uppercase tracking-[.12em] text-slate-500">Follow-up plan<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium normal-case leading-6 tracking-normal outline-none focus:border-teal-400 disabled:cursor-not-allowed disabled:bg-slate-100" disabled={!editable} onChange={(event) => updateField("followUp", event.target.value)} value={fields.followUp} /></label></div></Card>
      </div>

      {showAudit && <aside className="space-y-5">
        <Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="text-sm font-extrabold text-slate-950">Close visit</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Presentation only. Server-side encounter lifecycle rules remain authority.</p></div><div className="space-y-4 p-4">{[
          ["Draft created", "Encounter record exists", true],
          ["Required documentation", `${requiredComplete} of 4 complete`, visit.closeVisit.requiredDocumentationComplete],
          ["Coding attached", `${visit.closeVisit.diagnosisCount} diagnoses · ${visit.closeVisit.procedureCount} procedures`, visit.closeVisit.diagnosisCount > 0 || visit.closeVisit.procedureCount > 0],
          ["Provider review", status === "Draft" ? "Not submitted" : "Submitted", status !== "Draft"],
          ["Signature and lock", visit.closeVisit.noteLocked ? "Complete" : "Required", visit.closeVisit.noteLocked],
        ].map(([label, detail, complete]) => <div className="flex gap-3" key={String(label)}><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${complete ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"}`}>{complete ? <Check className="size-3.5" /> : <Clock3 className="size-3.5" />}</span><div><p className="text-[12px] font-extrabold text-slate-800">{label}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></div></div>)}</div>{visit.closeVisit.missingRequiredSections.length > 0 && <div className="border-t border-slate-100 bg-amber-50 px-4 py-3"><p className="text-[11px] font-extrabold text-amber-900">Still needed</p><p className="mt-1 text-[11px] leading-5 text-amber-800">{visit.closeVisit.missingRequiredSections.join(" · ")}</p></div>}</Card>

        <Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="text-sm font-extrabold text-slate-950">Audit history</p></div><div className="space-y-5 p-4">{auditHistory.length > 0 ? auditHistory.map((event, index) => <div className="relative flex gap-3" key={event.id}><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${index === 0 ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}><FileClock className="size-3.5" /></span><div><p className="text-[12px] font-extrabold capitalize text-slate-800">{event.action}</p><p className="mt-1 text-[11px] text-slate-400">{event.actor} · {event.timestamp}</p></div></div>) : <p className="text-[12px] text-slate-500">No audit events recorded.</p>}</div></Card>

        <Card className="bg-slate-950 p-5 text-white"><LockKeyhole className="size-5 text-lime-300" /><p className="mt-4 text-sm font-extrabold">Signing is final.</p><p className="mt-2 text-[12px] leading-5 text-slate-400">After signature, the original note locks permanently. Authorized providers can append a separately signed, timestamped addendum without overwriting it.</p><Button className="mt-4 w-full border-white/15 bg-white/10 text-white" disabled={!canSign || status !== "Ready for Review" || actionPending !== null} onClick={() => void runTransition("sign_and_lock")} size="sm" variant="secondary">{actionPending === "sign_and_lock" ? <LoaderCircle className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />} Sign & lock note</Button></Card>
      </aside>}
    </div>
  </div>;
}
