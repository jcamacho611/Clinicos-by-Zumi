import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { buildCopilotDecision, COPILOT_RULES_VERSION, createCopilotRunSchema, reviewCopilotRunSchema } from "@/lib/copilot-rules";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function riskLevel(value: ReturnType<typeof buildCopilotDecision>["riskLevel"]) {
  if (value === "Urgent") return RiskLevel.URGENT;
  if (value === "Needs Provider") return RiskLevel.NEEDS_PROVIDER;
  if (value === "Do Not Automate") return RiskLevel.DO_NOT_AUTOMATE;
  if (value === "Needs Staff") return RiskLevel.NEEDS_STAFF;
  return RiskLevel.NORMAL;
}

function parseDraft(value: string | undefined) {
  if (!value) return null;
  try { return JSON.parse(value) as ReturnType<typeof buildCopilotDecision>; }
  catch { return null; }
}

function requireRead(session: Pick<ClinicSession, "role">) {
  if (!can(session.role, "ai", "read")) throw new NetworkAccessError("Zumi Copilot access is not permitted for this role.", 403);
}

function requireCreate(session: Pick<ClinicSession, "role">, inputMode: "typed" | "voice") {
  if (!can(session.role, "ai", "create")) throw new NetworkAccessError("Zumi Copilot creation is not permitted for this role.", 403);
  if (inputMode === "voice" && !can(session.role, "voice", "create")) throw new NetworkAccessError("Voice input is not permitted for this role.", 403);
}

function requireReview(session: Pick<ClinicSession, "role">) {
  if (!can(session.role, "ai", "update")) throw new NetworkAccessError("Zumi Copilot review is not permitted for this role.", 403);
}

export interface CopilotWorkspace {
  organization: { id: string; name: string; demoMode: boolean };
  patients: { id: string; firstName: string; lastName: string; mrn: string }[];
  rulesVersion: string;
  mode: "deterministic_local";
  statusLabels: string[];
  runs: {
    id: string;
    inputMode: string;
    inputText: string;
    intentKey: string;
    category: string;
    riskLevel: RiskLevel;
    assignedTeam: string;
    confidence: number | null;
    status: string;
    engine: string;
    rulesVersion: string;
    requiresHumanReview: boolean;
    blockedFromExecution: boolean;
    limitations: string[];
    patient: { name: string; mrn: string } | null;
    createdBy: string;
    createdAt: string;
    reviewedAt: string | null;
    draftStatus: string | null;
    result: ReturnType<typeof buildCopilotDecision> | null;
    events: { id: string; type: string; status: string; detail: string; actorType: string; createdAt: string }[];
  }[];
}

export async function listCopilotWorkspace(session: Pick<ClinicSession, "organizationId" | "role" | "userId">): Promise<CopilotWorkspace> {
  requireRead(session);
  const [organization, patients, runs] = await Promise.all([
    db.organization.findUnique({ where: { id: session.organizationId }, select: { id: true, name: true, demoMode: true } }),
    db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: 100 }),
    db.copilotRun.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  if (!organization) throw new NetworkAccessError("Clinic organization not found.", 404);
  const runIds = runs.map((run) => run.id);
  const patientIds = runs.flatMap((run) => run.patientId ? [run.patientId] : []);
  const userIds = [...new Set(runs.map((run) => run.userId))];
  const [drafts, runPatients, runUsers, events] = await Promise.all([
    db.aiDraft.findMany({ where: { id: { in: runs.flatMap((run) => run.aiDraftId ? [run.aiDraftId] : []) }, organizationId: session.organizationId }, select: { id: true, content: true, status: true } }),
    db.patient.findMany({ where: { id: { in: patientIds }, organizationId: session.organizationId }, select: { id: true, firstName: true, lastName: true, mrn: true } }),
    db.user.findMany({ where: { id: { in: userIds }, organizationId: session.organizationId }, select: { id: true, name: true } }),
    db.copilotEvent.findMany({ where: { runId: { in: runIds }, organizationId: session.organizationId }, orderBy: { createdAt: "asc" } }),
  ]);
  const draftsById = new Map(drafts.map((draft) => [draft.id, draft]));
  const patientsById = new Map(runPatients.map((patient) => [patient.id, patient]));
  const usersById = new Map(runUsers.map((user) => [user.id, user]));
  const eventsByRunId = new Map<string, typeof events>();
  for (const event of events) eventsByRunId.set(event.runId, [...(eventsByRunId.get(event.runId) ?? []), event]);
  return {
    organization,
    patients,
    rulesVersion: COPILOT_RULES_VERSION,
    mode: "deterministic_local" as const,
    statusLabels: ["Live", "Demo", "Manual fallback", "Pending connection", "Requires production review", "Human review required"],
    runs: runs.map((run) => {
      const draft = run.aiDraftId ? draftsById.get(run.aiDraftId) : undefined;
      const patient = run.patientId ? patientsById.get(run.patientId) : undefined;
      return {
        id: run.id,
        inputMode: run.inputMode,
        inputText: run.inputText,
        intentKey: run.intentKey,
        category: run.category,
        riskLevel: run.riskLevel,
        assignedTeam: run.assignedTeam,
        confidence: run.confidence ? Number(run.confidence) : null,
        status: run.status,
        engine: run.engine,
        rulesVersion: run.rulesVersion,
        requiresHumanReview: run.requiresHumanReview,
        blockedFromExecution: run.blockedFromExecution,
        limitations: run.limitations,
        patient: patient ? { name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn } : null,
        createdBy: usersById.get(run.userId)?.name ?? "Authorized user",
        createdAt: run.createdAt.toISOString(),
        reviewedAt: run.reviewedAt?.toISOString() ?? null,
        draftStatus: draft?.status ?? null,
        result: parseDraft(draft?.content),
        events: (eventsByRunId.get(run.id) ?? []).map((event) => ({ id: event.id, type: event.type, status: event.status, detail: event.detail, actorType: event.actorType, createdAt: event.createdAt.toISOString() })),
      };
    }),
  };
}

export async function createCopilotRun(session: ClinicSession, rawInput: unknown) {
  const input = createCopilotRunSchema.parse(rawInput);
  requireCreate(session, input.inputMode);
  const organization = await db.organization.findUnique({ where: { id: session.organizationId }, select: { demoMode: true } });
  if (!organization) throw new NetworkAccessError("Clinic organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Zumi Copilot requires production security, consent, retention, and vendor review before non-demo use.", 409);

  const patient = input.patientId
    ? await db.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } })
    : null;
  if (input.patientId && !patient) throw new NetworkAccessError("Patient context was not found in this organization.", 404);

  const result = buildCopilotDecision(input.inputText);
  const runId = randomUUID();
  const classificationId = randomUUID();
  const draftId = randomUUID();
  const voiceSessionId = input.inputMode === "voice" ? randomUUID() : null;
  const taskId = randomUUID();
  const provenance = {
    engine: "deterministic_local",
    rulesVersion: COPILOT_RULES_VERSION,
    inputMode: input.inputMode,
    syntheticDemo: true,
    generatedAt: new Date().toISOString(),
    providerConnection: "Pending connection",
    audioStored: false,
  } satisfies Prisma.InputJsonValue;

  return db.$transaction(async (tx) => {
    if (voiceSessionId) {
      await tx.voiceSession.create({
        data: {
          id: voiceSessionId,
          organizationId: session.organizationId,
          userId: session.userId,
          patientId: patient?.id,
          purpose: "zumi_copilot_demo",
          status: "transcript_confirmed_demo",
          transcript: input.inputText,
          provider: "browser_web_speech_demo",
          confirmedAt: new Date(),
          retentionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }
    await tx.aiClassification.create({
      data: {
        id: classificationId,
        organizationId: session.organizationId,
        sourceType: "copilot_run",
        sourceId: runId,
        category: result.category,
        confidence: result.confidence,
        riskLevel: riskLevel(result.riskLevel),
        requiresHumanReview: true,
        assignedTeam: result.assignedTeam,
        rulesVersion: COPILOT_RULES_VERSION,
      },
    });
    await tx.aiDraft.create({
      data: {
        id: draftId,
        organizationId: session.organizationId,
        patientId: patient?.id,
        sourceType: "copilot_run",
        sourceId: runId,
        purpose: result.intentKey,
        content: JSON.stringify(result),
        riskLevel: riskLevel(result.riskLevel),
        requiresHumanReview: true,
        blockedFromSend: true,
        status: "draft",
      },
    });
    const run = await tx.copilotRun.create({
      data: {
        id: runId,
        organizationId: session.organizationId,
        userId: session.userId,
        patientId: patient?.id,
        inputMode: input.inputMode,
        inputText: input.inputText,
        intentKey: result.intentKey,
        category: result.category,
        riskLevel: riskLevel(result.riskLevel),
        assignedTeam: result.assignedTeam,
        confidence: result.confidence,
        status: result.status,
        engine: "deterministic_local",
        rulesVersion: COPILOT_RULES_VERSION,
        aiClassificationId: classificationId,
        aiDraftId: draftId,
        voiceSessionId,
        requiresHumanReview: true,
        blockedFromExecution: true,
        provenance,
        limitations: result.limitations,
      },
    });
    await tx.copilotEvent.createMany({ data: [
      { id: randomUUID(), organizationId: session.organizationId, runId, actorId: session.userId, actorType: "user", type: "input_confirmed", status: "complete", detail: `${input.inputMode === "voice" ? "Visible voice transcript" : "Typed request"} confirmed for synthetic demo processing.`, metadata: { inputMode: input.inputMode, patientContext: Boolean(patient) } },
      { id: randomUUID(), organizationId: session.organizationId, runId, actorType: "system", type: "safety_classified", status: "complete", detail: `${result.category} routed to ${result.assignedTeam}.`, metadata: { confidence: result.confidence, riskLevel: result.riskLevel, rulesVersion: COPILOT_RULES_VERSION } },
      { id: randomUUID(), organizationId: session.organizationId, runId, actorType: "system", type: "review_hold_created", status: result.status, detail: "Draft saved with execution and patient-message delivery blocked pending authorized human review.", metadata: { draftId, taskId, blockedFromExecution: true } },
    ] });
    await tx.task.create({
      data: {
        id: taskId,
        organizationId: session.organizationId,
        patientId: patient?.id,
        category: "zumi_copilot_review",
        title: `Review Zumi draft: ${result.category}`,
        details: `copilot-run:${runId} ${result.nextAction}`,
        ownerId: session.userId,
        priority: result.riskLevel === "Urgent" || result.riskLevel === "Do Not Automate" ? "urgent" : result.riskLevel === "Needs Provider" ? "high" : "normal",
        riskLevel: riskLevel(result.riskLevel),
        dueAt: new Date(),
        status: "open",
        createdBy: session.userId,
      },
    });
    let escalationId: string | null = null;
    if (result.status === "urgent_hold") {
      const escalation = await tx.escalation.create({
        data: {
          organizationId: session.organizationId,
          patientId: patient?.id,
          sourceType: "zumi_copilot",
          sourceId: runId,
          category: result.intentKey,
          riskLevel: riskLevel(result.riskLevel),
          assignedTeam: result.assignedTeam,
          status: "open",
        },
      });
      escalationId = escalation.id;
      await tx.notification.create({ data: { organizationId: session.organizationId, userId: session.userId, type: "zumi_copilot_urgent_hold", title: "Zumi stopped routine processing", body: `${result.category} requires immediate authorized human review.` } });
    }
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "zumi_copilot.run_created",
        resourceType: "copilot_run",
        resourceId: runId,
        patientId: patient?.id,
        metadata: { inputMode: input.inputMode, intentKey: result.intentKey, category: result.category, taskId, escalationId, blockedFromExecution: true, humanReviewRequired: true, syntheticDemo: true },
      },
    });
    return { run: { id: run.id, status: run.status, createdAt: run.createdAt.toISOString() }, result, taskId, escalationId, provenance };
  });
}

export async function reviewCopilotRun(session: ClinicSession, runId: string, rawInput: unknown) {
  requireReview(session);
  const input = reviewCopilotRunSchema.parse(rawInput);
  const run = await db.copilotRun.findFirst({ where: { id: runId, organizationId: session.organizationId } });
  if (!run) throw new NetworkAccessError("Zumi Copilot run not found for this organization.", 404);
  if (!['awaiting_review', 'urgent_hold'].includes(run.status)) throw new NetworkAccessError("This Zumi Copilot run has already been reviewed.", 409);
  return db.$transaction(async (tx) => {
    const nextStatus = input.decision === "approve" ? "reviewed" : "rejected";
    const updated = await tx.copilotRun.update({ where: { id: run.id }, data: { status: nextStatus, reviewedBy: session.userId, reviewedAt: new Date() } });
    if (run.aiDraftId) {
      const draftStatus = input.decision === "approve" ? "approved_for_staff_action" : "rejected";
      await tx.aiDraft.updateMany({ where: { id: run.aiDraftId, organizationId: session.organizationId }, data: { status: draftStatus } });
      await tx.aiReview.create({ data: { organizationId: session.organizationId, draftId: run.aiDraftId, reviewerId: session.userId, decision: draftStatus, notes: input.notes } });
    }
    await tx.task.updateMany({ where: { organizationId: session.organizationId, category: "zumi_copilot_review", details: { contains: `copilot-run:${run.id}` } }, data: { status: "completed", completedAt: new Date() } });
    await tx.copilotEvent.create({ data: { organizationId: session.organizationId, runId: run.id, actorId: session.userId, actorType: "user", type: `human_${input.decision}`, status: nextStatus, detail: input.notes, metadata: { blockedFromExecution: true, downstreamExecutionPerformed: false } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `zumi_copilot.${input.decision}`, resourceType: "copilot_run", resourceId: run.id, patientId: run.patientId, changes: { status: { from: run.status, to: nextStatus } }, metadata: { notes: input.notes, blockedFromExecution: true, downstreamExecutionPerformed: false } } });
    return { id: updated.id, status: updated.status, blockedFromExecution: updated.blockedFromExecution, reviewedAt: updated.reviewedAt?.toISOString() ?? null };
  });
}
