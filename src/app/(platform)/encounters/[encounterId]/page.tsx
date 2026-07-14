import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncounterEditor } from "@/components/clinic/encounter-editor";
import { requireClinicSession } from "@/lib/auth/session";
import { findEncounterForOrganization } from "@/lib/repositories/encounter-repository";
import { findPatientForOrganization } from "@/lib/repositories/patient-repository";

export const metadata: Metadata = { title: "Encounter note" };

export default async function EncounterPage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  const session = await requireClinicSession();
  const encounter = await findEncounterForOrganization(encounterId, session.organizationId);
  if (!encounter) notFound();
  const patient = await findPatientForOrganization(encounter.patientId, session.organizationId);
  if (!patient) notFound();
  return <EncounterEditor encounter={encounter} patient={patient} />;
}
