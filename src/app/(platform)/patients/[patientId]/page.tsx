import type { Metadata } from "next";
import { PatientChart } from "@/components/clinic/patient-chart";
import { getPatient } from "@/lib/clinic-data";

export async function generateMetadata({ params }: { params: Promise<{ patientId: string }> }): Promise<Metadata> {
  const { patientId } = await params;
  const patient = getPatient(patientId);
  return { title: `${patient.firstName} ${patient.lastName}` };
}

export default async function PatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return <PatientChart patient={getPatient(patientId)} />;
}
