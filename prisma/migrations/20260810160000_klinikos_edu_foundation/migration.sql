-- Klinikos EDU foundation.
--
-- The education layer is structurally isolated from clinical data: no table below
-- has a foreign key to patients, encounters, appointments, or any other clinical
-- record. EDU synthetic patients live inside education_scenarios.payload. That
-- isolation is a property of the schema rather than a filter a query could forget.
--
-- Every scenario is synthetic training data. No table here is designed to hold real
-- protected health information.

CREATE TABLE "education_institutions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "institutionType" TEXT NOT NULL DEFAULT 'college',
  "contactEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "organizationId" TEXT,
  "settings" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_institutions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_institutions_slug_key" ON "education_institutions"("slug");
CREATE INDEX "education_institutions_status_idx" ON "education_institutions"("status");

CREATE TABLE "education_programs" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "programType" TEXT NOT NULL DEFAULT 'allied_health',
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_programs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_programs_institutionId_name_key" ON "education_programs"("institutionId", "name");
CREATE INDEX "education_programs_institutionId_status_idx" ON "education_programs"("institutionId", "status");

CREATE TABLE "education_courses" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "programId" TEXT,
  "curriculumPackageKey" TEXT,
  "title" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "instructorUserId" TEXT,
  "termLabel" TEXT,
  "startsOn" TIMESTAMP(3),
  "endsOn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_courses_institutionId_code_key" ON "education_courses"("institutionId", "code");
CREATE INDEX "education_courses_institutionId_status_idx" ON "education_courses"("institutionId", "status");
CREATE INDEX "education_courses_programId_idx" ON "education_courses"("programId");

CREATE TABLE "education_cohorts" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "instructorUserId" TEXT,
  "maxSeats" INTEGER,
  "startsOn" TIMESTAMP(3),
  "endsOn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_cohorts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_cohorts_courseId_name_key" ON "education_cohorts"("courseId", "name");
CREATE INDEX "education_cohorts_institutionId_status_idx" ON "education_cohorts"("institutionId", "status");

CREATE TABLE "education_enrollments" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "cohortId" TEXT NOT NULL,
  "userId" TEXT,
  "studentEmail" TEXT NOT NULL,
  "studentDisplayName" TEXT NOT NULL,
  "platformRole" TEXT NOT NULL DEFAULT 'edu_student',
  "simulationRole" TEXT,
  "status" TEXT NOT NULL DEFAULT 'invited',
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_enrollments_cohortId_studentEmail_key" ON "education_enrollments"("cohortId", "studentEmail");
CREATE INDEX "education_enrollments_institutionId_status_idx" ON "education_enrollments"("institutionId", "status");
CREATE INDEX "education_enrollments_studentEmail_idx" ON "education_enrollments"("studentEmail");

CREATE TABLE "education_scenarios" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "courseId" TEXT,
  "curriculumPackageKey" TEXT,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "setting" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
  "simulationRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "versionGroupId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL,
  "answerKey" JSONB NOT NULL,
  "authoredByUserId" TEXT,
  "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
  "aiReviewedByUserId" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_scenarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_scenarios_versionGroupId_version_key" ON "education_scenarios"("versionGroupId", "version");
CREATE INDEX "education_scenarios_institutionId_status_idx" ON "education_scenarios"("institutionId", "status");
CREATE INDEX "education_scenarios_courseId_idx" ON "education_scenarios"("courseId");

CREATE TABLE "education_scenario_assignments" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "cohortId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "rubricId" TEXT,
  "title" TEXT NOT NULL,
  "instructions" TEXT,
  "status" TEXT NOT NULL DEFAULT 'assigned',
  "assignedByUserId" TEXT,
  "opensAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_scenario_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_scenario_assignments_cohortId_scenarioId_key" ON "education_scenario_assignments"("cohortId", "scenarioId");
CREATE INDEX "education_scenario_assignments_institutionId_status_idx" ON "education_scenario_assignments"("institutionId", "status");
CREATE INDEX "education_scenario_assignments_dueAt_idx" ON "education_scenario_assignments"("dueAt");

CREATE TABLE "education_scenario_events" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "submissionId" TEXT,
  "actorUserId" TEXT,
  "simulationRole" TEXT,
  "eventType" TEXT NOT NULL,
  "queue" TEXT,
  "taskKey" TEXT,
  "summary" TEXT NOT NULL,
  "detail" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "education_scenario_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "education_scenario_events_assignmentId_occurredAt_idx" ON "education_scenario_events"("assignmentId", "occurredAt");
CREATE INDEX "education_scenario_events_submissionId_occurredAt_idx" ON "education_scenario_events"("submissionId", "occurredAt");

CREATE TABLE "education_rubrics" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "courseId" TEXT,
  "scenarioId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "totalPoints" INTEGER NOT NULL DEFAULT 100,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_rubrics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "education_rubrics_institutionId_status_idx" ON "education_rubrics"("institutionId", "status");

CREATE TABLE "education_rubric_criteria" (
  "id" TEXT NOT NULL,
  "rubricId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "competencyArea" TEXT,
  "maxPoints" INTEGER NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_rubric_criteria_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "education_rubric_criteria_rubricId_orderIndex_idx" ON "education_rubric_criteria"("rubricId", "orderIndex");

CREATE TABLE "education_submissions" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "simulationRole" TEXT,
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "reflection" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_submissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_submissions_assignmentId_enrollmentId_key" ON "education_submissions"("assignmentId", "enrollmentId");
CREATE INDEX "education_submissions_institutionId_status_idx" ON "education_submissions"("institutionId", "status");

CREATE TABLE "education_evidence" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "body" TEXT,
  "documentId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "education_evidence_submissionId_createdAt_idx" ON "education_evidence"("submissionId", "createdAt");

CREATE TABLE "education_grades" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "rubricId" TEXT,
  "pointsAwarded" INTEGER NOT NULL,
  "pointsPossible" INTEGER NOT NULL,
  "criterionScores" JSONB,
  "feedback" TEXT,
  "gradedByUserId" TEXT NOT NULL,
  "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
  "releasedToStudent" BOOLEAN NOT NULL DEFAULT false,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_grades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_grades_submissionId_key" ON "education_grades"("submissionId");
CREATE INDEX "education_grades_institutionId_gradedAt_idx" ON "education_grades"("institutionId", "gradedAt");

CREATE TABLE "education_instructor_notes" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "enrollmentId" TEXT,
  "submissionId" TEXT,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "visibleToStudent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_instructor_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "education_instructor_notes_enrollmentId_createdAt_idx" ON "education_instructor_notes"("enrollmentId", "createdAt");
CREATE INDEX "education_instructor_notes_submissionId_createdAt_idx" ON "education_instructor_notes"("submissionId", "createdAt");

CREATE TABLE "education_competencies" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "competencyArea" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'not_assessed',
  "determinedByUserId" TEXT,
  "determinedAt" TIMESTAMP(3),
  "evidenceSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_competencies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_competencies_enrollmentId_competencyArea_key" ON "education_competencies"("enrollmentId", "competencyArea");
CREATE INDEX "education_competencies_institutionId_status_idx" ON "education_competencies"("institutionId", "status");

CREATE TABLE "education_certificates" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "certificateType" TEXT NOT NULL DEFAULT 'completion',
  "title" TEXT NOT NULL,
  "disclaimer" TEXT NOT NULL,
  "serialNumber" TEXT NOT NULL,
  "issuedByUserId" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "education_certificates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_certificates_serialNumber_key" ON "education_certificates"("serialNumber");
CREATE INDEX "education_certificates_institutionId_issuedAt_idx" ON "education_certificates"("institutionId", "issuedAt");
CREATE INDEX "education_certificates_enrollmentId_idx" ON "education_certificates"("enrollmentId");

-- Foreign keys ---------------------------------------------------------------

ALTER TABLE "education_programs" ADD CONSTRAINT "education_programs_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "education_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_courses" ADD CONSTRAINT "education_courses_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "education_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_courses" ADD CONSTRAINT "education_courses_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "education_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_cohorts" ADD CONSTRAINT "education_cohorts_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "education_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "education_cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "education_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "education_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_scenario_assignments" ADD CONSTRAINT "education_scenario_assignments_cohortId_fkey"
  FOREIGN KEY ("cohortId") REFERENCES "education_cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Restrict, not cascade: deleting a scenario students were graded against must not
-- silently remove the assignment that grade refers to.
ALTER TABLE "education_scenario_assignments" ADD CONSTRAINT "education_scenario_assignments_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "education_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "education_scenario_assignments" ADD CONSTRAINT "education_scenario_assignments_rubricId_fkey"
  FOREIGN KEY ("rubricId") REFERENCES "education_rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_scenario_events" ADD CONSTRAINT "education_scenario_events_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "education_scenario_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_scenario_events" ADD CONSTRAINT "education_scenario_events_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "education_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_rubrics" ADD CONSTRAINT "education_rubrics_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "education_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "education_rubrics" ADD CONSTRAINT "education_rubrics_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "education_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_rubric_criteria" ADD CONSTRAINT "education_rubric_criteria_rubricId_fkey"
  FOREIGN KEY ("rubricId") REFERENCES "education_rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_submissions" ADD CONSTRAINT "education_submissions_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "education_scenario_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_submissions" ADD CONSTRAINT "education_submissions_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "education_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_evidence" ADD CONSTRAINT "education_evidence_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "education_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_grades" ADD CONSTRAINT "education_grades_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "education_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_grades" ADD CONSTRAINT "education_grades_rubricId_fkey"
  FOREIGN KEY ("rubricId") REFERENCES "education_rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_instructor_notes" ADD CONSTRAINT "education_instructor_notes_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "education_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "education_instructor_notes" ADD CONSTRAINT "education_instructor_notes_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "education_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_competencies" ADD CONSTRAINT "education_competencies_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "education_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_certificates" ADD CONSTRAINT "education_certificates_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "education_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity checks -----------------------------------------------------------

ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_platform_role_check"
  CHECK ("platformRole" IN ('edu_admin', 'edu_instructor', 'edu_assistant', 'edu_student', 'edu_observer'));

ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_simulation_role_check"
  CHECK ("simulationRole" IS NULL OR "simulationRole" IN (
    'front_desk', 'medical_assistant', 'nurse', 'provider',
    'biller', 'coder', 'practice_manager', 'compliance_officer'
  ));

ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_status_check"
  CHECK ("status" IN ('invited', 'active', 'completed', 'withdrawn', 'suspended'));

ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_status_check"
  CHECK ("status" IN ('draft', 'in_review', 'published', 'archived'));

ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_difficulty_check"
  CHECK ("difficulty" IN ('introductory', 'intermediate', 'advanced'));

-- A published scenario must record when it was published, so an assignable
-- scenario always carries the timestamp its version lineage is anchored to.
ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_published_check"
  CHECK ("status" <> 'published' OR "publishedAt" IS NOT NULL);

ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_version_check"
  CHECK ("version" >= 1);

-- An AI-drafted scenario may not be published until a human has reviewed it.
ALTER TABLE "education_scenarios" ADD CONSTRAINT "education_scenarios_ai_review_check"
  CHECK ("status" <> 'published' OR "aiGenerated" = false OR "aiReviewedByUserId" IS NOT NULL);

ALTER TABLE "education_scenario_assignments" ADD CONSTRAINT "education_scenario_assignments_status_check"
  CHECK ("status" IN ('assigned', 'open', 'closed', 'archived'));

ALTER TABLE "education_submissions" ADD CONSTRAINT "education_submissions_status_check"
  CHECK ("status" IN ('not_started', 'in_progress', 'submitted', 'returned', 'graded'));

ALTER TABLE "education_submissions" ADD CONSTRAINT "education_submissions_submitted_check"
  CHECK ("status" NOT IN ('submitted', 'graded') OR "submittedAt" IS NOT NULL);

ALTER TABLE "education_rubric_criteria" ADD CONSTRAINT "education_rubric_criteria_points_check"
  CHECK ("maxPoints" > 0);

-- A grade must be inside its own scale, and a released grade must record release.
ALTER TABLE "education_grades" ADD CONSTRAINT "education_grades_points_check"
  CHECK ("pointsPossible" > 0 AND "pointsAwarded" >= 0 AND "pointsAwarded" <= "pointsPossible");

ALTER TABLE "education_grades" ADD CONSTRAINT "education_grades_release_check"
  CHECK ("releasedToStudent" = false OR "releasedAt" IS NOT NULL);

ALTER TABLE "education_competencies" ADD CONSTRAINT "education_competencies_status_check"
  CHECK ("status" IN ('not_assessed', 'developing', 'approaching', 'achieved', 'not_achieved'));

-- A competency determination is a human act. It may only read as decided when a
-- person and a time are recorded against it.
ALTER TABLE "education_competencies" ADD CONSTRAINT "education_competencies_determination_check"
  CHECK ("status" IN ('not_assessed', 'developing') OR ("determinedByUserId" IS NOT NULL AND "determinedAt" IS NOT NULL));

ALTER TABLE "education_certificates" ADD CONSTRAINT "education_certificates_type_check"
  CHECK ("certificateType" IN ('completion', 'specialist'));

-- The credential disclaimer is not optional and cannot be blanked out.
ALTER TABLE "education_certificates" ADD CONSTRAINT "education_certificates_disclaimer_check"
  CHECK (length(btrim("disclaimer")) >= 80);

ALTER TABLE "education_certificates" ADD CONSTRAINT "education_certificates_revocation_check"
  CHECK (("revokedAt" IS NULL) = ("revokedReason" IS NULL));
