import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("company opportunity evidence persistence", () => {
  const schema = read("prisma/models/company-external-opportunity.prisma");
  const legacySchema = read("prisma/schema.prisma");
  const migration = read(
    "prisma/migrations/20260902090000_company_opportunity_evidence_ledger/migration.sql",
  );

  it("creates one platform-scoped aggregate with CAS and independent state rails", () => {
    expect(schema).toContain("model CompanyExternalOpportunity {");
    expect(schema).toMatch(/operatingScope\s+String\s+@default\("KLINIKOS_COMPANY_OS"\)/);
    expect(schema).toMatch(/version\s+Int\s+@default\(1\)/);
    expect(schema).toMatch(/lifecycleStage\s+String\s+@default\("DISCOVERED"\)/);
    expect(schema).toMatch(/sourceType\s+String/);
    for (const rail of [
      'qualificationState       String   @default("UNQUALIFIED")',
      'providerState            String   @default("UNPROVEN")',
      'deliveryState            String   @default("UNPROVEN")',
      'responseState            String   @default("UNPROVEN")',
      'submissionState          String   @default("NOT_STARTED")',
      'awardState               String   @default("UNPROVEN")',
      'contractState            String   @default("UNPROVEN")',
      'cashState                String   @default("UNPROVEN")',
    ]) {
      expect(schema.replace(/\s+/g, " ")).toContain(rail.replace(/\s+/g, " "));
    }
    expect(schema).not.toContain("currentTruthClass");
    expect(schema).not.toContain("awardedOrContracted");
    expect(schema).not.toContain("cashReceived");
  });

  it("stores claim-scoped provenance, review, supersession, retention, contract, and cash evidence", () => {
    expect(schema).toContain("model CompanyOpportunityEvidence {");
    for (const field of [
      "claimKey",
      "claimText",
      "truthClass",
      "sourceSystem",
      "sourceType",
      "sourceThreadId",
      "sourceMessageId",
      "sourceArtifactId",
      "sourceFingerprintSha256",
      "sourceLocator",
      "sourceSection",
      "sourcePage",
      "sourceObservedAt",
      "observedByActorId",
      "verifiedAt",
      "verifiedByActorId",
      "approvalState",
      "approvedAt",
      "approvedByActorId",
      "disclosureState",
      "reviewAfter",
      "expiresAt",
      "revokedAt",
      "supersedesEvidenceId",
      "agreementReference",
      "counterparty",
      "agreementEffectiveAt",
      "signatureEvidenceReference",
      "amountCents",
      "currency",
      "payeeEntityReference",
      "externalTransactionReference",
      "reconciliationState",
      "retentionPolicyKey",
      "retentionReviewAt",
      "legalHoldAt",
      "tombstonedAt",
    ]) {
      expect(schema).toContain(field);
    }
    expect(schema).toContain('@relation("CompanyOpportunityEvidenceSupersession"');
    expect(schema).toMatch(/@@unique\(\[organizationId, opportunityId, ingestionKey\]/);
  });

  it("keeps events append-oriented, typed, and free of arbitrary metadata", () => {
    expect(schema).toContain("model CompanyOpportunityEvent {");
    expect(schema).toContain("fromLifecycleStage");
    expect(schema).toContain("toLifecycleStage");
    expect(schema).toContain("railType");
    expect(schema).toContain("fromRailState");
    expect(schema).toContain("toRailState");
    expect(schema).toMatch(/@@unique\(\[organizationId, opportunityId, idempotencyKey\]/);
    expect(schema).not.toMatch(/model CompanyOpportunityEvent \{[\s\S]*?metadata\s+Json/);
  });

  it("does not leak company records into broad MessageThread, Document, or Task workspaces", () => {
    expect(legacySchema).not.toMatch(/model MessageThread \{[\s\S]*?companyExternalOpportunity/);
    expect(legacySchema).not.toMatch(/model Document \{[\s\S]*?companyOpportunityEvidence/);
    expect(legacySchema).not.toMatch(/model Task \{[\s\S]*?companyExternalOpportunity/);
    expect(legacySchema).not.toContain("model CompanyOpportunityMessage");
    expect(legacySchema).not.toContain("model CompanyOpportunityTask");
    expect(legacySchema).not.toContain("model CompanyOpportunityDocument");
  });

  it("adds only new evidence tables with closed-state checks and evidence-preserving foreign keys", () => {
    expect(migration).toContain('CREATE TABLE "company_external_opportunities"');
    expect(migration).toContain('CREATE TABLE "company_opportunity_evidence"');
    expect(migration).toContain('CREATE TABLE "company_opportunity_events"');
    expect(migration).toContain("CHECK");
    expect(migration).toContain("ON DELETE RESTRICT");
    expect(migration).not.toContain('ALTER TABLE "message_threads"');
    expect(migration).not.toContain('ALTER TABLE "tasks"');
    expect(migration).not.toContain('CREATE UNIQUE INDEX "documents_');
    expect(migration).not.toMatch(/\b(DROP|TRUNCATE|DELETE FROM)\b|(?:^|;)\s*UPDATE\s+/im);
  });
});
