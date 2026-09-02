import "server-only";

import { createHash } from "node:crypto";
import type { OutboundMessage } from "@/lib/communications/outbound";

export type SymphonySendApprovalEvidence = {
  approvalId: string;
  approvedBy: string;
  approvedAt: Date;
  consumedAt: Date;
  evidenceReference: string;
};

export type SymphonyApprovalConsumeRequest = {
  approvalId: string;
  opportunityId: string;
  messageHash: string;
  requestedAt: Date;
};

export type SymphonyApprovalRejectionReason =
  | "approval_expired"
  | "approval_mismatch"
  | "approval_rejected"
  | "approval_already_consumed"
  | "approval_unavailable";

export type SymphonyApprovalConsumeResult =
  | { ok: true; evidence: SymphonySendApprovalEvidence }
  | { ok: false; reason: SymphonyApprovalRejectionReason; detail: string };

export type SymphonyApprovalConsumer = (
  request: SymphonyApprovalConsumeRequest,
) => Promise<SymphonyApprovalConsumeResult>;

/**
 * Bind approval to exactly what Symphony is about to send.
 *
 * Opportunity id is included because two different opportunities may legitimately render
 * the same recipient/subject/body. The message fields are hashed exactly as rendered;
 * editing any field after approval produces a different hash and must require new approval.
 */
export function hashSymphonyMessage(opportunityId: string, message: OutboundMessage): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        opportunityId,
        message.channel,
        message.to,
        message.subject,
        message.body,
      ]),
      "utf8",
    )
    .digest("hex");
}

export function validateSymphonyApprovalEvidence(
  evidence: SymphonySendApprovalEvidence,
  expectedApprovalId: string,
  requestedAt: Date,
): boolean {
  if (!expectedApprovalId || evidence.approvalId !== expectedApprovalId) return false;
  if (!evidence.approvedBy.trim() || !evidence.evidenceReference.trim()) return false;
  if (!Number.isFinite(evidence.approvedAt.getTime()) || !Number.isFinite(evidence.consumedAt.getTime())) return false;
  if (evidence.approvedAt.getTime() > evidence.consumedAt.getTime()) return false;
  if (evidence.consumedAt.getTime() > requestedAt.getTime()) return false;
  return true;
}
