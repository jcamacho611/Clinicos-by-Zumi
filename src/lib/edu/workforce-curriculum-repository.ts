import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { EduIdentity } from "@/lib/edu/edu-session";
import {
  canTransitionCurriculumVersion,
  curriculumVersionRequiresApproval,
  type CurriculumVersionStatus,
} from "@/lib/edu/workforce-curriculum-versioning";

export type WorkforceCurriculumVersionRow = {
  id: string;
  institutionId: string;
  courseId: string;
  version: string;
  status: CurriculumVersionStatus;
  changeSummary: string | null;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  effectiveAt: Date | null;
  retiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function requireInstitution(identity: EduIdentity) {
  if (!identity.institutionId) throw new Error("Education institution context is required.");
  return identity.institutionId;
}

function mayAuthor(role: EduIdentity["role"]) {
  return role === "edu_admin" || role === "edu_instructor";
}

function mayApprove(role: EduIdentity["role"]) {
  return role === "edu_admin";
}

export async function listWorkforceCurriculumVersions(identity: EduIdentity) {
  const institutionId = requireInstitution(identity);
  return db.$queryRaw<WorkforceCurriculumVersionRow[]>(Prisma.sql`
    SELECT * FROM education_curriculum_versions
    WHERE "institutionId" = ${institutionId}
    ORDER BY "createdAt" DESC
    LIMIT 250
  `);
}

export async function createWorkforceCurriculumVersion(identity: EduIdentity, input: {
  courseId: string;
  version: string;
  changeSummary?: string | null;
}) {
  if (!mayAuthor(identity.role)) throw new Error("Instructor or education administrator authority is required.");
  const institutionId = requireInstitution(identity);
  const version = input.version.trim();
  if (!version || version.length > 80) throw new Error("A valid curriculum version label is required.");

  const course = await db.educationCourse.findFirst({
    where: { id: input.courseId, institutionId },
    select: { id: true },
  });
  if (!course) throw new Error("Course not found in this institution.");

  const id = randomUUID();
  const rows = await db.$queryRaw<WorkforceCurriculumVersionRow[]>(Prisma.sql`
    INSERT INTO education_curriculum_versions (
      id, "institutionId", "courseId", version, status, "changeSummary", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${institutionId}, ${input.courseId}, ${version}, 'draft', ${input.changeSummary?.trim() || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `);
  const created = rows[0];
  if (!created) throw new Error("Curriculum version could not be created.");

  await db.auditLog.create({
    data: {
      organizationId: identity.session.organizationId,
      actorId: identity.session.userId,
      actorType: "user",
      action: "edu.curriculum_version_created",
      resourceType: "education_curriculum_version",
      resourceId: id,
      metadata: { institutionId, courseId: input.courseId, version, containsPhi: false },
    },
  });

  return created;
}

export async function transitionWorkforceCurriculumVersion(identity: EduIdentity, input: {
  versionId: string;
  toStatus: CurriculumVersionStatus;
}) {
  const institutionId = requireInstitution(identity);
  if (!mayAuthor(identity.role)) throw new Error("Instructor or education administrator authority is required.");

  const rows = await db.$queryRaw<WorkforceCurriculumVersionRow[]>(Prisma.sql`
    SELECT * FROM education_curriculum_versions
    WHERE id = ${input.versionId} AND "institutionId" = ${institutionId}
    LIMIT 1
  `);
  const current = rows[0];
  if (!current) throw new Error("Curriculum version not found.");
  if (!canTransitionCurriculumVersion(current.status, input.toStatus)) {
    throw new Error(`Curriculum version cannot move from ${current.status} to ${input.toStatus}.`);
  }
  if (curriculumVersionRequiresApproval(input.toStatus) && !mayApprove(identity.role)) {
    throw new Error("Education administrator approval is required for this curriculum state.");
  }

  const approved = curriculumVersionRequiresApproval(input.toStatus);
  const updatedRows = await db.$queryRaw<WorkforceCurriculumVersionRow[]>(Prisma.sql`
    UPDATE education_curriculum_versions
    SET status = ${input.toStatus},
        "approvedByUserId" = CASE WHEN ${approved} THEN ${identity.session.userId} ELSE "approvedByUserId" END,
        "approvedAt" = CASE WHEN ${approved} THEN CURRENT_TIMESTAMP ELSE "approvedAt" END,
        "effectiveAt" = CASE WHEN ${input.toStatus === "active"} THEN COALESCE("effectiveAt", CURRENT_TIMESTAMP) ELSE "effectiveAt" END,
        "retiredAt" = CASE WHEN ${input.toStatus === "retired"} THEN CURRENT_TIMESTAMP ELSE "retiredAt" END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${input.versionId} AND "institutionId" = ${institutionId}
    RETURNING *
  `);
  const updated = updatedRows[0];
  if (!updated) throw new Error("Curriculum version could not be updated.");

  await db.auditLog.create({
    data: {
      organizationId: identity.session.organizationId,
      actorId: identity.session.userId,
      actorType: "user",
      action: "edu.curriculum_version_transitioned",
      resourceType: "education_curriculum_version",
      resourceId: input.versionId,
      metadata: {
        institutionId,
        courseId: current.courseId,
        version: current.version,
        fromStatus: current.status,
        toStatus: input.toStatus,
        containsPhi: false,
      },
    },
  });

  return updated;
}
