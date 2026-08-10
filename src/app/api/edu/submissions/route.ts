import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { canEdu } from "@/lib/edu/edu-roles";
import { eduInstitutionFilter, resolveEduIdentity } from "@/lib/edu/edu-session";
import { findForbiddenScenarioAssertions } from "@/lib/edu/edu-safety";
import {
  evaluateSubmissionTransition,
  recordSubmissionEventSchema,
  submissionEvidenceSchema,
  submissionLateness,
  studentMayEdit,
  type SubmissionStatus,
} from "@/lib/edu/edu-submission-rules";

/**
 * Student write path for the Virtual Clinic Lab.
 *
 * Starting a run, recording what happened inside it, attaching evidence, and
 * submitting. Everything a student does to their own work and nothing else — grading
 * and release live in `/api/edu/grades`, so no student-reachable handler can touch a
 * grade even by accident.
 *
 * Institution scope comes from `resolveEduIdentity` and is applied to every query.
 * The request never names an institution, a cohort, or an enrollment.
 */

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), assignmentId: z.string().trim().min(1).max(64) }),
  z.object({
    action: z.literal("event"),
    assignmentId: z.string().trim().min(1).max(64),
    event: recordSubmissionEventSchema,
  }),
  z.object({
    action: z.literal("evidence"),
    assignmentId: z.string().trim().min(1).max(64),
    evidence: submissionEvidenceSchema,
  }),
  z.object({
    action: z.literal("submit"),
    assignmentId: z.string().trim().min(1).max(64),
    reflection: z.string().trim().max(4_000).optional(),
  }),
]);

function deny(message: string, status: 400 | 403 | 404 | 409) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  // EDU authorization is its own matrix; this is the clinic-side floor that keeps the
  // route inside the repository's authorization contract.
  if (!can(session.role, "registry", "read")) return deny("Access denied.", 403);

  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU enrollment is associated with this account.", 403);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return deny("Invalid request.", 400);
  const body = parsed.data;

  const assignment = await db.educationScenarioAssignment.findFirst({
    where: { id: body.assignmentId, ...eduInstitutionFilter(identity) },
    select: { id: true, cohortId: true, dueAt: true, status: true },
  });
  if (!assignment) return deny("Assignment not found.", 404);

  if (!identity.enrollmentId || !identity.cohortIds.includes(assignment.cohortId)) {
    return deny("This assignment belongs to a cohort you are not enrolled in.", 403);
  }

  // `start` creates the submission; every other action requires one to exist, so a
  // student cannot record events against work they never opened.
  if (body.action === "start") {
    if (!canEdu(identity.role, "submission", "create")) return deny("This role cannot start a submission.", 403);

    const existing = await db.educationSubmission.findUnique({
      where: { assignmentId_enrollmentId: { assignmentId: assignment.id, enrollmentId: identity.enrollmentId } },
      select: { id: true, status: true },
    });

    if (existing) {
      const decision = evaluateSubmissionTransition({
        transition: "start",
        currentStatus: existing.status as SubmissionStatus,
        role: identity.role,
        actorEnrollmentId: identity.enrollmentId,
        submissionEnrollmentId: identity.enrollmentId,
      });
      // Re-opening an in-progress run is not an error; it is the student returning to
      // work they already started.
      if (!decision.allowed && existing.status !== "in_progress") return deny(decision.message, 409);
      return NextResponse.json({ data: { submissionId: existing.id, status: existing.status } }, { headers: NO_STORE });
    }

    const created = await db.educationSubmission.create({
      data: {
        institutionId: identity.institutionId ?? "",
        assignmentId: assignment.id,
        enrollmentId: identity.enrollmentId,
        status: "in_progress",
        startedAt: new Date(),
      },
      select: { id: true, status: true },
    });
    return NextResponse.json({ data: { submissionId: created.id, status: created.status } }, { headers: NO_STORE });
  }

  const submission = await db.educationSubmission.findUnique({
    where: { assignmentId_enrollmentId: { assignmentId: assignment.id, enrollmentId: identity.enrollmentId } },
    select: { id: true, status: true, enrollmentId: true, simulationRole: true },
  });
  if (!submission) return deny("Start this scenario before recording work in it.", 409);

  const status = submission.status as SubmissionStatus;

  if (body.action === "event" || body.action === "evidence") {
    if (!studentMayEdit(status)) {
      return deny("This submission has been handed in and can no longer be changed.", 409);
    }
  }

  if (body.action === "event") {
    // The evidence timeline is append-only. Nothing here updates or deletes a prior
    // event, because an instructor grades the sequence, not a final snapshot.
    await db.educationScenarioEvent.create({
      data: {
        institutionId: identity.institutionId ?? "",
        assignmentId: assignment.id,
        submissionId: submission.id,
        actorUserId: session.userId,
        simulationRole: body.event.simulationRole ?? submission.simulationRole,
        eventType: body.event.eventType,
        queue: body.event.queue,
        taskKey: body.event.taskKey,
        summary: body.event.summary,
      },
    });
    return NextResponse.json({ data: { recorded: true } }, { headers: NO_STORE });
  }

  if (body.action === "evidence") {
    // Student-authored text is screened for language that would present the
    // simulation as real care before it is stored and shown to anyone else.
    const forbidden = findForbiddenScenarioAssertions([body.evidence.label, body.evidence.body ?? ""].join(" "));
    if (forbidden.length > 0) {
      return deny(
        `This is a simulation. Remove wording that presents it as real care: ${forbidden.join(", ")}.`,
        400,
      );
    }

    const created = await db.educationEvidence.create({
      data: {
        institutionId: identity.institutionId ?? "",
        submissionId: submission.id,
        evidenceType: body.evidence.evidenceType,
        label: body.evidence.label,
        body: body.evidence.body,
        documentId: body.evidence.documentId,
      },
      select: { id: true },
    });
    return NextResponse.json({ data: { evidenceId: created.id } }, { headers: NO_STORE });
  }

  const decision = evaluateSubmissionTransition({
    transition: "submit",
    currentStatus: status,
    role: identity.role,
    actorEnrollmentId: identity.enrollmentId,
    submissionEnrollmentId: submission.enrollmentId,
  });
  if (!decision.allowed) return deny(decision.message, decision.reason === "invalid_transition" ? 409 : 403);

  const submittedAt = new Date();
  const lateness = submissionLateness(submittedAt, assignment.dueAt);

  await db.educationSubmission.update({
    where: { id: submission.id },
    data: { status: decision.nextStatus, submittedAt, reflection: body.reflection ?? undefined },
  });

  await db.educationScenarioEvent.create({
    data: {
      institutionId: identity.institutionId ?? "",
      assignmentId: assignment.id,
      submissionId: submission.id,
      actorUserId: session.userId,
      eventType: "submission.submitted",
      summary: lateness.late ? `Submitted ${lateness.minutesLate} minutes after the due time.` : "Submitted on time.",
      detail: { minutesLate: lateness.minutesLate },
    },
  });

  // Lateness is reported, never blocked. A due date that refuses the work destroys it.
  return NextResponse.json({ data: { status: decision.nextStatus, ...lateness } }, { headers: NO_STORE });
}
