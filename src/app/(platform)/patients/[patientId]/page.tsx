import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientChart } from "@/components/clinic/patient-chart";
import { PatientSmsPreferencesPanel } from "@/components/clinic/patient-sms-preferences-panel";
import { can } from "@/lib/auth/rbac";
import { getClinicSession, requireClinicSession } from "@/lib/auth/session";
import { listEncountersForPatient } from "@/lib/repositories/encounter-repository";
import { listLabResultsForPatient } from "@/lib/repositories/lab-repository";
import { listImagingResultsForPatient } from "@/lib/repositories/imaging-repository";
import { listDocumentsForPatient } from "@/lib/repositories/document-repository";
import { listFormSubmissionsForPatient } from "@/lib/repositories/form-repository";
import { listConsentsForPatient } from "@/lib/repositories/consent-repository";
import { listMedicationHistoryForPatient } from "@/lib/repositories/medication-repository";
import { findPatientForOrganization } from "@/lib/repositories/patient-repository";

export async function generateMetadata({ params }: { params: Promise<{ patientId: string }> }): Promise<Metadata> {
  const { patientId } = await params;
  const session = await getClinicSession();
  const patient = session && can(session.role, "patients", "read")
    ? await findPatientForOrganization(patientId, session.organizationId)
    : null;
  return { title: patient ? `${patient.firstName} ${patient.lastName}` : "Patient chart" };
}

export default async function PatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const session = await requireClinicSession();
  if (!can(session.role, "patients", "read")) notFound();
  const [patient, encounters, labResults, imagingResults, documents, formSubmissions, consents, medicationHistory] = await Promise.all([
    findPatientForOrganization(patientId, session.organizationId),
    listEncountersForPatient(patientId, session.organizationId),
    listLabResultsForPatient(patientId, session.organizationId),
    listImagingResultsForPatient(patientId, session.organizationId),
    listDocumentsForPatient(patientId, session.organizationId),
    listFormSubmissionsForPatient(session.organizationId, patientId),
    listConsentsForPatient(session.organizationId, patientId),
    listMedicationHistoryForPatient(session.organizationId, patientId),
  ]);
  if (!patient) notFound();

  return (
    <>
      <PatientChart
        consents={consents}
        documentPermissions={{ canManage: can(session.role, "documents", "manage"), canUpdate: can(session.role, "documents", "update") }}
        documents={documents}
        encounters={encounters}
        formSubmissions={formSubmissions}
        imagingResults={imagingResults}
        labResults={labResults}
        medicationHistory={medicationHistory}
        medicationPermissions={{ canCreate: can(session.role, "medications", "create"), canSign: can(session.role, "medications", "sign"), canUpdate: can(session.role, "medications", "update") }}
        patient={patient}
      />
      <PatientSmsPreferencesPanel
        canRead={can(session.role, "consents", "read")}
        canUpdate={can(session.role, "consents", "update")}
        patientId={patient.id}
      />
    </>
  );
}
