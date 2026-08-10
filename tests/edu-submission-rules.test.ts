import { describe, expect, it } from "vitest";
import {
  evaluateSubmissionTransition,
  GRADE_AUTHORITY_NOTICE,
  projectGradeForStudent,
  recordGradeSchema,
  rubricTotalPoints,
  studentMayEdit,
  submissionLateness,
  validateGrade,
  type RecordGradeInput,
} from "@/lib/edu/edu-submission-rules";

/**
 * A grade affects a transcript and a competency determination affects whether someone
 * believes they are ready to work in a clinic. These are the assertions that keep
 * those two things honest.
 */

const criteria = [
  { id: "c1", maxPoints: 40 },
  { id: "c2", maxPoints: 35 },
  { id: "c3", maxPoints: 25 },
];

const grade = (overrides: Partial<RecordGradeInput> = {}): RecordGradeInput =>
  recordGradeSchema.parse({ submissionId: "sub_1", pointsAwarded: 88, ...overrides });

describe("the submission lifecycle", () => {
  const student = { role: "edu_student" as const, actorEnrollmentId: "enr_1", submissionEnrollmentId: "enr_1" };
  const instructor = { role: "edu_instructor" as const, actorEnrollmentId: "enr_9", submissionEnrollmentId: "enr_1" };

  it("lets a student start and submit their own work", () => {
    expect(evaluateSubmissionTransition({ transition: "start", currentStatus: "not_started", ...student })).toEqual({
      allowed: true,
      nextStatus: "in_progress",
    });
    expect(evaluateSubmissionTransition({ transition: "submit", currentStatus: "in_progress", ...student })).toEqual({
      allowed: true,
      nextStatus: "submitted",
    });
  });

  it("refuses a student working on someone else's submission", () => {
    expect(
      evaluateSubmissionTransition({
        transition: "submit",
        currentStatus: "in_progress",
        role: "edu_student",
        actorEnrollmentId: "enr_2",
        submissionEnrollmentId: "enr_1",
      }),
    ).toMatchObject({ allowed: false, reason: "not_owner" });
  });

  it("refuses an instructor doing a student's work for them", () => {
    // Ownership is checked regardless of role. Blurring it would make the evidence
    // timeline useless as a record of who did what.
    expect(evaluateSubmissionTransition({ transition: "submit", currentStatus: "in_progress", ...instructor })).toMatchObject({
      allowed: false,
      reason: "not_owner",
    });
  });

  it("never lets a student grade, release, or reopen", () => {
    for (const transition of ["grade", "return", "reopen"] as const) {
      expect(
        evaluateSubmissionTransition({ transition, currentStatus: "submitted", ...student }),
      ).toMatchObject({ allowed: false, reason: "not_permitted" });
    }
  });

  it("refuses an observer any assessment action", () => {
    expect(
      evaluateSubmissionTransition({
        transition: "grade",
        currentStatus: "submitted",
        role: "edu_observer",
        actorEnrollmentId: null,
        submissionEnrollmentId: "enr_1",
      }),
    ).toMatchObject({ allowed: false, reason: "not_permitted" });
  });

  it("freezes a submission once it is handed in", () => {
    expect(studentMayEdit("in_progress")).toBe(true);
    expect(studentMayEdit("not_started")).toBe(true);
    expect(studentMayEdit("submitted")).toBe(false);
    expect(studentMayEdit("graded")).toBe(false);
    expect(studentMayEdit("returned")).toBe(false);

    expect(evaluateSubmissionTransition({ transition: "submit", currentStatus: "submitted", ...student })).toMatchObject({
      allowed: false,
      reason: "invalid_transition",
    });
  });

  it("lets an assessor grade, return, and reopen", () => {
    expect(evaluateSubmissionTransition({ transition: "grade", currentStatus: "submitted", ...instructor })).toEqual({
      allowed: true,
      nextStatus: "graded",
    });
    expect(evaluateSubmissionTransition({ transition: "return", currentStatus: "graded", ...instructor })).toEqual({
      allowed: true,
      nextStatus: "returned",
    });
    expect(evaluateSubmissionTransition({ transition: "reopen", currentStatus: "returned", ...instructor })).toEqual({
      allowed: true,
      nextStatus: "in_progress",
    });
  });

  it("will not return work that was never graded", () => {
    expect(evaluateSubmissionTransition({ transition: "return", currentStatus: "submitted", ...instructor })).toMatchObject({
      allowed: false,
      reason: "invalid_transition",
    });
  });

  it("lets a teaching assistant assess but keeps course structure out of reach", () => {
    expect(
      evaluateSubmissionTransition({
        transition: "grade",
        currentStatus: "submitted",
        role: "edu_assistant",
        actorEnrollmentId: "enr_7",
        submissionEnrollmentId: "enr_1",
      }),
    ).toMatchObject({ allowed: true });
  });
});

describe("lateness", () => {
  const due = new Date("2026-08-10T23:59:00.000Z");

  it("records lateness rather than refusing the work", () => {
    // A due date that refuses the work destroys it. The software reports when it
    // arrived; what a late submission is worth is the instructor's judgement.
    expect(submissionLateness(new Date("2026-08-11T00:30:00.000Z"), due)).toEqual({ late: true, minutesLate: 31 });
    expect(submissionLateness(new Date("2026-08-10T20:00:00.000Z"), due)).toEqual({ late: false, minutesLate: 0 });
  });

  it("treats an assignment with no due date as never late", () => {
    expect(submissionLateness(new Date("2030-01-01T00:00:00.000Z"), null)).toEqual({ late: false, minutesLate: 0 });
  });

  it("does not call an on-the-deadline submission late", () => {
    expect(submissionLateness(due, due).late).toBe(false);
  });
});

describe("grade validation", () => {
  it("accepts a grade whose breakdown adds up", () => {
    expect(
      validateGrade({
        grade: grade({
          pointsAwarded: 88,
          criterionScores: [
            { criterionId: "c1", points: 38, comment: null },
            { criterionId: "c2", points: 30, comment: null },
            { criterionId: "c3", points: 20, comment: null },
          ],
        }),
        criteria,
        pointsPossible: rubricTotalPoints(criteria),
      }),
    ).toEqual([]);
  });

  it("rejects a total that disagrees with its own breakdown", () => {
    // This is the exact thing a student appeals, and "the instructor typed it" is not
    // an answer.
    const problems = validateGrade({
      grade: grade({
        pointsAwarded: 95,
        criterionScores: [
          { criterionId: "c1", points: 38, comment: null },
          { criterionId: "c2", points: 30, comment: null },
          { criterionId: "c3", points: 20, comment: null },
        ],
      }),
      criteria,
      pointsPossible: 100,
    });
    expect(problems).toContain("The criterion scores total 88, which does not match the 95 points recorded.");
  });

  it("rejects points beyond what the rubric offers", () => {
    expect(validateGrade({ grade: grade({ pointsAwarded: 140 }), criteria, pointsPossible: 100 })).toContain(
      "Points awarded (140) exceed the 100 available.",
    );
  });

  it("rejects a criterion score above that criterion's maximum", () => {
    const problems = validateGrade({
      grade: grade({
        pointsAwarded: 100,
        criterionScores: [
          { criterionId: "c1", points: 60, comment: null },
          { criterionId: "c2", points: 20, comment: null },
          { criterionId: "c3", points: 20, comment: null },
        ],
      }),
      criteria,
      pointsPossible: 100,
    });
    expect(problems).toContain('Criterion "c1" was awarded 60 of a possible 40.');
  });

  it("rejects a criterion that is not part of the rubric", () => {
    expect(
      validateGrade({
        grade: grade({ pointsAwarded: 10, criterionScores: [{ criterionId: "invented", points: 10, comment: null }] }),
        criteria,
        pointsPossible: 100,
      }),
    ).toContain('Criterion "invented" is not part of this rubric.');
  });

  it("requires every criterion to be scored once a breakdown is given", () => {
    const problems = validateGrade({
      grade: grade({ pointsAwarded: 38, criterionScores: [{ criterionId: "c1", points: 38, comment: null }] }),
      criteria,
      pointsPossible: 100,
    });
    expect(problems).toContain("Every criterion must be scored. Missing: c2, c3.");
  });

  it("reports every problem at once rather than one per attempt", () => {
    const problems = validateGrade({
      grade: grade({
        pointsAwarded: 500,
        criterionScores: [{ criterionId: "c1", points: 99, comment: null }],
      }),
      criteria,
      pointsPossible: 100,
    });
    expect(problems.length).toBeGreaterThan(2);
  });

  it("computes the possible points from the rubric rather than trusting a caller", () => {
    expect(rubricTotalPoints(criteria)).toBe(100);
  });

  it("has no request field that records a grade without a person", () => {
    // `aiSuggested` is provenance. It is a boolean beside the grade, never a source
    // of one, and the grader's identity comes from the session rather than the body.
    const parsed = recordGradeSchema.parse({ submissionId: "sub_1", pointsAwarded: 10, aiSuggested: true });
    expect(parsed.aiSuggested).toBe(true);
    expect(Object.keys(parsed)).not.toContain("gradedByUserId");
    expect(GRADE_AUTHORITY_NOTICE).toContain("A person records every grade");
  });
});

describe("what a student sees of a grade", () => {
  const recorded = {
    pointsAwarded: 88,
    pointsPossible: 100,
    feedback: "Strong triage sequencing; the eligibility check was missed.",
    criterionScores: [{ criterionId: "c1", points: 38 }],
    releasedAt: new Date("2026-08-12T15:00:00.000Z"),
    aiSuggested: true,
  };

  it("shows nothing at all before release", () => {
    // Not partially visible: returning the points with the feedback withheld would
    // let a student infer the assessment before the instructor finished writing it.
    const view = projectGradeForStudent({ ...recorded, releasedToStudent: false });
    expect(view.released).toBe(false);
    expect(JSON.stringify(view)).not.toContain("88");
  });

  it("shows nothing when no grade exists", () => {
    expect(projectGradeForStudent(null).released).toBe(false);
  });

  it("discloses that an AI draft informed the assessment once released", () => {
    const view = projectGradeForStudent({ ...recorded, releasedToStudent: true });
    expect(view).toMatchObject({ released: true, pointsAwarded: 88, pointsPossible: 100, aiInformed: true });
  });
});
