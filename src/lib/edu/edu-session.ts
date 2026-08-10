import "server-only";

import { db } from "@/lib/db";
import { requireClinicSession } from "@/lib/auth/session";
import type { ClinicSession } from "@/lib/auth/types";
import type { EduPlatformRole } from "@/lib/edu/edu-roles";

/**
 * Resolve the EDU identity for a signed-in Klinikos account.
 *
 * EDU roles are not clinic roles. A clinic owner or administrator administers the
 * institution; everyone else is whatever their enrollment says they are, and an
 * account with no enrollment has no EDU access at all.
 *
 * Institution scope is resolved here once and threaded through every EDU query, so
 * a page cannot accidentally read across institutions.
 */

export type EduIdentity = {
  session: ClinicSession;
  role: EduPlatformRole;
  institutionId: string | null;
  enrollmentId: string | null;
  /** Cohorts this identity may read. Empty for an admin, who reads institution-wide. */
  cohortIds: string[];
};

/** Clinic roles that administer an EDU institution hosted by this tenant. */
function clinicRoleGrantsEduAdmin(role: string) {
  return role === "clinic_owner" || role === "administrator";
}

export async function resolveEduIdentity(): Promise<EduIdentity | null> {
  const session = await requireClinicSession();
  if (!process.env.DATABASE_URL) return null;

  const enrollments = await db.educationEnrollment.findMany({
    where: { studentEmail: session.email.trim().toLowerCase(), status: { in: ["invited", "active", "completed"] } },
    select: { id: true, institutionId: true, cohortId: true, platformRole: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (enrollments.length) {
    // The most privileged enrollment decides the role; scope stays limited to that
    // enrollment's institution.
    const precedence: EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_assistant", "edu_observer", "edu_student"];
    const best = precedence.find((role) => enrollments.some((entry) => entry.platformRole === role)) ?? "edu_student";
    const scoped = enrollments.filter((entry) => entry.platformRole === best);
    return {
      session,
      role: best,
      institutionId: scoped[0]?.institutionId ?? null,
      enrollmentId: scoped[0]?.id ?? null,
      cohortIds: scoped.map((entry) => entry.cohortId),
    };
  }

  if (clinicRoleGrantsEduAdmin(session.role)) {
    const institution = await db.educationInstitution.findFirst({
      where: { organizationId: session.organizationId },
      select: { id: true },
    });
    return { session, role: "edu_admin", institutionId: institution?.id ?? null, enrollmentId: null, cohortIds: [] };
  }

  return null;
}

/**
 * Institution filter for every EDU query.
 *
 * Returns a filter that matches nothing when no institution is resolved, so a
 * missing scope fails closed to an empty result rather than opening the whole table.
 */
export function eduInstitutionFilter(identity: EduIdentity) {
  return identity.institutionId ? { institutionId: identity.institutionId } : { institutionId: "__no_institution__" };
}

/** Additional cohort narrowing for non-admin identities. */
export function eduCohortFilter(identity: EduIdentity) {
  if (identity.role === "edu_admin") return {};
  return identity.cohortIds.length ? { cohortId: { in: identity.cohortIds } } : { cohortId: "__no_cohort__" };
}
