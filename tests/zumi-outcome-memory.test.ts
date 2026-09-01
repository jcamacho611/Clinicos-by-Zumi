import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildVerifiedOutcomeContextItem,
  isVerifiedOutcomeAuditAction,
  type ZumiVerifiedOutcomeEvidence,
} from "@/features/zumi/outcome-memory";
import { formatZumiGovernedContext } from "@/features/zumi/memory-authority";

const verifiedTask: ZumiVerifiedOutcomeEvidence = {
  auditEventId: "audit-1",
  organizationId: "org-1",
  action: "task.complete",
  resourceType: "task",
  resourceId: "task-1",
  patientId: null,
  occurredAt: "2026-08-23T03:00:02.000Z",
  subject: "Resolve callback backlog",
  sourceStatus: "completed",
  sourceCompletedAt: "2026-08-23T03:00:00.000Z",
};

describe("Zumi verified outcome memory", () => {
  it("accepts only explicit server-owned outcome actions", () => {
    expect(isVerifiedOutcomeAuditAction("task.complete")).toBe(true);
    expect(isVerifiedOutcomeAuditAction("task.reopen")).toBe(false);
    expect(isVerifiedOutcomeAuditAction("knowledge.approve")).toBe(false);
    expect(isVerifiedOutcomeAuditAction("zumi.user_claimed_success")).toBe(false);
  });

  it("creates organization-scoped outcome context only when the live source still confirms completion", () => {
    const item = buildVerifiedOutcomeContextItem(verifiedTask, "org-1");
    expect(item).not.toBeNull();
    expect(item?.authority).toBe("verified_outcome_evidence");
    expect(item?.scope).toBe("organization");
    expect(item?.sourceName).toBe("audit_log:task.complete");
    expect(formatZumiGovernedContext(item ? [item] : [])).toContain("operational_authority=false");
  });

  it("rejects cross-tenant, patient-linked, stale, reopened, or identifier-shaped outcome evidence", () => {
    expect(buildVerifiedOutcomeContextItem(verifiedTask, "org-2")).toBeNull();
    expect(buildVerifiedOutcomeContextItem({ ...verifiedTask, patientId: "patient-1" }, "org-1")).toBeNull();
    expect(buildVerifiedOutcomeContextItem({ ...verifiedTask, sourceStatus: "open", sourceCompletedAt: null }, "org-1")).toBeNull();
    expect(buildVerifiedOutcomeContextItem({ ...verifiedTask, occurredAt: "2026-08-23T05:00:00.000Z" }, "org-1")).toBeNull();
    expect(buildVerifiedOutcomeContextItem({ ...verifiedTask, subject: "Call jane@example.com" }, "org-1")).toBeNull();
  });

  it("keeps evidence provenance internal and explicit", () => {
    const item = buildVerifiedOutcomeContextItem(verifiedTask, "org-1");
    expect(item?.id).toBe("outcome:audit-1");
    expect(item?.evidenceIds).toEqual(["audit-1", "task-1"]);
  });

  it("requires retrieval to re-check AuditLog and the current task state rather than trusting remembered text", () => {
    const memory = readFileSync("src/features/zumi/memory.ts", "utf8");
    expect(memory).toContain("retrieveZumiVerifiedOutcomeContext");
    expect(memory).toContain("db.auditLog.findMany");
    expect(memory).toContain('action: { in: VERIFIED_OUTCOME_AUDIT_ACTIONS }');
    expect(memory).toContain('patientId: null');
    expect(memory).toContain('status: "completed"');
    expect(memory).toContain("completedAt");
    expect(memory).toContain("outcomeEvidenceIds");
  });

  it("does not let the ordinary user memory API mint outcome authority", () => {
    const route = readFileSync("src/app/api/zumi/memory/route.ts", "utf8");
    expect(route).not.toContain("verified_outcome_evidence");
    expect(route).not.toContain('"outcome"');
  });
});
