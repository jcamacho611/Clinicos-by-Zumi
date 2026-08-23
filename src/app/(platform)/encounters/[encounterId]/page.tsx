import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncounterEditor } from "@/components/clinic/encounter-editor";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { findMedicationReconciliationForEncounter } from "@/lib/clinical/encounter-medication-reconciliation";
import { loadCurrentVisitClinicalEvidence } from "@/lib/clinical/current-visit-evidence";
import { findEncounterForOrganization } from "@/lib/repositories/encounter-repository";
import { listImagingResultsForPatient } from "@/lib/repositories/imaging-repository";
import { listLabResultsForPatient } from "@/lib/repositories/lab-repository";
import { findPatientForOrganization } from "@/lib/repositories/patient-repository";
import { findLatestVitalForEncounter } from "@/lib/repositories/vital-repository";
import styles from "./current-visit-black-label.module.css";

export const metadata: Metadata = { title: "Current Visit" };

export default async function EncounterPage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  const session = await requireClinicSession();
  if (!can(session.role, "encounters", "read")) notFound();
  const encounter = await findEncounterForOrganization(encounterId, session.organizationId);
  if (!encounter) notFound();
  const [patient, vital, medicationReconciliation, clinicalEvidence] = await Promise.all([
    findPatientForOrganization(encounter.patientId, session.organizationId),
    findLatestVitalForEncounter(encounter.id, encounter.patientId, session.organizationId),
    findMedicationReconciliationForEncounter(encounter.id, encounter.patientId, session.organizationId),
    loadCurrentVisitClinicalEvidence(encounter.patientId, session.organizationId, {
      listLabsForPatient: listLabResultsForPatient,
      listImagingForPatient: listImagingResultsForPatient,
    }),
  ]);
  if (!patient) notFound();

  return (
    <div className={styles.stage} data-current-visit-stage="object-stage">
      <EncounterEditor
        canSign={can(session.role, "encounters", "sign")}
        clinicalEvidence={clinicalEvidence}
        encounter={encounter}
        medicationReconciliation={medicationReconciliation}
        patient={patient}
        vital={vital}
      />
    </div>
  );
}
