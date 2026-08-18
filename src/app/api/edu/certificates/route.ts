import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  EDU_CERTIFICATE_DISCLAIMER,
  eduCertificateMutationSchema,
  validateEduCertificateEvidence,
} from "@/lib/edu/certificate-rules";
import { canEdu } from "@/lib/edu/edu-roles";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

function deny(message: string, status: 400 | 403 | 404 | 409, problems?: string[]) {
  return NextResponse.json({ error: message, problems }, { status, headers: NO_STORE });
}

function serialNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `KEDU-${date}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

function accessibleEnrollmentWhere(identity: Awaited<ReturnType<typeof resolveEduIdentity>>) {
  if (!identity) return { id: "__no_enrollment__" };
  if (identity.role === "edu_admin") return eduInstitutionFilter(identity);
  if (identity.role === "edu_student") {
    return {
      ...eduInstitutionFilter(identity),
      studentEmail: identity.session.email.trim().toLowerCase(),
    };
  }
  return {
    ...eduInstitutionFilter(identity),
    cohortId: identity.cohortIds.length ? { in: identity.cohortIds } : "__no_cohort__",
  };
}

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "registry", "read")) return deny("Access denied.", 403);

  const identity = await resolveEduIdentity();
  if (!identity || !canEdu(identity.role, "certificate", "read")) return deny("This EDU role cannot read certificates.", 403);

  const certificates = await db.educationCertificate.findMany({
    where: {
      ...eduInstitutionFilter(identity),
      enrollment: accessibleEnrollmentWhere(identity),
    },
    select: {
      id: true,
      enrollmentId: true,
      certificateType: true,
      title: true,
      disclaimer: true,
      serialNumber: true,
      issuedByUserId: true,
      issuedAt: true,
      revokedAt: true,
      revokedReason: true,
      enrollment: { select: { studentDisplayName: true, studentEmail: true, cohortId: true } },
    },
    orderBy: { issuedAt: "desc" },
    take: 250,
  });

  return NextResponse.json({ data: certificates }, { headers: NO_STORE });
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

  if (body.action === "revoke") {
    if (!canEdu(identity.role, "certificate", "manage")) {
      return deny("Only an EDU administrator may revoke certificate evidence.", 403);
    }
    const existing = await db.educationCertificate.findFirst({
      where: { id: body.certificateId, ...eduInstitutionFilter(identity) },
      select: { id: true, revokedAt: true, enrollmentId: true, title: true, serialNumber: true },
    });
    if (!existing) return deny("Certificate not found.", 404);
    if (existing.revokedAt) return deny("This certificate evidence is already revoked.", 409);

    const revokedAt = new Date();
    const certificate = await db.educationCertificate.update({
      where: { id: existing.id },
      data: { revokedAt, revokedReason: body.reason },
    });

    const institution = identity.institutionId
      ? await db.educationInstitution.findUnique({ where: { id: identity.institutionId }, select: { organizationId: true } })
      : null;
    if (institution?.organizationId) {
      await db.auditLog.create({
        data: {
          organizationId: institution.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "edu.certificate_revoked",
          resourceType: "education_certificate",
          resourceId: certificate.id,
          metadata: { enrollmentId: existing.enrollmentId, serialNumber: existing.serialNumber, title: existing.title, revokedAt: revokedAt.toISOString() },
        },
      });
    }

    return NextResponse.json({ data: certificate }, { headers: NO_STORE });
  }

  if (!canEdu(identity.role, "certificate", "create")) {
    return deny("This EDU role cannot issue certificate evidence.", 403);
  }

  const enrollment = await db.educationEnrollment.findFirst({
    where: { id: body.enrollmentId, ...accessibleEnrollmentWhere(identity) },
    select: {
      id: true,
      institutionId: true,
      cohortId: true,
      status: true,
      studentDisplayName: true,
      studentEmail: true,
      competencies: { select: { competencyArea: true, status: true } },
    },
  });
  if (!enrollment) return deny("Enrollment not found in your EDU scope.", 404);

  const demonstratedCompetencyAreas = enrollment.competencies
    .filter((competency) => competency.status === "demonstrated")
    .map((competency) => competency.competencyArea);
  const problems = validateEduCertificateEvidence({
    certificateType: body.certificateType,
    enrollmentStatus: enrollment.status,
    requestedCompetencyAreas: body.competencyAreas,
    demonstratedCompetencyAreas,
  });
  if (problems.length) return deny("Certificate evidence requirements are not satisfied.", 409, problems);

  const activeDuplicate = await db.educationCertificate.findFirst({
    where: {
      institutionId: enrollment.institutionId,
      enrollmentId: enrollment.id,
      certificateType: body.certificateType,
      title: body.title,
      revokedAt: null,
    },
  });
  if (activeDuplicate) {
    return NextResponse.json({ data: activeDuplicate, idempotent: true }, { headers: NO_STORE });
  }

  const certificate = await db.educationCertificate.create({
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

  const institution = await db.educationInstitution.findUnique({
    where: { id: enrollment.institutionId },
    select: { organizationId: true },
  });
  if (institution?.organizationId) {
    await db.auditLog.create({
      data: {
        organizationId: institution.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "edu.certificate_issued",
        resourceType: "education_certificate",
        resourceId: certificate.id,
        metadata: {
          enrollmentId: enrollment.id,
          certificateType: body.certificateType,
          competencyAreas: body.certificateType === "competency_evidence" ? body.competencyAreas : [],
          serialNumber: certificate.serialNumber,
        },
      },
    });
  }

  return NextResponse.json({ data: certificate }, { status: 201, headers: NO_STORE });
}
