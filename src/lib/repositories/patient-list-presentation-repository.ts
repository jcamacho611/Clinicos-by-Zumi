import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export type PatientListItemView = {
  id: string;
  mrn: string;
  displayName: string;
  dateOfBirth: string;
  preferredLanguage: string;
  portalStatus: string;
  riskLevel: string;
};

/**
 * Browser/API projection for patient-list use. Deliberately excludes phone/email,
 * insurance/member IDs, balances, diagnoses/problems, medications, allergies,
 * encounter detail, and other chart content. Rich patient context remains available
 * through separately authorized server-side patient/chart loaders.
 */
export async function listPatientViewsForSession(session: ClinicSession): Promise<PatientListItemView[]> {
  if (!can(session.role, "patients", "read")) {
    throw new NetworkAccessError("Patient list access is not permitted for this role.", 403);
  }

  const rows = await db.patient.findMany({
    where: { organizationId: session.organizationId, status: "active" },
    select: {
      id: true,
      mrn: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      dateOfBirth: true,
      preferredLanguage: true,
      portalStatus: true,
      riskLevel: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 1000,
  });

  return rows.map((patient) => ({
    id: patient.id,
    mrn: patient.mrn,
    displayName: patient.preferredName?.trim() || `${patient.firstName} ${patient.lastName}`,
    dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
    preferredLanguage: patient.preferredLanguage,
    portalStatus: patient.portalStatus,
    riskLevel: patient.riskLevel,
  }));
}
