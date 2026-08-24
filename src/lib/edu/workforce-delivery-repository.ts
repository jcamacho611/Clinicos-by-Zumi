import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { EduIdentity } from "@/lib/edu/edu-session";
import {
  canManageWorkforceSession,
  canVerifyWorkforceAttendance,
} from "@/lib/edu/workforce-delivery-records";
import type { WorkforceAttendanceStatus } from "@/lib/edu/workforce-delivery-evidence";

export type WorkforceSessionRow = {
  id: string;
  institutionId: string;
  cohortId: string;
  title: string;
  deliveryMode: "in_person" | "live_remote" | "hybrid";
  status: "scheduled" | "open" | "completed" | "cancelled" | "rescheduled";
  instructorUserId: string | null;
  backupInstructorUserId: string | null;
  startsAt: Date;
  endsAt: Date;
  curriculumVersion: string | null;
  materialVersion: string | null;
  locationLabel: string | null;
  remoteJoinProvider: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AttendanceRow = {
  id: string;
  institutionId: string;
  sessionId: string;
  enrollmentId: string;
  status: WorkforceAttendanceStatus;
  evidenceSource: string;
  verifiedByUserId: string | null;
  verifiedAt: Date | null;
  minutesPresent: number | null;
  evidenceNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CountRow = { count: bigint };
type CurriculumVersionRow = {
  id: string;
  institutionId: string;
  courseId: string;
  version: string;
  status: string;
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

function requireTeachingAuthority(identity: EduIdentity, capability: "session" | "attendance") {
  const allowed = capability === "session"
    ? canManageWorkforceSession(identity.role)
    : canVerifyWorkforceAttendance(identity.role);
  if (!allowed) throw new Error("Instructor or education administrator authority is required.");
}

function assertCohortAccess(identity: EduIdentity, cohortId: string) {
  if (identity.role === "edu_admin") return;
  if (!identity.cohortIds.includes(cohortId)) throw new Error("Cohort access is not permitted for this EDU identity.");
}

function serializeSession(row: WorkforceSessionRow) {
  return {
    ...row,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listWorkforceSessions(identity: EduIdentity) {
  const institutionId = requireInstitution(identity);
  const rows = identity.role === "edu_admin"
    ? await db.$queryRaw<WorkforceSessionRow[]>(Prisma.sql`
        SELECT * FROM education_sessions
        WHERE "institutionId" = ${institutionId}
        ORDER BY "startsAt" DESC
        LIMIT 200
      `)
    : identity.cohortIds.length
      ? await db.$queryRaw<WorkforceSessionRow[]>(Prisma.sql`
          SELECT * FROM education_sessions
          WHERE "institutionId" = ${institutionId}
            AND "cohortId" IN (${Prisma.join(identity.cohortIds)})
          ORDER BY "startsAt" DESC
          LIMIT 200
        `)
      : [];
  return rows.map(serializeSession);
}

export async function createWorkforceSession(identity: EduIdentity, input: {
  cohortId: string;
  title: string;
  deliveryMode: "in_person" | "live_remote" | "hybrid";
  startsAt: Date;
  endsAt: Date;
  curriculumVersion?: string | null;
  materialVersion?: string | null;
  locationLabel?: string | null;
  remoteJoinProvider?: string | null;
  backupInstructorUserId?: string | null;
}) {
  requireTeachingAuthority(identity, "session");
  const institutionId = requireInstitution(identity);
  assertCohortAccess(identity, input.cohortId);
  if (!input.title.trim()) throw new Error("Session title is required.");
  if (input.endsAt <= input.startsAt) throw new Error("Session end must be after session start.");

  const cohort = await db.educationCohort.findFirst({
    where: { id: input.cohortId, institutionId },
    select: { id: true },
  });
  if (!cohort) throw new Error("Cohort not found in this institution.");

  const id = randomUUID();
  const rows = await db.$queryRaw<WorkforceSessionRow[]>(Prisma.sql`
    INSERT INTO education_sessions (
      id, "institutionId", "cohortId", title, "deliveryMode", status,
      "instructorUserId", "backupInstructorUserId", "startsAt", "endsAt",
      "curriculumVersion", "materialVersion", "locationLabel", "remoteJoinProvider",
      "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${institutionId}, ${input.cohortId}, ${input.title.trim()}, ${input.deliveryMode}, 'scheduled',
      ${identity.session.userId}, ${input.backupInstructorUserId ?? null}, ${input.startsAt}, ${input.endsAt},
      ${input.curriculumVersion ?? null}, ${input.materialVersion ?? null}, ${input.locationLabel ?? null}, ${input.remoteJoinProvider ?? null},
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `);
  const created = rows[0];
  if (!created) throw new Error("Workforce session could not be created.");

  await db.auditLog.create({
    data: {
      organizationId: identity.session.organizationId,
      actorId: identity.session.userId,
      actorType: "user",
      action: "edu.session_created",
      resourceType: "education_session",
      resourceId: id,
      metadata: {
        institutionId,
        cohortId: input.cohortId,
        deliveryMode: input.deliveryMode,
        containsPhi: false,
      },
    },
  });

  return serializeSession(created);
}

async function requireAccessibleSession(identity: EduIdentity, sessionId: string) {
  const institutionId = requireInstitution(identity);
  const rows = await db.$queryRaw<Array<Pick<WorkforceSessionRow, "id" | "cohortId" | "institutionId">>>(Prisma.sql`
    SELECT id, "cohortId", "institutionId"
    FROM education_sessions
    WHERE id = ${sessionId} AND "institutionId" = ${institutionId}
    LIMIT 1
  `);
  const session = rows[0];
  if (!session) throw new Error("Education session not found.");
  assertCohortAccess(identity, session.cohortId);
  return session;
}

export async function listSessionAttendance(identity: EduIdentity, sessionId: string) {
  await requireAccessibleSession(identity, sessionId);
  return db.$queryRaw<AttendanceRow[]>(Prisma.sql`
    SELECT * FROM education_attendance_records
    WHERE "institutionId" = ${identity.institutionId!}
      AND "sessionId" = ${sessionId}
    ORDER BY "createdAt" ASC
  `);
}

export async function verifySessionAttendance(identity: EduIdentity, input: {
  sessionId: string;
  enrollmentId: string;
  status: WorkforceAttendanceStatus;
  evidenceSource: string;
  minutesPresent?: number | null;
  evidenceNote?: string | null;
}) {
  requireTeachingAuthority(identity, "attendance");
  const institutionId = requireInstitution(identity);
  const session = await requireAccessibleSession(identity, input.sessionId);
  if (!input.evidenceSource.trim()) throw new Error("Attendance evidence source is required.");
  if (input.minutesPresent != null && input.minutesPresent < 0) throw new Error("Attendance minutes cannot be negative.");

  const enrollment = await db.educationEnrollment.findFirst({
    where: { id: input.enrollmentId, institutionId, cohortId: session.cohortId },
    select: { id: true },
  });
  if (!enrollment) throw new Error("Enrollment is not part of this session cohort.");

  const id = randomUUID();
  const rows = await db.$queryRaw<AttendanceRow[]>(Prisma.sql`
    INSERT INTO education_attendance_records (
      id, "institutionId", "sessionId", "enrollmentId", status, "evidenceSource",
      "verifiedByUserId", "verifiedAt", "minutesPresent", "evidenceNote", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${institutionId}, ${input.sessionId}, ${input.enrollmentId}, ${input.status}, ${input.evidenceSource.trim()},
      ${identity.session.userId}, CURRENT_TIMESTAMP, ${input.minutesPresent ?? null}, ${input.evidenceNote ?? null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("sessionId", "enrollmentId") DO UPDATE SET
      status = EXCLUDED.status,
      "evidenceSource" = EXCLUDED."evidenceSource",
      "verifiedByUserId" = EXCLUDED."verifiedByUserId",
      "verifiedAt" = EXCLUDED."verifiedAt",
      "minutesPresent" = EXCLUDED."minutesPresent",
      "evidenceNote" = EXCLUDED."evidenceNote",
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING *
  `);
  const record = rows[0];
  if (!record) throw new Error("Attendance evidence could not be saved.");

  await db.auditLog.create({
    data: {
      organizationId: identity.session.organizationId,
      actorId: identity.session.userId,
      actorType: "user",
      action: "edu.attendance_verified",
      resourceType: "education_attendance",
      resourceId: record.id,
      metadata: {
        institutionId,
        sessionId: input.sessionId,
        enrollmentId: input.enrollmentId,
        status: input.status,
        evidenceSource: input.evidenceSource.trim(),
        containsPhi: false,
      },
    },
  });

  return record;
}

export async function submitWorkforceFeedback(identity: EduIdentity, input: {
  sessionId?: string | null;
  surveyKind?: "participant" | "instructor" | "employer" | "follow_up";
  overallRating?: number | null;
  instructorRating?: number | null;
  confidenceBefore?: number | null;
  confidenceAfter?: number | null;
  wouldRecommend?: boolean | null;
  comments?: string | null;
}) {
  const institutionId = requireInstitution(identity);
  if (input.sessionId) await requireAccessibleSession(identity, input.sessionId);
  const id = randomUUID();
  const enrollmentId = identity.enrollmentId;
  const surveyKind = input.surveyKind ?? (identity.role === "edu_instructor" || identity.role === "edu_admin" ? "instructor" : "participant");

  const rows = await db.$queryRaw<Array<{ id: string; submittedAt: Date }>>(Prisma.sql`
    INSERT INTO education_feedback_responses (
      id, "institutionId", "sessionId", "enrollmentId", "surveyKind", "overallRating", "instructorRating",
      "confidenceBefore", "confidenceAfter", "wouldRecommend", comments, "submittedAt", "createdAt"
    ) VALUES (
      ${id}, ${institutionId}, ${input.sessionId ?? null}, ${enrollmentId}, ${surveyKind}, ${input.overallRating ?? null},
      ${input.instructorRating ?? null}, ${input.confidenceBefore ?? null}, ${input.confidenceAfter ?? null},
      ${input.wouldRecommend ?? null}, ${input.comments?.trim() || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING id, "submittedAt"
  `);
  const created = rows[0];
  if (!created) throw new Error("Feedback could not be saved.");
  return { id: created.id, submittedAt: created.submittedAt.toISOString() };
}

export async function listCurriculumVersions(identity: EduIdentity) {
  const institutionId = requireInstitution(identity);
  return db.$queryRaw<CurriculumVersionRow[]>(Prisma.sql`
    SELECT * FROM education_curriculum_versions
    WHERE "institutionId" = ${institutionId}
    ORDER BY "createdAt" DESC
    LIMIT 200
  `);
}

export async function getWorkforceDeliverySummary(identity: EduIdentity) {
  const institutionId = requireInstitution(identity);
  const [sessions, attendance, feedback, curriculumVersions] = await Promise.all([
    db.$queryRaw<CountRow[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM education_sessions WHERE "institutionId" = ${institutionId}`),
    db.$queryRaw<Array<{ status: WorkforceAttendanceStatus; verifiedAt: Date | null }>>(Prisma.sql`
      SELECT status, "verifiedAt" FROM education_attendance_records WHERE "institutionId" = ${institutionId}
    `),
    db.$queryRaw<CountRow[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM education_feedback_responses WHERE "institutionId" = ${institutionId}`),
    db.$queryRaw<CountRow[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM education_curriculum_versions WHERE "institutionId" = ${institutionId}`),
  ]);

  const verifiedAttended = attendance.filter((record) =>
    record.verifiedAt !== null && (record.status === "present" || record.status === "partial"),
  ).length;
  const verifiedAbsent = attendance.filter((record) =>
    record.verifiedAt !== null && (record.status === "absent" || record.status === "excused"),
  ).length;

  return {
    sessions: Number(sessions[0]?.count ?? BigInt(0)),
    attendanceRecords: attendance.length,
    verifiedAttended,
    verifiedAbsent,
    unverifiedAttendance: attendance.length - verifiedAttended - verifiedAbsent,
    feedbackResponses: Number(feedback[0]?.count ?? BigInt(0)),
    curriculumVersions: Number(curriculumVersions[0]?.count ?? BigInt(0)),
  };
}
