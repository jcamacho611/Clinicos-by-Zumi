import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import type { RecordInsuranceVerificationInput } from "@/lib/insurance-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function dateOrNull(value?: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function listInsuranceWorkspace(session: ClinicSession) {
  if (!can(session.role, "insurance", "read")) throw new NetworkAccessError("Insurance access is not permitted for this role.", 403);

  const [patients, coverages, verifications, priorAuthorizations] = await Promise.all([
    db.patient.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      select: { id: true, firstName: true, lastName: true, mrn: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.patientInsurance.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    db.insuranceVerification.findMany({
      where: { organizationId: session.organizationId },
      orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
    }),
    db.priorAuthorization.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  const latestByInsuranceId = new Map<string, (typeof verifications)[number]>();
  const latestByPatientId = new Map<string, (typeof verifications)[number]>();
  for (const verification of verifications) {
    if (verification.insuranceId && !latestByInsuranceId.has(verification.insuranceId)) latestByInsuranceId.set(verification.insuranceId, verification);
    if (!latestByPatientId.has(verification.patientId)) latestByPatientId.set(verification.patientId, verification);
  }

  const coverageRows = coverages.map((coverage) => {
    const patient = patientsById.get(coverage.patientId);
    const latest = latestByInsuranceId.get(coverage.id) ?? latestByPatientId.get(coverage.patientId) ?? null;
    return {
      id: coverage.id,
      patientId: coverage.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable",
      patientMrn: patient?.mrn ?? "Unknown MRN",
      priority: coverage.priority,
      payer: coverage.payer,
      planName: coverage.planName,
      memberId: coverage.memberId,
      groupNumber: coverage.groupNumber,
      effectiveDate: coverage.effectiveDate?.toISOString().slice(0, 10) ?? null,
      terminationDate: coverage.terminationDate?.toISOString().slice(0, 10) ?? null,
      latestVerification: latest ? {
        id: latest.id,
        eligibilityStatus: latest.eligibilityStatus,
        copayCents: latest.copayCents,
        deductibleCents: latest.deductibleCents,
        coinsurancePercent: latest.coinsurancePercent === null ? null : Number(latest.coinsurancePercent),
        effectiveDate: latest.effectiveDate?.toISOString().slice(0, 10) ?? null,
        terminationDate: latest.terminationDate?.toISOString().slice(0, 10) ?? null,
        source: latest.source,
        verifiedBy: latest.verifiedBy,
        verifiedAt: latest.verifiedAt?.toISOString() ?? null,
        notes: latest.notes,
      } : null,
    };
  });

  return {
    canRecordVerification: can(session.role, "insurance", "create") || can(session.role, "insurance", "update"),
    coverages: coverageRows,
    verificationHistory: verifications.map((verification) => {
      const patient = patientsById.get(verification.patientId);
      return {
        id: verification.id,
        patientId: verification.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable",
        payer: verification.payer,
        eligibilityStatus: verification.eligibilityStatus,
        source: verification.source,
        verifiedAt: verification.verifiedAt?.toISOString() ?? verification.createdAt.toISOString(),
        notes: verification.notes,
      };
    }),
    priorAuthorizations: priorAuthorizations.map((authorization) => {
      const patient = patientsById.get(authorization.patientId);
      return {
        id: authorization.id,
        patientId: authorization.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable",
        patientMrn: patient?.mrn ?? "Unknown MRN",
        payer: authorization.payer,
        service: authorization.service,
        referenceNumber: authorization.referenceNumber,
        status: authorization.status,
        submittedAt: authorization.submittedAt?.toISOString() ?? null,
        expiresAt: authorization.expiresAt?.toISOString() ?? null,
        createdAt: authorization.createdAt.toISOString(),
      };
    }),
  };
}

export type InsuranceWorkspaceData = Awaited<ReturnType<typeof listInsuranceWorkspace>>;

export async function recordManualInsuranceVerification(session: ClinicSession, input: RecordInsuranceVerificationInput) {
  if (!can(session.role, "insurance", "create") && !can(session.role, "insurance", "update")) {
    throw new NetworkAccessError("Insurance verification evidence cannot be recorded by this role.", 403);
  }

  return db.$transaction(async (tx) => {
    const coverage = await tx.patientInsurance.findFirst({
      where: { id: input.insuranceId, organizationId: session.organizationId, status: "active" },
      select: { id: true, patientId: true, payer: true, effectiveDate: true, terminationDate: true },
    });
    if (!coverage) throw new NetworkAccessError("Active insurance coverage not found for this organization.", 404);

    const verifiedAt = new Date();
    const verification = await tx.insuranceVerification.create({
      data: {
        organizationId: session.organizationId,
        patientId: coverage.patientId,
        insuranceId: coverage.id,
        payer: coverage.payer,
        eligibilityStatus: input.eligibilityStatus,
        copayCents: input.copayCents ?? null,
        deductibleCents: input.deductibleCents ?? null,
        coinsurancePercent: input.coinsurancePercent ?? null,
        effectiveDate: dateOrNull(input.effectiveDate) ?? coverage.effectiveDate,
        terminationDate: dateOrNull(input.terminationDate) ?? coverage.terminationDate,
        source: input.source,
        verifiedBy: session.userId,
        verifiedAt,
        notes: input.notes || null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "insurance.manual_verification_recorded",
        resourceType: "insurance_verification",
        resourceId: verification.id,
        patientId: coverage.patientId,
        metadata: {
          insuranceId: coverage.id,
          payer: coverage.payer,
          eligibilityStatus: input.eligibilityStatus,
          source: input.source,
          verifiedAt: verifiedAt.toISOString(),
          externalElectronicVerification: false,
        },
      },
    });

    return verification;
  });
}
