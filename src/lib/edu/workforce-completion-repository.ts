import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  eduCohortFilter,
  eduInstitutionFilter,
  type EduIdentity,
} from "@/lib/edu/edu-session";
import {
  buildBatchWorkforceCompletionEvidence,
  type BatchCompletionAttendance,
  type BatchCompletionSession,
} from "@/lib/edu/workforce/workforce-completion-batch";
import { buildWorkforceCompletionReview } from "@/lib/edu/workforce-completion-review";
import { summarizePairedKnowledgeChange, type WorkforceKnowledgeAssessmentRow } from "@/lib/edu/workforce-knowledge-repository";

export type WorkforceCompletionEvidence = {
  enrollmentId: string;
  cohortId: string;
  courseId: string;
  studentDisplayName: string;
  studentEmail: string;
  enrollmentStatus: string;
  completedAt: string | null;
  scheduledMinutes: number;
  verifiedMinutesPresent: number;
  attendancePercent: number;
  requiredActivities: number;
  gradedActivities: number;
  requiredKnowledgePairs: number;
  comparableKnowledgePairs: number;
  averageKnowledgeChange: number | null;
  resolution: ReturnType<typeof buildWorkforceCompletionReview>["resolution"];
};

type SessionEvidenceRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
};

type AttendanceEvidenceRow = {
  sessionId: string;
  status: string;
  verifiedAt: Date | null;
  minutesPresent: number | null;
};

type BatchSessionEvidenceRow = BatchCompletionSession;
type BatchAttendanceEvidenceRow = BatchCompletionAttendance;

function requireInstitution(identity: EduIdentity) {
  if (!identity.institutionId) throw new Error("Education institution context is required.");
  return identity.institutionId;
}

function mayReadEnrollment(identity: EduIdentity, cohortId: string, enrollmentId: string) {
  if (identity.role === "edu_admin") return true;
  if (!identity.cohortIds.includes(cohortId)) return false;
  if (identity.role === "edu_student") return identity.enrollmentId === enrollmentId;
  return true;
}

function mayFinalize(identity: EduIdentity, cohortId: string) {
  if (identity.role === "edu_admin") return true;
  return identity.role === "edu_instructor" && identity.cohortIds.includes(cohortId);
}

function sessionMinutes(session: SessionEvidenceRow) {
  return Math.max(0, Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / 60000));
}

function verifiedMinutesForSession(session: SessionEvidenceRow, attendance: AttendanceEvidenceRow | undefined) {
  if (!attendance?.verifiedAt) return 0;
  const total = sessionMinutes(session);
  if (attendance.status === "present") return Math.min(attendance.minutesPresent ?? total, total);
  if (attendance.status === "partial") return Math.min(attendance.minutesPresent ?? 0, total);
  return 0;
}

/**
 * Batch read path for institutional Completion Review.
 *
 * The original page called `getEnrollmentCompletionEvidence` once per participant,
 * multiplying sessions/attendance/activity/submission/knowledge queries by roster size.
 * This function loads each evidence family once for the accessible enrollment set and
 * then applies the same deterministic completion policy in memory.
 *
 * Finalization intentionally does NOT use this batch projection. The consequential
 * write path re-reads one enrollment through `getEnrollmentCompletionEvidence` inside
 * the existing authority boundary immediately before completion is finalized.
 */
export async function listWorkforceCompletionEvidence(identity: EduIdentity, input?: {
  minimumAttendancePercent?: number;
  requiredKnowledgePairs?: number;
  limit?: number;
}): Promise<WorkforceCompletionEvidence[]> {
  const institutionId = requireInstitution(identity);
  const minimumAttendancePercent = input?.minimumAttendancePercent ?? 80;
  const requiredKnowledgePairs = input?.requiredKnowledgePairs ?? 1;
  const limit = Math.min(Math.max(input?.limit ?? 150, 1), 500);

  const enrollments = await db.educationEnrollment.findMany({
    where: {
      ...eduInstitutionFilter(identity),
      ...eduCohortFilter(identity),
      status: { in: ["active", "completed"] },
    },
    select: {
      id: true,
      cohortId: true,
      studentDisplayName: true,
      studentEmail: true,
      status: true,
      completedAt: true,
      cohort: { select: { courseId: true } },
    },
    orderBy: [{ studentDisplayName: "asc" }, { studentEmail: "asc" }],
    take: limit,
  });

  if (!enrollments.length) return [];

  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const cohortIds = [...new Set(enrollments.map((enrollment) => enrollment.cohortId))];

  const [sessions, attendance, requiredActivityGroups, gradedActivityGroups, knowledgeRows] = await Promise.all([
    db.$queryRaw<BatchSessionEvidenceRow[]>(Prisma.sql`
      SELECT id, "cohortId", "startsAt", "endsAt"
      FROM education_sessions
      WHERE "institutionId" = ${institutionId}
        AND "cohortId" IN (${Prisma.join(cohortIds)})
        AND (
          status IN ('open', 'completed')
          OR (status = 'scheduled' AND "endsAt" <= CURRENT_TIMESTAMP)
        )
      ORDER BY "startsAt" ASC
    `),
    db.$queryRaw<BatchAttendanceEvidenceRow[]>(Prisma.sql`
      SELECT "sessionId", "enrollmentId", status, "verifiedAt", "minutesPresent"
      FROM education_attendance_records
      WHERE "institutionId" = ${institutionId}
        AND "enrollmentId" IN (${Prisma.join(enrollmentIds)})
    `),
    db.educationScenarioAssignment.groupBy({
      by: ["cohortId"],
      where: {
        institutionId,
        cohortId: { in: cohortIds },
        status: { not: "draft" },
      },
      _count: { _all: true },
    }),
    db.educationSubmission.groupBy({
      by: ["enrollmentId"],
      where: {
        institutionId,
        enrollmentId: { in: enrollmentIds },
        grade: { is: { releasedToStudent: true } },
      },
      _count: { _all: true },
    }),
    db.$queryRaw<WorkforceKnowledgeAssessmentRow[]>(Prisma.sql`
      SELECT * FROM education_knowledge_assessment_attempts
      WHERE "institutionId" = ${institutionId}
        AND "enrollmentId" IN (${Prisma.join(enrollmentIds)})
      ORDER BY "completedAt" DESC
    `),
  ]);

  const requiredActivitiesByCohort = new Map(
    requiredActivityGroups.map((row) => [row.cohortId, row._count._all]),
  );
  const gradedActivitiesByEnrollment = new Map(
    gradedActivityGroups
      .filter((row): row is typeof row & { enrollmentId: string } => Boolean(row.enrollmentId))
      .map((row) => [row.enrollmentId, row._count._all]),
  );

  const knowledgeRowsByEnrollment = new Map<string, WorkforceKnowledgeAssessmentRow[]>();
  for (const row of knowledgeRows) {
    knowledgeRowsByEnrollment.set(row.enrollmentId, [
      ...(knowledgeRowsByEnrollment.get(row.enrollmentId) ?? []),
      row,
    ]);
  }
  const knowledgeByEnrollment = new Map(
    [...knowledgeRowsByEnrollment.entries()].map(([enrollmentId, rows]) => [
      enrollmentId,
      summarizePairedKnowledgeChange(rows),
    ]),
  );

  return buildBatchWorkforceCompletionEvidence({
    minimumAttendancePercent,
    requiredKnowledgePairs,
    enrollments: enrollments.map((enrollment) => ({
      id: enrollment.id,
      cohortId: enrollment.cohortId,
      courseId: enrollment.cohort.courseId,
      studentDisplayName: enrollment.studentDisplayName,
      studentEmail: enrollment.studentEmail,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
    })),
    sessions,
    attendance,
    requiredActivitiesByCohort,
    gradedActivitiesByEnrollment,
    knowledgeByEnrollment,
  });
}

export async function getEnrollmentCompletionEvidence(identity: EduIdentity, input: {
  enrollmentId: string;
  minimumAttendancePercent?: number;
  requiredKnowledgePairs?: number;
  instructorApproved?: boolean;
}): Promise<WorkforceCompletionEvidence> {
  const institutionId = requireInstitution(identity);
  const enrollment = await db.educationEnrollment.findFirst({
    where: { id: input.enrollmentId, institutionId },
    select: {
      id: true,
      cohortId: true,
      studentDisplayName: true,
      studentEmail: true,
      status: true,
      completedAt: true,
      cohort: { select: { courseId: true } },
    },
  });
  if (!enrollment || !mayReadEnrollment(identity, enrollment.cohortId, enrollment.id)) {
    throw new Error("Enrollment not found in your EDU scope.");
  }

  const [sessions, attendance, requiredActivities, gradedActivities, knowledgeRows] = await Promise.all([
    db.$queryRaw<SessionEvidenceRow[]>(Prisma.sql`
      SELECT id, "startsAt", "endsAt", status
      FROM education_sessions
      WHERE "institutionId" = ${institutionId}
        AND "cohortId" = ${enrollment.cohortId}
        AND (
          status IN ('open', 'completed')
          OR (status = 'scheduled' AND "endsAt" <= CURRENT_TIMESTAMP)
        )
      ORDER BY "startsAt" ASC
    `),
    db.$queryRaw<AttendanceEvidenceRow[]>(Prisma.sql`
      SELECT "sessionId", status, "verifiedAt", "minutesPresent"
      FROM education_attendance_records
      WHERE "institutionId" = ${institutionId}
        AND "enrollmentId" = ${enrollment.id}
    `),
    db.educationScenarioAssignment.count({
      where: { institutionId, cohortId: enrollment.cohortId, status: { not: "draft" } },
    }),
    db.educationSubmission.count({
      where: {
        institutionId,
        enrollmentId: enrollment.id,
        grade: { is: { releasedToStudent: true } },
      },
    }),
    db.$queryRaw<WorkforceKnowledgeAssessmentRow[]>(Prisma.sql`
      SELECT * FROM education_knowledge_assessment_attempts
      WHERE "institutionId" = ${institutionId}
        AND "enrollmentId" = ${enrollment.id}
      ORDER BY "completedAt" DESC
    `),
  ]);

  const attendanceBySession = new Map(attendance.map((record) => [record.sessionId, record]));
  const scheduledMinutes = sessions.reduce((sum, session) => sum + sessionMinutes(session), 0);
  const verifiedMinutesPresent = sessions.reduce(
    (sum, session) => sum + verifiedMinutesForSession(session, attendanceBySession.get(session.id)),
    0,
  );
  const knowledge = summarizePairedKnowledgeChange(knowledgeRows);
  const review = buildWorkforceCompletionReview({
    minimumAttendancePercent: input.minimumAttendancePercent ?? 80,
    scheduledMinutes,
    verifiedMinutesPresent,
    requiredActivities,
    gradedActivities,
    requiredKnowledgePairs: input.requiredKnowledgePairs ?? 1,
    comparableKnowledgePairs: knowledge.pairedParticipants,
    instructorApproved: input.instructorApproved ?? false,
  });

  return {
    enrollmentId: enrollment.id,
    cohortId: enrollment.cohortId,
    courseId: enrollment.cohort.courseId,
    studentDisplayName: enrollment.studentDisplayName,
    studentEmail: enrollment.studentEmail,
    enrollmentStatus: enrollment.status,
    completedAt: enrollment.completedAt?.toISOString() ?? null,
    scheduledMinutes,
    verifiedMinutesPresent,
    attendancePercent: review.attendancePercent,
    requiredActivities,
    gradedActivities,
    requiredKnowledgePairs: input.requiredKnowledgePairs ?? 1,
    comparableKnowledgePairs: knowledge.pairedParticipants,
    averageKnowledgeChange: knowledge.averagePercentagePointChange,
    resolution: review.resolution,
  };
}

export async function finalizeEnrollmentCompletion(identity: EduIdentity, input: {
  enrollmentId: string;
  minimumAttendancePercent?: number;
  requiredKnowledgePairs?: number;
}) {
  const preview = await getEnrollmentCompletionEvidence(identity, {
    ...input,
    instructorApproved: true,
  });
  if (!mayFinalize(identity, preview.cohortId)) {
    throw new Error("Instructor or education administrator authority is required to finalize completion.");
  }
  if (preview.resolution.status !== "complete") {
    throw new Error(`Completion requirements are not satisfied: ${preview.resolution.blockers.join(", ") || "unknown blocker"}.`);
  }

  const institutionId = requireInstitution(identity);
  const completedAt = new Date();
  const updated = await db.educationEnrollment.update({
    where: { id: preview.enrollmentId },
    data: { status: "completed", completedAt },
    select: { id: true, status: true, completedAt: true },
  });

  await db.auditLog.create({
    data: {
      organizationId: identity.session.organizationId,
      actorId: identity.session.userId,
      actorType: "user",
      action: "edu.completion_finalized",
      resourceType: "education_enrollment",
      resourceId: preview.enrollmentId,
      metadata: {
        institutionId,
        cohortId: preview.cohortId,
        courseId: preview.courseId,
        attendancePercent: preview.attendancePercent,
        requiredActivities: preview.requiredActivities,
        gradedActivities: preview.gradedActivities,
        requiredKnowledgePairs: preview.requiredKnowledgePairs,
        comparableKnowledgePairs: preview.comparableKnowledgePairs,
        containsPhi: false,
      },
    },
  });

  return { ...updated, completedAt: updated.completedAt?.toISOString() ?? null };
}
