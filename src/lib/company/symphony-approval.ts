import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { OutboundMessage } from "@/lib/communications/outbound";

export type SymphonyOutboundApprovalRecord = {
  id: string;
  scope: "SYMPHONY_EMAIL_SEND";
  payloadSha256: string;
  recipient: string;
  opportunityId: string;
  purpose: string;
  requestedByActorId: string;
  authorizedActorId: string;
  approvedByActorId: string;
  approvedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  consumedAt: Date | null;
  consumedByExecutionId: string | null;
  consumedByIdempotencyKey: string | null;
  toolId: string;
  providerId: string;
};

export type SymphonyApprovalExpectation = {
  approvalId: string;
  payloadSha256: string;
  recipient: string;
  opportunityId: string;
  purpose: string;
  actorId: string;
  executionId: string;
  idempotencyKey: string;
  toolId: string;
  providerId: string;
  now: Date;
};

export type SymphonyApprovalValidationReason =
  | "APPROVAL_ID_MISMATCH"
  | "SCOPE_MISMATCH"
  | "PAYLOAD_MISMATCH"
  | "RECIPIENT_MISMATCH"
  | "OPPORTUNITY_MISMATCH"
  | "PURPOSE_MISMATCH"
  | "ACTOR_MISMATCH"
  | "TOOL_MISMATCH"
  | "PROVIDER_MISMATCH"
  | "MISSING_APPROVER"
  | "INVALID_APPROVAL_TIME"
  | "FUTURE_APPROVAL"
  | "EXPIRED"
  | "REVOKED"
  | "NOT_CONSUMED"
  | "INVALID_CONSUMPTION_TIME"
  | "REPLAYED"
  | "IDEMPOTENCY_MISMATCH";

export type SymphonyApprovalValidationResult =
  | { ok: true }
  | { ok: false; reason: SymphonyApprovalValidationReason; detail: string };

function normalizedRecipient(value: string) {
  return value.trim().toLowerCase();
}

function sameDigest(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left.toLowerCase(), "hex"), Buffer.from(right.toLowerCase(), "hex"));
}

function validTimestamp(value: Date) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function hashSymphonyOutboundMessage(message: OutboundMessage) {
  return createHash("sha256")
    .update(JSON.stringify([message.channel, message.to, message.subject, message.body]), "utf8")
    .digest("hex");
}

export function validateClaimedSymphonyApproval(
  approval: SymphonyOutboundApprovalRecord,
  expected: SymphonyApprovalExpectation,
): SymphonyApprovalValidationResult {
  if (approval.id !== expected.approvalId) {
    return { ok: false, reason: "APPROVAL_ID_MISMATCH", detail: "The claimed approval ID does not match the requested approval." };
  }
  if (approval.scope !== "SYMPHONY_EMAIL_SEND") {
    return { ok: false, reason: "SCOPE_MISMATCH", detail: "The approval does not authorize a Symphony email send." };
  }
  if (!sameDigest(approval.payloadSha256, expected.payloadSha256)) {
    return { ok: false, reason: "PAYLOAD_MISMATCH", detail: "The approval is not bound to the exact outbound payload." };
  }
  if (normalizedRecipient(approval.recipient) !== normalizedRecipient(expected.recipient)) {
    return { ok: false, reason: "RECIPIENT_MISMATCH", detail: "The approval is not bound to this recipient." };
  }
  if (approval.opportunityId !== expected.opportunityId) {
    return { ok: false, reason: "OPPORTUNITY_MISMATCH", detail: "The approval is not bound to this opportunity." };
  }
  if (approval.purpose.trim() !== expected.purpose.trim()) {
    return { ok: false, reason: "PURPOSE_MISMATCH", detail: "The approval is not bound to this outreach purpose." };
  }
  if (approval.authorizedActorId !== expected.actorId) {
    return { ok: false, reason: "ACTOR_MISMATCH", detail: "The approval does not authorize this executing actor." };
  }
  if (approval.toolId !== expected.toolId) {
    return { ok: false, reason: "TOOL_MISMATCH", detail: "The approval is not bound to this outbound tool." };
  }
  if (approval.providerId !== expected.providerId) {
    return { ok: false, reason: "PROVIDER_MISMATCH", detail: "The approval is not bound to this outbound provider." };
  }
  if (!approval.approvedByActorId.trim() || !approval.requestedByActorId.trim()) {
    return { ok: false, reason: "MISSING_APPROVER", detail: "The approval must preserve requester and approver identity evidence." };
  }
  if (!validTimestamp(approval.approvedAt) || !validTimestamp(approval.expiresAt) || !validTimestamp(expected.now)) {
    return { ok: false, reason: "INVALID_APPROVAL_TIME", detail: "The approval must preserve valid approval, expiry, and evaluation timestamps." };
  }
  if (approval.approvedAt.getTime() > expected.now.getTime()) {
    return { ok: false, reason: "FUTURE_APPROVAL", detail: "The approval timestamp cannot be in the future." };
  }
  if (approval.expiresAt.getTime() <= expected.now.getTime()) {
    return { ok: false, reason: "EXPIRED", detail: "The one-time approval has expired." };
  }
  if (approval.revokedAt) {
    return { ok: false, reason: "REVOKED", detail: "The one-time approval has been revoked." };
  }
  if (!approval.consumedAt || !approval.consumedByExecutionId || !approval.consumedByIdempotencyKey) {
    return { ok: false, reason: "NOT_CONSUMED", detail: "The approval store did not atomically consume the approval for this send." };
  }
  if (!validTimestamp(approval.consumedAt)) {
    return { ok: false, reason: "INVALID_CONSUMPTION_TIME", detail: "The approval consumption timestamp is invalid." };
  }
  if (
    approval.consumedAt.getTime() < approval.approvedAt.getTime() ||
    approval.consumedAt.getTime() > expected.now.getTime() ||
    approval.consumedAt.getTime() >= approval.expiresAt.getTime()
  ) {
    return { ok: false, reason: "INVALID_CONSUMPTION_TIME", detail: "The approval consumption timestamp is outside the valid approval window." };
  }
  if (approval.consumedByExecutionId !== expected.executionId) {
    return { ok: false, reason: "REPLAYED", detail: "The approval was consumed by a different execution." };
  }
  if (approval.consumedByIdempotencyKey !== expected.idempotencyKey) {
    return { ok: false, reason: "IDEMPOTENCY_MISMATCH", detail: "The approval was consumed under a different idempotency key." };
  }
  return { ok: true };
}
