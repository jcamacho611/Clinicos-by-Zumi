import { z } from "zod";
import { canEdu, eduSimulationRoles, type EduPlatformRole } from "@/lib/edu/edu-roles";

/**
 * Submission and grading rules for Klinikos EDU.
 *
 * These govern student work and the assessment of it, which is the part of EDU with
 * real consequences for a person: a grade affects a transcript, and a competency
 * determination affects whether someone believes they are ready to work in a clinic.
 *
 * Two properties this module exists to guarantee:
 *   - A student can never advance their own work past submission, and can never
 *     release, alter, or see a grade before an instructor releases it.
 *   - A recorded grade always agrees with its own breakdown. A total that disagrees
 *     with the criterion scores behind it is exactly what a student appeals, and
 *     "the instructor typed it" is not an answer.
 *
 * Pure module. No database, no network.
 */

export const submissionStatuses = ["not_started", "in_progress", "submitted", "graded", "returned"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

/** Statuses in which a student may still change their work. */
const STUDENT_EDITABLE: readonly SubmissionStatus[] = ["not_started", "in_progress"];

export function studentMayEdit(status: SubmissionStatus) {
  return STUDENT_EDITABLE.includes(status);
}

export const submissionTransitions = ["start", "submit", "grade", "return", "reopen"] as const;
export type SubmissionTransition = (typeof submissionTransitions)[number];

type TransitionRule = {
  from: readonly SubmissionStatus[];
  to: SubmissionStatus;
  /** Who may perform it. `student` means the enrolled owner of this submission. */
  actor: "student" | "assessor";
};

/**
 * The lifecycle.
 *
 * `reopen` is an assessor action, not a student one. A student who wants another
 * attempt asks; a student who could reopen their own submitted work could revise it
 * after seeing how far a classmate got.
 */
const TRANSITIONS: Record<SubmissionTransition, TransitionRule> = {
  start: { from: ["not_started"], to: "in_progress", actor: "student" },
  submit: { from: ["in_progress"], to: "submitted", actor: "student" },
  grade: { from: ["submitted", "graded"], to: "graded", actor: "assessor" },
  return: { from: ["graded"], to: "returned", actor: "assessor" },
  reopen: { from: ["submitted", "graded", "returned"], to: "in_progress", actor: "assessor" },
};

export type TransitionDenial = {
  allowed: false;
  reason: "not_permitted" | "not_owner" | "invalid_transition";
  message: string;
};

export type TransitionGrant = { allowed: true; nextStatus: SubmissionStatus };

export function evaluateSubmissionTransition(input: {
  transition: SubmissionTransition;
  currentStatus: SubmissionStatus;
  role: EduPlatformRole;
  /** Enrollment the acting student holds, if any. */
  actorEnrollmentId: string | null;
  /** Enrollment the submission belongs to. */
  submissionEnrollmentId: string;
}): TransitionGrant | TransitionDenial {
  const rule = TRANSITIONS[input.transition];

  if (rule.actor === "student") {
    if (!canEdu(input.role, "submission", "update")) {
      return { allowed: false, reason: "not_permitted", message: "This role cannot change a submission." };
    }
    // Ownership is checked even for instructors: an instructor does not do a
    // student's work for them, and blurring that would make the evidence timeline
    // meaningless as a record of who did what.
    if (!input.actorEnrollmentId || input.actorEnrollmentId !== input.submissionEnrollmentId) {
      return { allowed: false, reason: "not_owner", message: "A submission can only be worked on by the student it belongs to." };
    }
  } else if (!canEdu(input.role, "grade", "grade")) {
    return { allowed: false, reason: "not_permitted", message: "This role cannot assess student work." };
  }

  if (!rule.from.includes(input.currentStatus)) {
    return {
      allowed: false,
      reason: "invalid_transition",
      message: `A submission that is ${input.currentStatus.replace(/_/g, " ")} cannot be ${input.transition === "submit" ? "submitted" : `${input.transition}ed`}.`,
    };
  }

  return { allowed: true, nextStatus: rule.to };
}

/**
 * Lateness is recorded, never blocked.
 *
 * A due date that refuses the work destroys it. An instructor deciding what a late
 * submission is worth is a pedagogical judgement, and the software's job is to tell
 * them the truth about when it arrived.
 */
export function submissionLateness(submittedAt: Date, dueAt: Date | null) {
  if (!dueAt || submittedAt <= dueAt) return { late: false as const, minutesLate: 0 };
  return { late: true as const, minutesLate: Math.ceil((submittedAt.getTime() - dueAt.getTime()) / 60_000) };
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export const evidenceTypes = ["note", "decision", "message_draft", "document_reference", "reflection"] as const;

export const submissionEvidenceSchema = z.object({
  evidenceType: z.enum(evidenceTypes),
  label: z.string().trim().min(2).max(160),
  body: z.string().trim().max(4_000).nullable().default(null),
  /**
   * Uploaded files reuse the governed document custody path. There is no second,
   * weaker upload route for student work.
   */
  documentId: z.string().trim().min(1).max(64).nullable().default(null),
});

export const recordSubmissionEventSchema = z.object({
  eventType: z.string().trim().min(2).max(60),
  queue: z.string().trim().max(60).nullable().default(null),
  taskKey: z.string().trim().max(80).nullable().default(null),
  summary: z.string().trim().min(3).max(400),
  simulationRole: z.enum(eduSimulationRoles).nullable().default(null),
});

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export type RubricCriterion = { id: string; maxPoints: number };

export const criterionScoreSchema = z.object({
  criterionId: z.string().trim().min(1).max(64),
  points: z.number().int().min(0),
  comment: z.string().trim().max(1_000).nullable().default(null),
});

export const recordGradeSchema = z.object({
  submissionId: z.string().trim().min(1).max(64),
  pointsAwarded: z.number().int().min(0),
  criterionScores: z.array(criterionScoreSchema).max(60).default([]),
  feedback: z.string().trim().max(4_000).nullable().default(null),
  /**
   * Provenance only. Recording that an AI draft informed a grade never changes who
   * recorded it, and there is no path by which this field alone produces a grade.
   */
  aiSuggested: z.boolean().default(false),
  /** Whether to release to the student in the same action. */
  release: z.boolean().default(false),
});

export type RecordGradeInput = z.infer<typeof recordGradeSchema>;

/**
 * Validate a grade against the rubric it claims to follow.
 *
 * Returns every problem rather than the first, so an instructor fixes one form once.
 */
export function validateGrade(input: {
  grade: RecordGradeInput;
  criteria: readonly RubricCriterion[];
  /** Rubric total, when a rubric is attached. */
  pointsPossible: number;
}): string[] {
  const problems: string[] = [];

  if (input.pointsPossible <= 0) {
    problems.push("A rubric with no points cannot be used to record a grade.");
  }
  if (input.grade.pointsAwarded > input.pointsPossible) {
    problems.push(`Points awarded (${input.grade.pointsAwarded}) exceed the ${input.pointsPossible} available.`);
  }

  const known = new Map(input.criteria.map((criterion) => [criterion.id, criterion]));
  const seen = new Set<string>();

  for (const score of input.grade.criterionScores) {
    const criterion = known.get(score.criterionId);
    if (!criterion) {
      problems.push(`Criterion "${score.criterionId}" is not part of this rubric.`);
      continue;
    }
    if (seen.has(score.criterionId)) {
      problems.push(`Criterion "${score.criterionId}" was scored more than once.`);
    }
    seen.add(score.criterionId);
    if (score.points > criterion.maxPoints) {
      problems.push(`Criterion "${score.criterionId}" was awarded ${score.points} of a possible ${criterion.maxPoints}.`);
    }
  }

  if (input.grade.criterionScores.length > 0) {
    const missing = input.criteria.filter((criterion) => !seen.has(criterion.id));
    if (missing.length > 0) {
      problems.push(`Every criterion must be scored. Missing: ${missing.map((criterion) => criterion.id).join(", ")}.`);
    }

    const total = input.grade.criterionScores.reduce((sum, score) => sum + score.points, 0);
    if (total !== input.grade.pointsAwarded) {
      // The disagreement itself is the defect. Silently trusting either number would
      // produce a grade nobody can defend.
      problems.push(`The criterion scores total ${total}, which does not match the ${input.grade.pointsAwarded} points recorded.`);
    }
  }

  return problems;
}

export function rubricTotalPoints(criteria: readonly RubricCriterion[]) {
  return criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
}

/**
 * What a student may see of a grade.
 *
 * An unreleased grade is not partially visible. Returning the points with the
 * feedback withheld would let a student infer the assessment before the instructor
 * has finished writing it.
 */
export function projectGradeForStudent(grade: {
  pointsAwarded: number;
  pointsPossible: number;
  feedback: string | null;
  criterionScores: unknown;
  releasedToStudent: boolean;
  releasedAt: Date | null;
  aiSuggested: boolean;
} | null) {
  if (!grade || !grade.releasedToStudent) {
    return { released: false as const, message: "Your instructor has not released this assessment yet." };
  }
  return {
    released: true as const,
    pointsAwarded: grade.pointsAwarded,
    pointsPossible: grade.pointsPossible,
    feedback: grade.feedback,
    criterionScores: grade.criterionScores,
    releasedAt: grade.releasedAt,
    /**
     * Disclosed rather than hidden. A student is entitled to know an AI draft was
     * involved in work that was assessed about them — and to know a person recorded it.
     */
    aiInformed: grade.aiSuggested,
  };
}

export const GRADE_AUTHORITY_NOTICE =
  "A person records every grade in Klinikos EDU. AI output is a draft suggestion an instructor accepts, edits, or rejects; it never sets a grade, marks a competency achieved, or certifies readiness to practise.";
