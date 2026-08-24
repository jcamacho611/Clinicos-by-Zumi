import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { EduIdentity } from "@/lib/edu/edu-session";
import {
  compareKnowledgeAssessments,
  type KnowledgeAssessmentAttempt,
  type KnowledgeAssessmentPhase,
} from "@/lib/edu/workforce-knowledge-measurement";

export type WorkforceKnowledgeAssessmentRow = {
  id: string;
  institutionId: string;
  courseId: string;
  cohortId: string;
  enrollmentId: string;
  sessionId: string | null;
  assessmentKey: string;
  phase: KnowledgeAssessmentPhase;
  attemptNumber: number;
  pointsAwarded: number;
  pointsPossible: number;
  instructorReviewed: boolean;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function requireInstitution(identity: EduIdentity) {
  if (!identity.institutionId) throw new Error("Education institution context is required.");
  return identity.institutionId;
}

function requireMeasurementAuthority(identity: EduIdentity) {
  if (identity.role !== "edu_admin" && identity.role !== "edu_instructor") {
    throw new Error("Instructor or education administrator authority is required.");
  }
}

export async function recordKnowledgeAssessmentAttempt(identity: EduIdentity, input: {
  courseId: string;
  cohortId: string;
  enrollmentId: string;
  sessionId?: string | null;
  assessmentKey: string;
  phase: KnowledgeAssessmentPhase;
  attemptNumber?: number;
  pointsAwarded: number;
  pointsPossible: number;
  completedAt?: Date;
}) {
  requireMeasurementAuthority(identity);
  const institutionId = requireInstitution(identity);
  const assessmentKey = input.assessmentKey.trim();
  const attemptNumber = input.attemptNumber ?? 1;
  if (!assessmentKey || assessmentKey.length > 120) throw new Error("A valid assessment key is required.");
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) throw new Error("Assessment attempt number must be a positive integer.");
  if (!Number.isInteger(input.pointsAwarded) || !Number.isInteger(input.pointsPossible) || input.pointsPossible <= 0 || input.pointsAwarded < 0 || input.pointsAwarded > input.pointsPossible) {
    throw new Error("Assessment score is invalid.");
  }

  const enrollment = await db.educationEnrollment.findFirst({
    where: { id: input.enrollmentId, institutionId, cohortId: input.cohortId },
    select: { id: true, cohort: { select: { courseId: true } } },
  });
  if (!enrollment || enrollment.cohort.courseId !== input.courseId) {
    throw new Error("Assessment enrollment/course context is not valid for this institution.");
  }
  if (input.sessionId) {
    const sessions = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM education_sessions
      WHERE id = ${input.sessionId}
        AND "institutionId" = ${institutionId}
        AND "cohortId" = ${input.cohortId}
      LIMIT 1
    `);
    if (!sessions[0]) throw new Error("Assessment session is not valid for this cohort.");
  }

  const id = randomUUID();
  const completedAt = input.completedAt ?? new Date();
  const rows = await db.$queryRaw<WorkforceKnowledgeAssessmentRow[]>(Prisma.sql`
    INSERT INTO education_knowledge_assessment_attempts (
      id, "institutionId", "courseId", "cohortId", "enrollmentId", "sessionId",
      "assessmentKey", phase, "attemptNumber", "pointsAwarded", "pointsPossible",
      "instructorReviewed", "reviewedByUserId", "reviewedAt", "completedAt", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${institutionId}, ${input.courseId}, ${input.cohortId}, ${input.enrollmentId}, ${input.sessionId ?? null},
      ${assessmentKey}, ${input.phase}, ${attemptNumber}, ${input.pointsAwarded}, ${input.pointsPossible},
      true, ${identity.session.userId}, CURRENT_TIMESTAMP, ${completedAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `);
  const created = rows[0];
  if (!created) throw new Error("Knowledge assessment evidence could not be recorded.");

  await db.auditLog.create({
    data: {
      organizationId: identity.session.organizationId,
      actorId: identity.session.userId,
      actorType: "user",
      action: "edu.knowledge_assessment_recorded",
      resourceType: "education_knowledge_assessment",
      resourceId: id,
      metadata: {
        institutionId,
        courseId: input.courseId,
        cohortId: input.cohortId,
        enrollmentId: input.enrollmentId,
        assessmentKey,
        phase: input.phase,
        attemptNumber,
        containsPhi: false,
      },
    },
  });

  return created;
}

export async function listKnowledgeAssessmentAttempts(identity: EduIdentity) {
  const institutionId = requireInstitution(identity);
  const cohortFilter = identity.role === "edu_admin"
    ? Prisma.empty
    : identity.cohortIds.length
      ? Prisma.sql`AND "cohortId" IN (${Prisma.join(identity.cohortIds)})`
      : Prisma.sql`AND false`;

  return db.$queryRaw<WorkforceKnowledgeAssessmentRow[]>(Prisma.sql`
    SELECT * FROM education_knowledge_assessment_attempts
    WHERE "institutionId" = ${institutionId}
      ${cohortFilter}
    ORDER BY "completedAt" DESC
    LIMIT 1000
  `);
}

function latestReviewed(rows: WorkforceKnowledgeAssessmentRow[], phase: KnowledgeAssessmentPhase) {
  return rows
    .filter((row) => row.phase === phase && row.instructorReviewed && row.reviewedAt)
    .sort((a, b) => b.attemptNumber - a.attemptNumber || b.completedAt.getTime() - a.completedAt.getTime())[0] ?? null;
}

export function summarizePairedKnowledgeChange(rows: WorkforceKnowledgeAssessmentRow[]) {
  const groups = new Map<string, WorkforceKnowledgeAssessmentRow[]>();
  for (const row of rows) {
    const key = `${row.enrollmentId}::${row.assessmentKey}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const paired: Array<{
    enrollmentId: string;
    assessmentKey: string;
    prePercent: number;
    postPercent: number;
    percentagePointChange: number;
  }> = [];

  for (const group of groups.values()) {
    const pre = latestReviewed(group, "pre");
    const post = latestReviewed(group, "post");
    if (!pre || !post) continue;
    const comparison = compareKnowledgeAssessments(
      toAttempt(pre),
      toAttempt(post),
    );
    if (!comparison.comparable || comparison.prePercent == null || comparison.postPercent == null || comparison.percentagePointChange == null) continue;
    paired.push({
      enrollmentId: pre.enrollmentId,
      assessmentKey: pre.assessmentKey,
      prePercent: comparison.prePercent,
      postPercent: comparison.postPercent,
      percentagePointChange: comparison.percentagePointChange,
    });
  }

  const averageChange = paired.length
    ? Math.round((paired.reduce((sum, row) => sum + row.percentagePointChange, 0) / paired.length) * 100) / 100
    : null;

  return { pairedParticipants: paired.length, averagePercentagePointChange: averageChange, pairs: paired };
}

function toAttempt(row: WorkforceKnowledgeAssessmentRow): KnowledgeAssessmentAttempt {
  return {
    phase: row.phase,
    pointsAwarded: row.pointsAwarded,
    pointsPossible: row.pointsPossible,
    completedAt: row.completedAt.toISOString(),
    instructorReviewed: row.instructorReviewed,
  };
}
