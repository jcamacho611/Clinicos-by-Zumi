import { buildWorkforceCompletionReview } from "@/lib/edu/workforce-completion-review";

export type BatchCompletionEnrollment = {
  id: string;
  cohortId: string;
  courseId: string;
  studentDisplayName: string;
  studentEmail: string;
  status: string;
  completedAt: Date | null;
};

export type BatchCompletionSession = {
  id: string;
  cohortId: string;
  startsAt: Date;
  endsAt: Date;
};

export type BatchCompletionAttendance = {
  enrollmentId: string;
  sessionId: string;
  status: string;
  verifiedAt: Date | null;
  minutesPresent: number | null;
};

export type BatchKnowledgeSummary = {
  pairedParticipants: number;
  averagePercentagePointChange: number | null;
};

export type BatchWorkforceCompletionEvidence = {
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

function sessionMinutes(session: BatchCompletionSession) {
  return Math.max(0, Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / 60000));
}

function verifiedMinutesForSession(session: BatchCompletionSession, attendance: BatchCompletionAttendance | undefined) {
  if (!attendance?.verifiedAt) return 0;
  const total = sessionMinutes(session);
  if (attendance.status === "present") return Math.min(attendance.minutesPresent ?? total, total);
  if (attendance.status === "partial") return Math.min(attendance.minutesPresent ?? 0, total);
  return 0;
}

export function buildBatchWorkforceCompletionEvidence(input: {
  minimumAttendancePercent: number;
  requiredKnowledgePairs: number;
  enrollments: readonly BatchCompletionEnrollment[];
  sessions: readonly BatchCompletionSession[];
  attendance: readonly BatchCompletionAttendance[];
  requiredActivitiesByCohort: ReadonlyMap<string, number>;
  gradedActivitiesByEnrollment: ReadonlyMap<string, number>;
  knowledgeByEnrollment: ReadonlyMap<string, BatchKnowledgeSummary>;
}): BatchWorkforceCompletionEvidence[] {
  const sessionsByCohort = new Map<string, BatchCompletionSession[]>();
  const sessionById = new Map<string, BatchCompletionSession>();
  for (const session of input.sessions) {
    sessionById.set(session.id, session);
    sessionsByCohort.set(session.cohortId, [...(sessionsByCohort.get(session.cohortId) ?? []), session]);
  }

  const attendanceByEnrollmentAndSession = new Map<string, BatchCompletionAttendance>();
  for (const record of input.attendance) {
    attendanceByEnrollmentAndSession.set(`${record.enrollmentId}::${record.sessionId}`, record);
  }

  return input.enrollments.map((enrollment) => {
    const cohortSessions = sessionsByCohort.get(enrollment.cohortId) ?? [];
    const scheduledMinutes = cohortSessions.reduce((sum, session) => sum + sessionMinutes(session), 0);
    const verifiedMinutesPresent = cohortSessions.reduce((sum, session) => {
      const record = attendanceByEnrollmentAndSession.get(`${enrollment.id}::${session.id}`);
      if (!record) return sum;
      const authoritativeSession = sessionById.get(record.sessionId);
      if (!authoritativeSession || authoritativeSession.cohortId !== enrollment.cohortId) return sum;
      return sum + verifiedMinutesForSession(authoritativeSession, record);
    }, 0);

    const requiredActivities = input.requiredActivitiesByCohort.get(enrollment.cohortId) ?? 0;
    const gradedActivities = input.gradedActivitiesByEnrollment.get(enrollment.id) ?? 0;
    const knowledge = input.knowledgeByEnrollment.get(enrollment.id) ?? {
      pairedParticipants: 0,
      averagePercentagePointChange: null,
    };

    const review = buildWorkforceCompletionReview({
      minimumAttendancePercent: input.minimumAttendancePercent,
      scheduledMinutes,
      verifiedMinutesPresent,
      requiredActivities,
      gradedActivities,
      requiredKnowledgePairs: input.requiredKnowledgePairs,
      comparableKnowledgePairs: knowledge.pairedParticipants,
      instructorApproved: false,
    });

    return {
      enrollmentId: enrollment.id,
      cohortId: enrollment.cohortId,
      courseId: enrollment.courseId,
      studentDisplayName: enrollment.studentDisplayName,
      studentEmail: enrollment.studentEmail,
      enrollmentStatus: enrollment.status,
      completedAt: enrollment.completedAt?.toISOString() ?? null,
      scheduledMinutes,
      verifiedMinutesPresent,
      attendancePercent: review.attendancePercent,
      requiredActivities,
      gradedActivities,
      requiredKnowledgePairs: input.requiredKnowledgePairs,
      comparableKnowledgePairs: knowledge.pairedParticipants,
      averageKnowledgeChange: knowledge.averagePercentagePointChange,
      resolution: review.resolution,
    };
  });
}
