import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncounterEditor } from "@/components/clinic/encounter-editor";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { findEncounterForOrganization } from "@/lib/repositories/encounter-repository";
import { findPatientForOrganization } from "@/lib/repositories/patient-repository";
import { findLatestVitalForEncounter } from "@/lib/repositories/vital-repository";

export const metadata: Metadata = { title: "Encounter note" };

export default async function EncounterPage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  const session = await requireClinicSession();
  if (!can(session.role, "encounters", "read")) notFound();
  const encounter = await findEncounterForOrganization(encounterId, session.organizationId);
  if (!encounter) notFound();
  const [patient, vital] = await Promise.all([
    findPatientForOrganization(encounter.patientId, session.organizationId),
    findLatestVitalForEncounter(encounter.id, encounter.patientId, session.organizationId),
  ]);
  if (!patient) notFound();
  return <EncounterEditor canSign={can(session.role, "encounters", "sign")} encounter={encounter} patient={patient} vital={vital} />;
}
