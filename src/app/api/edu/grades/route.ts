import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { canEdu, canFinalizeCompetency } from "@/lib/edu/edu-roles";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";
import {
  evaluateSubmissionTransition,
  recordGradeSchema,
  rubricTotalPoints,
  validateGrade,
  type SubmissionStatus,
} from "@/lib/edu/edu-submission-rules";

/**
 * Assessor write path.
 *
 * Recording a grade, releasing it, and reopening a submission. Kept in a separate
 * route from the student path so that no handler a student can reach is capable of
 * writing to a grade, whatever it is asked to do.
 *
 * A person records every grade. `aiSuggested` is provenance and nothing else — there
 * is no field in this request that produces a grade without `gradedByUserId`.
 */

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("grade") }).merge(recordGradeSchema),
  z.object({ action: z.literal("release"), submissionId: z.string().trim().min(1).max(64) }),
  z.object({
    action: z.literal("reopen"),
    submissionId: z.string().trim().min(1).max(64),
    reason: z.string().trim().min(3).max(400),
  }),
]);

function deny(message: string, status: 400 | 403 | 404 | 409, problems?: string[]) {
  return NextResponse.json({ error: message, problems }, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "registry", "read")) return deny("Access denied.", 403);

  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU enrollment is associated with this account.", 403);
  if (!canEdu(identity.role, "grade", "grade")) return deny("This role cannot assess student work.", 403);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return deny("Invalid request.", 400);
  const body = parsed.data;

  const submission = await db.educationSubmission.findFirst({
    where: { id: body.submissionId, ...eduInstitutionFilter(identity) },
    select: {
      id: true,
      status: true,
      enrollmentId: true,
      assignment: { select: { id: true, cohortId: true, rubricId: true } },
      grade: { select: { id: true, releasedToStudent: true } },
    },
  });
  if (!submission) return deny("Submission not found.", 404);

  // An assistant or instructor assesses their own cohorts. An admin reads
  // institution-wide, which `eduCohortFilter` expresses as an empty narrowing.
  if (identity.role !== "edu_admin" && !identity.cohortIds.includes(submission.assignment.cohortId)) {
    return deny("This submission belongs to a cohort you do not teach.", 403);
  }

  const status = submission.status as SubmissionStatus;

  if (body.action === "reopen") {
    const decision = evaluateSubmissionTransition({
      transition: "reopen",
      currentStatus: status,
      role: identity.role,
      actorEnrollmentId: identity.enrollmentId,
      submissionEnrollmentId: submission.enrollmentId,
    });
    if (!decision.allowed) return deny(decision.message, decision.reason === "invalid_transition" ? 409 : 403);

    await db.educationSubmission.update({
      where: { id: submission.id },
      data: { status: decision.nextStatus, submittedAt: null },
    });
    await db.educationScenarioEvent.create({
      data: {
        institutionId: identity.institutionId ?? "",
        assignmentId: submission.assignment.id,
        submissionId: submission.id,
        actorUserId: session.userId,
        eventType: "submission.reopened",
        summary: body.reason,
      },
    });
    return NextResponse.json({ data: { status: decision.nextStatus } }, { headers: NO_STORE });
  }

  if (body.action === "release") {
    // Releasing is a separate act from grading so an instructor can grade a whole
    // cohort and release it at once, rather than trickling results out as they type.
    if (!submission.grade) return deny("There is no assessment to release.", 409);
    if (!canFinalizeCompetency(identity.role)) {
      return deny("An assistant may record an assessment but not release it to a student.", 403);
    }

    const decision = evaluateSubmissionTransition({
      transition: "return",
      currentStatus: status,
      role: identity.role,
      actorEnrollmentId: identity.enrollmentId,
      submissionEnrollmentId: submission.enrollmentId,
    });
    if (!decision.allowed) return deny(decision.message, decision.reason === "invalid_transition" ? 409 : 403);

    const releasedAt = new Date();
    await db.$transaction([
      db.educationGrade.update({
        where: { submissionId: submission.id },
        data: { releasedToStudent: true, releasedAt },
      }),
      db.educationSubmission.update({ where: { id: submission.id }, data: { status: decision.nextStatus } }),
    ]);
    return NextResponse.json({ data: { status: decision.nextStatus, releasedAt } }, { headers: NO_STORE });
  }

  const decision = evaluateSubmissionTransition({
    transition: "grade",
    currentStatus: status,
    role: identity.role,
    actorEnrollmentId: identity.enrollmentId,
    submissionEnrollmentId: submission.enrollmentId,
  });
  if (!decision.allowed) return deny(decision.message, decision.reason === "invalid_transition" ? 409 : 403);

  // A released grade is not silently overwritten. The student has already seen it.
  if (submission.grade?.releasedToStudent) {
    return deny("This assessment has been released to the student. Reopen the submission to reassess it.", 409);
  }

  const rubricId = submission.assignment.rubricId;
  const criteria = rubricId
    ? await db.educationRubricCriterion.findMany({
        where: { rubricId },
        select: { id: true, maxPoints: true },
        orderBy: { orderIndex: "asc" },
      })
    : [];
  if (!rubricId || criteria.length === 0) {
    return deny("This assignment has no rubric, so a grade cannot be recorded against one.", 409);
  }

  const pointsPossible = rubricTotalPoints(criteria);
  const problems = validateGrade({ grade: body, criteria, pointsPossible });
  if (problems.length > 0) return deny("This assessment does not agree with its rubric.", 400, problems);

  const gradeData = {
    institutionId: identity.institutionId ?? "",
    rubricId,
    pointsAwarded: body.pointsAwarded,
    pointsPossible,
    criterionScores: body.criterionScores,
    feedback: body.feedback,
    // The acting user, from the session. There is no request field for this.
    gradedByUserId: session.userId,
    gradedAt: new Date(),
    aiSuggested: body.aiSuggested,
  };

  const release = body.release && canFinalizeCompetency(identity.role);

  await db.$transaction([
    db.educationGrade.upsert({
      where: { submissionId: submission.id },
      create: { submissionId: submission.id, ...gradeData, releasedToStudent: release, releasedAt: release ? new Date() : null },
      update: { ...gradeData, releasedToStudent: release, releasedAt: release ? new Date() : null },
    }),
    db.educationSubmission.update({
      where: { id: submission.id },
      data: { status: release ? "returned" : decision.nextStatus },
    }),
  ]);

  return NextResponse.json(
    {
      data: {
        status: release ? "returned" : decision.nextStatus,
        pointsAwarded: body.pointsAwarded,
        pointsPossible,
        released: release,
        // An assistant's release request is honoured as far as their role allows and
        // reported honestly rather than silently ignored.
        releaseWithheld: body.release && !release,
      },
    },
    { headers: NO_STORE },
  );
}
