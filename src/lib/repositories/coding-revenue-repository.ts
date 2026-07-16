import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { buildCodingFindings, calculateReadiness, createCodingDraftSchema, readinessTone, reviewCodingDraftSchema, type CodingFinding } from "@/lib/coding-revenue-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function requireCodingRead(session: Pick<ClinicSession, "role">) {
  if (!can(session.role, "coding", "read")) throw new NetworkAccessError("Coding readiness access is not permitted for this role.", 403);
}

function requireCodingWrite(session: Pick<ClinicSession, "role">) {
  if (!can(session.role, "coding", "update")) throw new NetworkAccessError("Human coding review is not permitted for this role.", 403);
}

function parseDraft(content: string) {
  try { return JSON.parse(content) as { readinessScore?: number; findings?: CodingFinding[]; suggestions?: { type: string; code: string; label: string }[]; rulesVersion?: string }; }
  catch { return null; }
}

function patientName(patient: { firstName: string; lastName: string } | undefined) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
}

async function buildClaimAssessment(organizationId: string, claimDraftId: string) {
  const claim = await db.claimDraft.findFirst({ where: { id: claimDraftId, organizationId } });
  if (!claim) throw new NetworkAccessError("Claim draft not found for this organization.", 404);
  const [patient, encounter, superbill, lines, priorAuthorizations, diagnoses, procedures, denials, draft] = await Promise.all([
    db.patient.findFirst({ where: { id: claim.patientId, organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true } }),
    claim.encounterId ? db.encounter.findFirst({ where: { id: claim.encounterId, organizationId, patientId: claim.patientId }, select: { id: true, status: true, signedAt: true, serviceDate: true, type: true } }) : null,
    claim.superbillId ? db.superbill.findFirst({ where: { id: claim.superbillId, organizationId, patientId: claim.patientId }, select: { id: true, status: true, diagnoses: true, procedures: true } }) : null,
    db.claimLine.findMany({ where: { claimDraftId: claim.id, organizationId }, orderBy: { createdAt: "asc" } }),
    db.priorAuthorization.findMany({ where: { organizationId, patientId: claim.patientId }, select: { status: true, service: true } }),
    db.diagnosis.findMany({ where: { organizationId, patientId: claim.patientId, encounterId: claim.encounterId ?? undefined }, select: { code: true, label: true, primary: true } }),
    db.procedure.findMany({ where: { organizationId, patientId: claim.patientId, encounterId: claim.encounterId ?? undefined }, select: { code: true, label: true, modifiers: true } }),
    db.denial.findMany({ where: { organizationId, claimDraftId: claim.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.aiDraft.findFirst({ where: { organizationId, sourceType: "coding_recommendation", sourceId: claim.id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!patient) throw new NetworkAccessError("Claim patient not found for this organization.", 404);
  const diagnosisCodes = diagnoses.map((diagnosis) => diagnosis.code);
  const icd10Pointers = lines.flatMap((line) => line.icd10Pointers);
  const authorizationStatus = priorAuthorizations.some((authorization) => authorization.status === "approved") ? "approved" : priorAuthorizations.length ? priorAuthorizations[0].status : null;
  const findings = buildCodingFindings({ encounterStatus: encounter?.status ?? null, signedAt: encounter?.signedAt ?? null, lineCount: lines.length, diagnosisCodes, icd10Pointers, hasSuperbill: Boolean(superbill), authorizationStatus });
  const readinessScore = calculateReadiness(findings);
  return { claim, patient, encounter, superbill, lines, diagnoses, procedures, denials, draft, findings, readinessScore, readiness: readinessTone(readinessScore), authorizationStatus };
}

async function listAssessments(organizationId: string) {
  const claims = await db.claimDraft.findMany({ where: { organizationId, status: { not: "CLOSED" } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 100 });
  return Promise.all(claims.map((claim) => buildClaimAssessment(organizationId, claim.id)));
}

export async function listCodingWorkspace(session: Pick<ClinicSession, "organizationId" | "role">) {
  requireCodingRead(session);
  const [assessments, denials] = await Promise.all([listAssessments(session.organizationId), db.denial.findMany({ where: { organizationId: session.organizationId, status: "open" }, orderBy: { createdAt: "desc" }, take: 50 })]);
  const scored = assessments.map((assessment) => ({
    id: assessment.claim.id,
    patient: { id: assessment.patient.id, name: patientName(assessment.patient), mrn: assessment.patient.mrn },
    payer: assessment.claim.payer,
    status: assessment.claim.status,
    totalCents: assessment.claim.totalCents,
    serviceDate: assessment.encounter?.serviceDate.toISOString() ?? null,
    encounterType: assessment.encounter?.type ?? "No encounter linked",
    readinessScore: assessment.readinessScore,
    readiness: assessment.readiness,
    findings: assessment.findings,
    suggestions: [...assessment.procedures.map((procedure) => ({ type: "CPT", code: procedure.code, label: procedure.label })), ...assessment.diagnoses.map((diagnosis) => ({ type: "ICD-10", code: diagnosis.code, label: diagnosis.label }))],
    draft: assessment.draft ? { id: assessment.draft.id, status: assessment.draft.status, createdAt: assessment.draft.createdAt.toISOString(), content: parseDraft(assessment.draft.content) } : null,
    denials: assessment.denials.map((denial) => ({ id: denial.id, reasonCode: denial.reasonCode, reason: denial.reason, amountCents: denial.amountCents, status: denial.status })),
  }));
  return { claims: scored, denials: denials.map((denial) => ({ id: denial.id, claimDraftId: denial.claimDraftId, reasonCode: denial.reasonCode, reason: denial.reason, amountCents: denial.amountCents, appealDueAt: denial.appealDueAt?.toISOString() ?? null })), rulesVersion: "coding-readiness-2026-07-16.1", humanReviewRequired: true };
}

export type CodingWorkspace = Awaited<ReturnType<typeof listCodingWorkspace>>;

export async function createCodingDraft(session: ClinicSession, rawInput: unknown) {
  requireCodingWrite(session);
  const input = createCodingDraftSchema.parse(rawInput);
  const assessment = await buildClaimAssessment(session.organizationId, input.claimDraftId);
  const content = JSON.stringify({ rulesVersion: "coding-readiness-2026-07-16.1", generatedAt: new Date().toISOString(), readinessScore: assessment.readinessScore, readiness: assessment.readiness, findings: assessment.findings, suggestions: [...assessment.procedures.map((procedure) => ({ type: "CPT", code: procedure.code, label: procedure.label })), ...assessment.diagnoses.map((diagnosis) => ({ type: "ICD-10", code: diagnosis.code, label: diagnosis.label }))], limitations: ["This is a preparation aid, not a final coding or billing decision.", "A licensed provider or authorized coding reviewer must verify documentation, code selection, modifiers, authorization, and payer rules.", "No claim was submitted or approved by this action."] });
  return db.$transaction(async (tx) => {
    const draft = assessment.draft
      ? await tx.aiDraft.update({ where: { id: assessment.draft.id }, data: { content, status: "draft", requiresHumanReview: true, blockedFromSend: true, riskLevel: RiskLevel.NEEDS_STAFF } })
      : await tx.aiDraft.create({ data: { organizationId: session.organizationId, patientId: assessment.patient.id, sourceType: "coding_recommendation", sourceId: assessment.claim.id, purpose: "coding_readiness", content, riskLevel: RiskLevel.NEEDS_STAFF, requiresHumanReview: true, blockedFromSend: true, status: "draft" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "coding.draft_created", resourceType: "ai_draft", resourceId: draft.id, patientId: assessment.patient.id, metadata: { claimDraftId: assessment.claim.id, readinessScore: assessment.readinessScore, findings: assessment.findings.map((finding) => finding.code), blockedFromSend: true, humanReviewRequired: true } } });
    return { id: draft.id, claimDraftId: assessment.claim.id, readinessScore: assessment.readinessScore, status: draft.status };
  });
}

export async function reviewCodingDraft(session: ClinicSession, draftId: string, rawInput: unknown) {
  requireCodingWrite(session);
  const input = reviewCodingDraftSchema.parse(rawInput);
  const draft = await db.aiDraft.findFirst({ where: { id: draftId, organizationId: session.organizationId, sourceType: "coding_recommendation" } });
  if (!draft) throw new NetworkAccessError("Coding recommendation not found for this organization.", 404);
  if (draft.status !== "draft") throw new NetworkAccessError("This coding recommendation has already been reviewed.", 409);
  return db.$transaction(async (tx) => {
    const nextStatus = input.decision === "approve" ? "approved_for_coding_review" : "rejected";
    const updated = await tx.aiDraft.update({ where: { id: draft.id }, data: { status: nextStatus } });
    await tx.aiReview.create({ data: { organizationId: session.organizationId, draftId: draft.id, reviewerId: session.userId, decision: nextStatus, notes: input.notes } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `coding.${input.decision}`, resourceType: "ai_draft", resourceId: draft.id, patientId: draft.patientId, changes: { status: { from: draft.status, to: updated.status } }, metadata: { notes: input.notes, humanReview: true, noAutonomousClaimDecision: true } } });
    return updated;
  });
}
