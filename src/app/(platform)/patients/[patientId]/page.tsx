import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientChart } from "@/components/clinic/patient-chart";
import { getClinicSession, requireClinicSession } from "@/lib/auth/session";
import { listEncountersForPatient } from "@/lib/repositories/encounter-repository";
import { listLabResultsForPatient } from "@/lib/repositories/lab-repository";
import { listImagingResultsForPatient } from "@/lib/repositories/imaging-repository";
import { findPatientForOrganization } from "@/lib/repositories/patient-repository";

export async function generateMetadata({ params }: { params: Promise<{ patientId: string }> }): Promise<Metadata> {
  const { patientId } = await params;
  const session = await getClinicSession();
  const patient = session ? await findPatientForOrganization(patientId, session.organizationId) : null;
  return { title: patient ? `${patient.firstName} ${patient.lastName}` : "Patient chart" };
}

export default async function PatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const session = await requireClinicSession();
  const [patient, encounters, labResults, imagingResults] = await Promise.all([
    findPatientForOrganization(patientId, session.organizationId),
    listEncountersForPatient(patientId, session.organizationId),
    listLabResultsForPatient(patientId, session.organizationId),
    listImagingResultsForPatient(patientId, session.organizationId),
  ]);
  if (!patient) notFound();
  return <PatientChart encounters={encounters} imagingResults={imagingResults} labResults={labResults} patient={patient} />;
}
