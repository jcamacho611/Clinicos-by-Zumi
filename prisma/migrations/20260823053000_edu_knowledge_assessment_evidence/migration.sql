-- Workforce knowledge-assessment evidence for institutional EDU programs.
-- Separate from self-reported confidence surveys and scenario/rubric grades so reporting
-- cannot silently present sentiment as measured knowledge change.

CREATE TABLE IF NOT EXISTS education_knowledge_assessment_attempts (
  id text PRIMARY KEY,
  "institutionId" text NOT NULL,
  "courseId" text NOT NULL,
  "cohortId" text NOT NULL,
  "enrollmentId" text NOT NULL,
  "sessionId" text,
  "assessmentKey" text NOT NULL,
  phase text NOT NULL,
  "attemptNumber" integer NOT NULL DEFAULT 1,
  "pointsAwarded" integer NOT NULL,
  "pointsPossible" integer NOT NULL,
  "instructorReviewed" boolean NOT NULL DEFAULT false,
  "reviewedByUserId" text,
  "reviewedAt" timestamp without time zone,
  "completedAt" timestamp without time zone NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL,
  CONSTRAINT education_knowledge_assessment_institution_fkey FOREIGN KEY ("institutionId") REFERENCES education_institutions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_knowledge_assessment_course_fkey FOREIGN KEY ("courseId") REFERENCES education_courses(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_knowledge_assessment_cohort_fkey FOREIGN KEY ("cohortId") REFERENCES education_cohorts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_knowledge_assessment_enrollment_fkey FOREIGN KEY ("enrollmentId") REFERENCES education_enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT education_knowledge_assessment_session_fkey FOREIGN KEY ("sessionId") REFERENCES education_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT education_knowledge_assessment_phase_check CHECK (phase IN ('pre','post')),
  CONSTRAINT education_knowledge_assessment_attempt_check CHECK ("attemptNumber" > 0),
  CONSTRAINT education_knowledge_assessment_points_possible_check CHECK ("pointsPossible" > 0),
  CONSTRAINT education_knowledge_assessment_points_awarded_check CHECK ("pointsAwarded" >= 0 AND "pointsAwarded" <= "pointsPossible"),
  CONSTRAINT education_knowledge_assessment_review_check CHECK (("instructorReviewed" = false AND "reviewedAt" IS NULL AND "reviewedByUserId" IS NULL) OR ("instructorReviewed" = true AND "reviewedAt" IS NOT NULL AND "reviewedByUserId" IS NOT NULL)),
  CONSTRAINT education_knowledge_assessment_attempt_key UNIQUE ("enrollmentId", "assessmentKey", phase, "attemptNumber")
);

CREATE INDEX IF NOT EXISTS education_knowledge_assessment_institution_completed_idx ON education_knowledge_assessment_attempts ("institutionId", "completedAt");
CREATE INDEX IF NOT EXISTS education_knowledge_assessment_cohort_phase_idx ON education_knowledge_assessment_attempts ("cohortId", phase);
CREATE INDEX IF NOT EXISTS education_knowledge_assessment_enrollment_phase_idx ON education_knowledge_assessment_attempts ("enrollmentId", phase);
CREATE INDEX IF NOT EXISTS education_knowledge_assessment_review_idx ON education_knowledge_assessment_attempts ("institutionId", "instructorReviewed");
