import type { Prisma } from "@prisma/client";
import { EduCertificateManager } from "@/components/edu/edu-certificate-manager";
import { EduCommandHeader } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { certificateCompetencyAreasFromAudit } from "@/lib/edu/certificate-rules";
import { canEdu } from "@/lib/edu/edu-roles";
import { CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduCertificatesPage() {
  const identity = await resolveEduIdentity();
  if (!identity || !canEdu(identity.role, "certificate", "read")) return null;

  const enrollmentScope: Prisma.EducationEnrollmentWhereInput = identity.role === "edu_admin"
    ? eduInstitutionFilter(identity)
    : identity.role === "edu_student"
      ? { ...eduInstitutionFilter(identity), studentEmail: identity.session.email.trim().toLowerCase() }
      : { ...eduInstitutionFilter(identity), cohortId: identity.cohortIds.length ? { in: identity.cohortIds } : "__no_cohort__" };

  const [certificates, enrollments] = await Promise.all([
    db.educationCertificate.findMany({
      where: { ...eduInstitutionFilter(identity), enrollment: enrollmentScope },
      select: {
        id: true,
        certificateType: true,
        title: true,
        disclaimer: true,
        serialNumber: true,
        issuedAt: true,
        revokedAt: true,
        revokedReason: true,
        enrollment: { select: { studentDisplayName: true, studentEmail: true } },
      },
      orderBy: { issuedAt: "desc" },
      take: 250,
    }),
    canEdu(identity.role, "certificate", "create")
      ? db.educationEnrollment.findMany({
          where: enrollmentScope,
          select: {
            id: true,
            studentDisplayName: true,
            status: true,
            competencies: { where: { status: "demonstrated" }, select: { competencyArea: true } },
          },
          orderBy: { studentDisplayName: "asc" },
          take: 500,
        })
      : Promise.resolve([]),
  ]);

  const issuanceAudits = certificates.length
    ? await db.auditLog.findMany({
        where: {
          action: "edu.certificate_issued",
          resourceType: "education_certificate",
          resourceId: { in: certificates.map((certificate) => certificate.id) },
        },
        select: { resourceId: true, metadata: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const evidenceAreasByCertificate = new Map<string, string[]>();
  for (const audit of issuanceAudits) {
    if (!evidenceAreasByCertificate.has(audit.resourceId)) {
      evidenceAreasByCertificate.set(audit.resourceId, certificateCompetencyAreasFromAudit(audit.metadata));
    }
  }

  return <>
    <EduCommandHeader
      eyebrow="Educational evidence"
      title="Certificates"
      description="Issue and review completion or competency evidence. These records never replace licensure, credentialing, clinical privileges, or Grid eligibility checks."
    />
    <div className="px-5 py-6 sm:px-8">
      <EduCertificateManager
        canIssue={canEdu(identity.role, "certificate", "create")}
        canRevoke={canEdu(identity.role, "certificate", "manage")}
        certificates={certificates.map((certificate) => ({
          ...certificate,
          evidenceAreas: evidenceAreasByCertificate.get(certificate.id) ?? [],
          issuedAt: certificate.issuedAt.toISOString(),
          revokedAt: certificate.revokedAt?.toISOString() ?? null,
        }))}
        enrollments={enrollments.map((enrollment) => ({
          id: enrollment.id,
          studentDisplayName: enrollment.studentDisplayName,
          status: enrollment.status,
          demonstratedCompetencyAreas: enrollment.competencies.map((competency) => competency.competencyArea),
        }))}
      />
      <p className="mt-6 max-w-4xl border-t border-white/10 pt-5 text-[11px] leading-5 text-slate-500">{CREDENTIAL_DISCLAIMER}</p>
    </div>
  </>;
}
