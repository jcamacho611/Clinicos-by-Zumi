-- Workforce delivery evidence substrate for institutional EDU programs.
-- This migration is intentionally idempotent because the production Neon schema was first
-- applied through a verified temporary-branch migration before this repository artifact was added.

CREATE TABLE IF NOT EXISTS education_sessions (
  id text PRIMARY KEY,
  "institutionId" text NOT NULL,
  "cohortId" text NOT NULL,
  title text NOT NULL,
  "deliveryMode" text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  "instructorUserId" text,
  "backupInstructorUserId" text,
  "startsAt" timestamp without time zone NOT NULL,
  "endsAt" timestamp without time zone NOT NULL,
  "curriculumVersion" text,
  "materialVersion" text,
  "locationLabel" text,
  "remoteJoinProvider" text,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL,
  CONSTRAINT education_sessions_institution_fkey FOREIGN KEY ("institutionId") REFERENCES education_institutions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_sessions_cohort_fkey FOREIGN KEY ("cohortId") REFERENCES education_cohorts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_sessions_delivery_mode_check CHECK ("deliveryMode" IN ('in_person','live_remote','hybrid')),
  CONSTRAINT education_sessions_status_check CHECK (status IN ('scheduled','open','completed','cancelled','rescheduled')),
  CONSTRAINT education_sessions_time_check CHECK ("endsAt" > "startsAt")
);
CREATE INDEX IF NOT EXISTS education_sessions_institution_starts_idx ON education_sessions ("institutionId", "startsAt");
CREATE INDEX IF NOT EXISTS education_sessions_cohort_starts_idx ON education_sessions ("cohortId", "startsAt");
CREATE INDEX IF NOT EXISTS education_sessions_instructor_starts_idx ON education_sessions ("instructorUserId", "startsAt");

CREATE TABLE IF NOT EXISTS education_attendance_records (
  id text PRIMARY KEY,
  "institutionId" text NOT NULL,
  "sessionId" text NOT NULL,
  "enrollmentId" text NOT NULL,
  status text NOT NULL,
  "evidenceSource" text NOT NULL,
  "verifiedByUserId" text,
  "verifiedAt" timestamp without time zone,
  "minutesPresent" integer,
  "evidenceNote" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL,
  CONSTRAINT education_attendance_institution_fkey FOREIGN KEY ("institutionId") REFERENCES education_institutions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_attendance_session_fkey FOREIGN KEY ("sessionId") REFERENCES education_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_attendance_enrollment_fkey FOREIGN KEY ("enrollmentId") REFERENCES education_enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_attendance_session_enrollment_key UNIQUE ("sessionId", "enrollmentId"),
  CONSTRAINT education_attendance_status_check CHECK (status IN ('present','absent','partial','excused','unverified')),
  CONSTRAINT education_attendance_minutes_check CHECK ("minutesPresent" IS NULL OR "minutesPresent" >= 0),
  CONSTRAINT education_attendance_verification_check CHECK (("verifiedAt" IS NULL AND "verifiedByUserId" IS NULL) OR "verifiedAt" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS education_attendance_institution_status_idx ON education_attendance_records ("institutionId", status);
CREATE INDEX IF NOT EXISTS education_attendance_enrollment_status_idx ON education_attendance_records ("enrollmentId", status);
CREATE INDEX IF NOT EXISTS education_attendance_session_status_idx ON education_attendance_records ("sessionId", status);

CREATE TABLE IF NOT EXISTS education_feedback_responses (
  id text PRIMARY KEY,
  "institutionId" text NOT NULL,
  "sessionId" text,
  "enrollmentId" text,
  "surveyKind" text NOT NULL DEFAULT 'participant',
  "overallRating" integer,
  "instructorRating" integer,
  "confidenceBefore" integer,
  "confidenceAfter" integer,
  "wouldRecommend" boolean,
  comments text,
  "submittedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT education_feedback_institution_fkey FOREIGN KEY ("institutionId") REFERENCES education_institutions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_feedback_session_fkey FOREIGN KEY ("sessionId") REFERENCES education_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT education_feedback_enrollment_fkey FOREIGN KEY ("enrollmentId") REFERENCES education_enrollments(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT education_feedback_survey_kind_check CHECK ("surveyKind" IN ('participant','instructor','employer','follow_up')),
  CONSTRAINT education_feedback_overall_rating_check CHECK ("overallRating" IS NULL OR "overallRating" BETWEEN 1 AND 5),
  CONSTRAINT education_feedback_instructor_rating_check CHECK ("instructorRating" IS NULL OR "instructorRating" BETWEEN 1 AND 5),
  CONSTRAINT education_feedback_confidence_before_check CHECK ("confidenceBefore" IS NULL OR "confidenceBefore" BETWEEN 1 AND 5),
  CONSTRAINT education_feedback_confidence_after_check CHECK ("confidenceAfter" IS NULL OR "confidenceAfter" BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS education_feedback_institution_submitted_idx ON education_feedback_responses ("institutionId", "submittedAt");
CREATE INDEX IF NOT EXISTS education_feedback_session_submitted_idx ON education_feedback_responses ("sessionId", "submittedAt");

CREATE TABLE IF NOT EXISTS education_curriculum_versions (
  id text PRIMARY KEY,
  "institutionId" text NOT NULL,
  "courseId" text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  "changeSummary" text,
  "approvedByUserId" text,
  "approvedAt" timestamp without time zone,
  "effectiveAt" timestamp without time zone,
  "retiredAt" timestamp without time zone,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL,
  CONSTRAINT education_curriculum_institution_fkey FOREIGN KEY ("institutionId") REFERENCES education_institutions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_curriculum_course_fkey FOREIGN KEY ("courseId") REFERENCES education_courses(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_curriculum_course_version_key UNIQUE ("courseId", version),
  CONSTRAINT education_curriculum_status_check CHECK (status IN ('draft','review','approved','active','retired','archived')),
  CONSTRAINT education_curriculum_approval_check CHECK ((status IN ('approved','active','retired') AND "approvedAt" IS NOT NULL) OR status NOT IN ('approved','active','retired'))
);
CREATE INDEX IF NOT EXISTS education_curriculum_institution_status_idx ON education_curriculum_versions ("institutionId", status);
CREATE INDEX IF NOT EXISTS education_curriculum_course_status_idx ON education_curriculum_versions ("courseId", status);
