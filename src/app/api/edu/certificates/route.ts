import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  certificateCompetencyAreasFromAudit,
  EDU_CERTIFICATE_DISCLAIMER,
  eduCertificateMutationSchema,
  validateEduCertificateEvidence,
} from "@/lib/edu/certificate-rules";
import { canEdu } from "@/lib/edu/edu-roles";
import { eduInstitutionFilter, resolveEduIdentity, type EduIdentity } from "@/lib/edu/edu-session";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

type CertificateMutationError = {
  kind: "error";
  message: string;
  status: 400 | 403 | 404 | 409;
  problems?: string[];
};

function deny(message: string, status: 400 | 403 | 404 | 409, problems?: string[]) {
  return NextResponse.json({ error: message, problems }, { status, headers: NO_STORE });
}

function serialNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `KEDU-${date}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

function accessibleEnrollmentWhere(identity: EduIdentity): Prisma.EducationEnrollmentWhereInput {
  if (identity.role === "edu_admin") return eduInstitutionFilter(identity);
  if (identity.role === "edu_student") {
    return { ...eduInstitutionFilter(identity), studentEmail: identity.session.email.trim().toLowerCase() };
  }
  return { ...eduInstitutionFilter(identity), cohortId: identity.cohortIds.length ? { in: identity.cohortIds } : "__no_cohort__" };
}

function normalizedEvidenceAreas(certificateType: string, areas: readonly string[]) {
  if (certificateType !== "competency_evidence") return [];
  return [...new Set(areas.map((area) => area.trim()).filter(Boolean))].sort();
}

function sameEvidenceAreas(left: readonly string[], right: readonly string[]) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function evidenceAreasByCertificate(audits: Array<{ resourceId: string; metadata: unknown }>) {
  const result = new Map<string, string[]>();
  for (const audit of audits) {
    if (!result.has(audit.resourceId)) {
      result.set(audit.resourceId, certificateCompetencyAreasFromAudit(audit.metadata));
    }
  }
  return result;
}

async function certificateEvidenceAreasById(certificateIds: readonly string[]) {
  if (!certificateIds.length) return new Map<string, string[]>();
  const audits = await db.auditLog.findMany({
    where: {
      action: "edu.certificate_issued",
      resourceType: "education_certificate",
      resourceId: { in: [...certificateIds] },
    },
    select: { resourceId: true, metadata: true },
    orderBy: { createdAt: "asc" },
  });
  return evidenceAreasByCertificate(audits);
}

async function certificateAuditOrganizationId(identity: EduIdentity) {
  if (!identity.institutionId) return null;
  const institution = await db.educationInstitution.findFirst({
    where: { id: identity.institutionId, status: "active" },
    select: { organizationId: true },
  });
  return institution?.organizationId?.trim() || null;
}

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "registry", "read")) return deny("Access denied.", 403);
  const identity = await resolveEduIdentity();
  if (!identity || !canEdu(identity.role, "certificate", "read")) return deny("This EDU role cannot read certificate evidence.", 403);

  const certificates = await db.educationCertificate.findMany({
    where: { ...eduInstitutionFilter(identity), enrollment: accessibleEnrollmentWhere(identity) },
    select: {
      id: true,
      enrollmentId: true,
      certificateType: true,
      title: true,
      disclaimer: true,
      serialNumber: true,
      issuedAt: true,
      revokedAt: true,
      revokedReason: true,
      enrollment: { select: { studentDisplayName: true, studentEmail: true, cohortId: true } },
    },
    orderBy: { issuedAt: "desc" },
    take: 250,
  });

  const evidenceAreas = await certificateEvidenceAreasById(certificates.map((certificate) => certificate.id));
  return NextResponse.json({
    data: certificates.map((certificate) => ({
      ...certificate,
      evidenceAreas: evidenceAreas.get(certificate.id) ?? [],
    })),
  }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "registry", "read")) return deny("Access denied.", 403);
  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU identity is associated with this account.", 403);

  const parsed = eduCertificateMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return deny("Invalid certificate request.", 400);
  const body = parsed.data;

  const auditOrganizationId = await certificateAuditOrganizationId(identity);
  if (!auditOrganizationId) {
    return deny("This EDU institution must be linked to an active host Klinikos organization before certificate evidence can be changed.", 409);
  }

  if (body.action === "revoke") {
    if (!canEdu(identity.role, "certificate", "manage")) return deny("Only an EDU administrator may revoke certificate evidence.", 403);

    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "education_certificates"
        WHERE "id" = ${body.certificateId}
          AND "institutionId" = ${identity.institutionId ?? "__no_institution__"}
        FOR UPDATE
      `);

      const existing = await tx.educationCertificate.findFirst({
        where: { id: body.certificateId, ...eduInstitutionFilter(identity) },
      });
      if (!existing) {
        return { kind: "error", message: "Certificate not found.", status: 404 } satisfies CertificateMutationError;
      }
      if (existing.revokedAt) {
        return { kind: "error", message: "This certificate evidence is already revoked.", status: 409 } satisfies CertificateMutationError;
      }

      const revokedAt = new Date();
      const certificate = await tx.educationCertificate.update({
        where: { id: existing.id },
        data: { revokedAt, revokedReason: body.reason },
      });
      await tx.auditLog.create({
        data: {
          organizationId: auditOrganizationId,
          actorId: session.userId,
          actorType: "user",
          action: "edu.certificate_revoked",
          resourceType: "education_certificate",
          resourceId: certificate.id,
          metadata: {
            institutionId: identity.institutionId,
            enrollmentId: existing.enrollmentId,
            serialNumber: existing.serialNumber,
            revokedAt: revokedAt.toISOString(),
          },
        },
      });

      const issueAudits = await tx.auditLog.findMany({
        where: {
          action: "edu.certificate_issued",
          resourceType: "education_certificate",
          resourceId: certificate.id,
        },
        select: { resourceId: true, metadata: true },
        orderBy: { createdAt: "asc" },
      });
      const evidenceAreas = evidenceAreasByCertificate(issueAudits);
      return { kind: "ok" as const, certificate, evidenceAreas: evidenceAreas.get(certificate.id) ?? [] };
    });

    if (result.kind === "error") return deny(result.message, result.status, result.problems);
    return NextResponse.json({ data: { ...result.certificate, evidenceAreas: result.evidenceAreas } }, { headers: NO_STORE });
  }

  if (!canEdu(identity.role, "certificate", "create")) return deny("This EDU role cannot issue certificate evidence.", 403);

  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`
      SELECT "id" FROM "education_enrollments"
      WHERE "id" = ${body.enrollmentId}
        AND "institutionId" = ${identity.institutionId ?? "__no_institution__"}
      FOR UPDATE
    `);

    const enrollment = await tx.educationEnrollment.findFirst({
      where: { id: body.enrollmentId, ...accessibleEnrollmentWhere(identity) },
      select: {
        id: true,
        institutionId: true,
        status: true,
        competencies: { select: { competencyArea: true, status: true } },
      },
    });
    if (!enrollment) {
      return { kind: "error", message: "Enrollment not found in your EDU scope.", status: 404 } satisfies CertificateMutationError;
    }

    const demonstratedCompetencyAreas = enrollment.competencies
      .filter((competency) => competency.status === "demonstrated")
      .map((competency) => competency.competencyArea);
    const evidenceAreas = normalizedEvidenceAreas(body.certificateType, body.competencyAreas);
    const problems = validateEduCertificateEvidence({
      certificateType: body.certificateType,
      enrollmentStatus: enrollment.status,
      requestedCompetencyAreas: evidenceAreas,
      demonstratedCompetencyAreas,
    });
    if (problems.length) {
      return {
        kind: "error",
        message: "Certificate evidence requirements are not satisfied.",
        status: 409,
        problems,
      } satisfies CertificateMutationError;
    }

    const duplicateCandidates = await tx.educationCertificate.findMany({
      where: {
        institutionId: enrollment.institutionId,
        enrollmentId: enrollment.id,
        certificateType: body.certificateType,
        title: body.title,
        revokedAt: null,
      },
      orderBy: { issuedAt: "desc" },
      take: 50,
    });
    const duplicateAuditRows = duplicateCandidates.length
      ? await tx.auditLog.findMany({
          where: {
            action: "edu.certificate_issued",
            resourceType: "education_certificate",
            resourceId: { in: duplicateCandidates.map((certificate) => certificate.id) },
          },
          select: { resourceId: true, metadata: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
    const duplicateAreas = evidenceAreasByCertificate(duplicateAuditRows);
    const activeDuplicate = duplicateCandidates.find((certificate) => sameEvidenceAreas(duplicateAreas.get(certificate.id) ?? [], evidenceAreas));
    if (activeDuplicate) {
      return {
        kind: "duplicate" as const,
        certificate: activeDuplicate,
        evidenceAreas: duplicateAreas.get(activeDuplicate.id) ?? [],
      };
    }

    const certificate = await tx.educationCertificate.create({
      data: {
        institutionId: enrollment.institutionId,
        enrollmentId: enrollment.id,
        certificateType: body.certificateType,
        title: body.title,
        disclaimer: EDU_CERTIFICATE_DISCLAIMER,
        serialNumber: serialNumber(),
        issuedByUserId: session.userId,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: auditOrganizationId,
        actorId: session.userId,
        actorType: "user",
        action: "edu.certificate_issued",
        resourceType: "education_certificate",
        resourceId: certificate.id,
        metadata: {
          institutionId: identity.institutionId,
          enrollmentId: enrollment.id,
          certificateType: body.certificateType,
          competencyAreas: evidenceAreas,
          serialNumber: certificate.serialNumber,
        },
      },
    });
    return { kind: "created" as const, certificate, evidenceAreas };
  });

  if (result.kind === "error") return deny(result.message, result.status, result.problems);
  if (result.kind === "duplicate") {
    return NextResponse.json({
      data: { ...result.certificate, evidenceAreas: result.evidenceAreas },
      duplicate: true,
    }, { headers: NO_STORE });
  }
  return NextResponse.json({ data: { ...result.certificate, evidenceAreas: result.evidenceAreas } }, { status: 201, headers: NO_STORE });
}
