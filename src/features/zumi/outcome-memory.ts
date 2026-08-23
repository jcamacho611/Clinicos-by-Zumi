import { containsLikelyIdentifiers, redactText } from "@/features/zumi/redaction";
import type { ZumiGovernedContextItem } from "@/features/zumi/memory-authority";

export type VerifiedOutcomeAuditAction = "task.complete";
export const VERIFIED_OUTCOME_AUDIT_ACTIONS: VerifiedOutcomeAuditAction[] = ["task.complete"];

export type ZumiVerifiedOutcomeEvidence = {
  auditEventId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  patientId: string | null;
  occurredAt: string;
  subject: string;
  sourceStatus: string;
  sourceCompletedAt: string | null;
};

const MAX_EVENT_TO_SOURCE_DRIFT_MS = 15 * 60 * 1_000;

export function isVerifiedOutcomeAuditAction(action: string): action is VerifiedOutcomeAuditAction {
  return (VERIFIED_OUTCOME_AUDIT_ACTIONS as string[]).includes(action);
}

function safeSubject(subject: string) {
  const normalized = subject.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 180) return null;
  if (containsLikelyIdentifiers(normalized) || redactText(normalized).redactedAny) return null;
  return normalized;
}

export function buildVerifiedOutcomeContextItem(
  evidence: ZumiVerifiedOutcomeEvidence,
  expectedOrganizationId: string,
): ZumiGovernedContextItem | null {
  if (evidence.organizationId !== expectedOrganizationId) return null;
  if (!isVerifiedOutcomeAuditAction(evidence.action)) return null;
  if (evidence.resourceType !== "task") return null;
  if (evidence.patientId !== null) return null;
  if (evidence.sourceStatus !== "completed" || !evidence.sourceCompletedAt) return null;

  const occurredAt = Date.parse(evidence.occurredAt);
  const completedAt = Date.parse(evidence.sourceCompletedAt);
  if (!Number.isFinite(occurredAt) || !Number.isFinite(completedAt)) return null;
  if (Math.abs(occurredAt - completedAt) > MAX_EVENT_TO_SOURCE_DRIFT_MS) return null;

  const subject = safeSubject(evidence.subject);
  if (!subject) return null;

  return {
    id: `outcome:${evidence.auditEventId}`,
    scope: "organization",
    authority: "verified_outcome_evidence",
    title: `Verified outcome: ${subject}`,
    content: "Klinikos recorded this organization-level task as completed and revalidated the current task state before recall.",
    sourceName: `audit_log:${evidence.action}`,
    sourceDate: evidence.occurredAt,
    effectiveAt: evidence.sourceCompletedAt,
    expiresAt: null,
    version: 1,
    evidenceIds: [evidence.auditEventId, evidence.resourceId],
  };
}
