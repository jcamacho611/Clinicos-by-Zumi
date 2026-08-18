import { EduCertificateManager } from "@/components/edu/edu-certificate-manager";
import { EduCommandHeader } from "@/components/edu/edu-shell";
import { db } from "@/lib/db";
import { canEdu } from "@/lib/edu/edu-roles";
import { CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";

export const dynamic = "force-dynamic";

export default async function EduCertificatesPage() {
  const identity = await resolveEduIdentity();
  if (!identity || !canEdu(identity.role, "certificate", "read")) return null;

  const enrollmentScope = identity.role === "edu_admin"
    ? eduInstitutionFilter(identity)
    : identity.role === "edu_student"
      ? { ...eduInstitutionFilter(identity), studentEmail: identity.session.email.trim().toLowerCase() }
      : { ...eduInstitutionFilter(identity), cohortId: identity.cohortIds.length ? { in: identity.cohortIds } : "__no_cohort__" };

  const [certificates, enrollments] = process.env.DATABASE_URL
    ? await Promise.all([
        db.educationCertificate.findMany({
          where: { ...eduInstitutionFilter(identity), enrollment: enrollmentScope },
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
        }),
        canEdu(identity.role, "certificate", "create")
          ? db.educationEnrollment.findMany({
              where: enrollmentScope,
              select: {
                id: true,
                studentDisplayName: true,
                studentEmail: true,
                status: true,
                competencies: { where: { status: "demonstrated" }, select: { competencyArea: true } },
              },
              orderBy: { studentDisplayName: "asc" },
              take: 500,
            })
          : Promise.resolve([]),
      ])
    : [[], []];

  return (
    <>
      <EduCommandHeader
        description="Issue and review educational completion or competency evidence. These records never replace licensure, credentialing, privileges, or Grid eligibility checks."
        eyebrow="Educational evidence"
        title="Certificates"
      />
      <div className="px-5 py-6 sm:px-8">
        <EduCertificateManager
          canIssue={canEdu(identity.role, "certificate", "create")}
          canRevoke={canEdu(identity.role, "certificate", "manage")}
          certificates={certificates.map((certificate) => ({
            ...certificate,
            issuedAt: certificate.issuedAt.toISOString(),
            revokedAt: certificate.revokedAt?.toISOString() ?? null,
          }))}
          enrollments={enrollments.map((enrollment) => ({
            id: enrollment.id,
            studentDisplayName: enrollment.studentDisplayName,
            studentEmail: enrollment.studentEmail,
            status: enrollment.status,
            demonstratedCompetencyAreas: enrollment.competencies.map((competency) => competency.competencyArea),
          }))}
        />
        <p className="mt-6 max-w-4xl border-t border-white/10 pt-5 text-[11px] leading-5 text-slate-500">{CREDENTIAL_DISCLAIMER}</p>
      </div>
    </>
  );
}
