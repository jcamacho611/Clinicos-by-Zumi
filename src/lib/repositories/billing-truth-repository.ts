import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export async function listBillingTruthWorkspace(session: ClinicSession) {
  if (!can(session.role, "billing", "read")) throw new NetworkAccessError("Billing access is not permitted for this role.", 403);

  const [patients, claims, denials] = await Promise.all([
    db.patient.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      select: { id: true, firstName: true, lastName: true, mrn: true },
    }),
    db.claimDraft.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    db.denial.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const claimMap = new Map(claims.map((claim) => [claim.id, claim]));

  return {
    claims: claims.map((claim) => {
      const patient = patientMap.get(claim.patientId);
      return {
        id: claim.id,
        patientId: claim.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        encounterId: claim.encounterId,
        superbillId: claim.superbillId,
        payer: claim.payer,
        providerNpi: claim.providerNpi,
        facilityNpi: claim.facilityNpi,
        placeOfService: claim.placeOfService,
        totalCents: claim.totalCents,
        status: claim.status,
        submittedAt: claim.submittedAt?.toISOString() ?? null,
        createdAt: claim.createdAt.toISOString(),
        updatedAt: claim.updatedAt.toISOString(),
      };
    }),
    denials: denials.map((denial) => {
      const claim = claimMap.get(denial.claimDraftId);
      const patient = claim ? patientMap.get(claim.patientId) : undefined;
      return {
        id: denial.id,
        claimDraftId: denial.claimDraftId,
        patientId: claim?.patientId ?? null,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable",
        payer: claim?.payer ?? "Payer unavailable",
        reasonCode: denial.reasonCode,
        reason: denial.reason,
        amountCents: denial.amountCents,
        status: denial.status,
        appealDueAt: denial.appealDueAt?.toISOString() ?? null,
        resolvedAt: denial.resolvedAt?.toISOString() ?? null,
        createdAt: denial.createdAt.toISOString(),
      };
    }),
  };
}

export type BillingTruthWorkspace = Awaited<ReturnType<typeof listBillingTruthWorkspace>>;
