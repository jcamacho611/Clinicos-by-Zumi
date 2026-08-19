import type { PortalDashboard } from "@/lib/repositories/portal-repository";

export const PATIENT_PORTAL_SNAPSHOT_SCHEMA = "klinikos.patient-portal-snapshot.v1" as const;

export const PATIENT_PORTAL_SNAPSHOT_SCOPE_NOTICE =
  "This file is a machine-readable snapshot of information currently available in the Klinikos patient portal. It is not represented as the complete medical record, a complete designated record set, or every record maintained by the clinic. Contact the clinic for a complete records-access or transfer request when additional records are needed.";

function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48) || "patient";
}

export function patientPortalSnapshotFilename(input: {
  displayName: string;
  exportedAt: Date;
}) {
  const date = input.exportedAt.toISOString().slice(0, 10);
  return `klinikos-${safeFilePart(input.displayName)}-portal-snapshot-${date}.json`;
}

export function buildPatientPortalSnapshot(
  data: PortalDashboard,
  input: {
    organizationName: string;
    exportedAt?: Date;
  },
) {
  const exportedAt = input.exportedAt ?? new Date();

  return {
    schemaVersion: PATIENT_PORTAL_SNAPSHOT_SCHEMA,
    kind: "patient_portal_snapshot" as const,
    exportedAt: exportedAt.toISOString(),
    scope: {
      completeMedicalRecord: false,
      completeDesignatedRecordSet: false,
      source: "patient_portal_released_information",
      notice: PATIENT_PORTAL_SNAPSHOT_SCOPE_NOTICE,
    },
    organization: {
      name: input.organizationName,
    },
    patient: {
      id: data.patient.id,
      mrn: data.patient.mrn,
      firstName: data.patient.firstName,
      lastName: data.patient.lastName,
      preferredName: data.patient.preferredName,
      email: data.patient.email,
      phone: data.patient.phone,
      preferredLanguage: data.patient.preferredLanguage,
    },
    appointments: data.appointments,
    releasedRecords: data.records,
    forms: data.forms,
    financial: data.financial,
    messages: data.messages,
  };
}

export type PatientPortalSnapshot = ReturnType<typeof buildPatientPortalSnapshot>;
