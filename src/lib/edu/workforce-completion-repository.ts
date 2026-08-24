import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { defaultWorkforceCompletionPolicy } from "@/lib/edu/workforce-completion-review";
import type { EduIdentity } from "@/lib/edu/edu-session";
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

/**
 * Finalizing a completion is the moment attendance and knowledge evidence become a
 * credential claim, so the thresholds it is judged against are server-owned.
 *
 * They used to be optional inputs. The page read the policy on the server, handed it to
 * the browser to display, and the browser posted it back — which meant an authenticated
 * instructor could send `minimumAttendancePercent: 0` and `requiredKnowledgePairs: 0`
 * and finalize an enrollment carrying no attendance and no paired knowledge evidence at
 * all. A value that round-trips through a client is not a server value.
 *
 * The preview read still accepts thresholds, because previewing a stricter or looser
 * policy changes nothing durable. Only this path writes a completion, and it reads the
 * policy directly.
 */
export async function finalizeEnrollmentCompletion(identity: EduIdentity, input: {
  enrollmentId: string;
}) {
  const preview = await getEnrollmentCompletionEvidence(identity, {
    enrollmentId: input.enrollmentId,
    minimumAttendancePercent: defaultWorkforceCompletionPolicy.minimumAttendancePercent,
    requiredKnowledgePairs: defaultWorkforceCompletionPolicy.requiredKnowledgePairs,
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
