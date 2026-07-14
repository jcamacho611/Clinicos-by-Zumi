import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientChart } from "@/components/clinic/patient-chart";
import { getClinicSession, requireClinicSession } from "@/lib/auth/session";
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
  const patient = await findPatientForOrganization(patientId, session.organizationId);
  if (!patient) notFound();
  return <PatientChart patient={patient} />;
}
