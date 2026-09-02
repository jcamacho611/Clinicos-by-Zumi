import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

const organizationFindFirst = vi.fn();
const userFindFirst = vi.fn();
const opportunityFindFirst = vi.fn();
const opportunityFindMany = vi.fn();
const opportunityCreate = vi.fn();
const opportunityUpdateMany = vi.fn();
const evidenceFindFirst = vi.fn();
const evidenceFindMany = vi.fn();
const evidenceCreate = vi.fn();
const eventFindFirst = vi.fn();
const eventCreate = vi.fn();
const auditCreate = vi.fn();
const advisoryLock = vi.fn();

const tx = {
  $queryRaw: (...args: unknown[]) => advisoryLock(...args),
  organization: { findFirst: (...args: unknown[]) => organizationFindFirst(...args) },
  user: { findFirst: (...args: unknown[]) => userFindFirst(...args) },
  companyExternalOpportunity: {
    findFirst: (...args: unknown[]) => opportunityFindFirst(...args),
    findMany: (...args: unknown[]) => opportunityFindMany(...args),
    create: (...args: unknown[]) => opportunityCreate(...args),
    updateMany: (...args: unknown[]) => opportunityUpdateMany(...args),
  },
  companyOpportunityEvidence: {
    findFirst: (...args: unknown[]) => evidenceFindFirst(...args),
    findMany: (...args: unknown[]) => evidenceFindMany(...args),
    create: (...args: unknown[]) => evidenceCreate(...args),
  },
  companyOpportunityEvent: {
    findFirst: (...args: unknown[]) => eventFindFirst(...args),
    create: (...args: unknown[]) => eventCreate(...args),
  },
  auditLog: { create: (...args: unknown[]) => auditCreate(...args) },
};

const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (callback: (client: typeof tx) => unknown) => transaction(callback),
    organization: { findFirst: (...args: unknown[]) => organizationFindFirst(...args) },
    user: { findFirst: (...args: unknown[]) => userFindFirst(...args) },
    companyExternalOpportunity: {
      findFirst: (...args: unknown[]) => opportunityFindFirst(...args),
      findMany: (...args: unknown[]) => opportunityFindMany(...args),
    },
  },
}));

const repository = await import("@/lib/repositories/company-opportunity-repository");

const now = new Date("2026-08-31T12:00:00.000Z");
const fingerprint = "a".repeat(64);

function session(
  role: ClinicRole = "clinic_owner",
  organizationSlug = "clinicos-by-zumi",
  organizationId = "org-platform",
): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId,
    organizationName: "Klinikos",
    organizationSlug,
    email: "founder@example.test",
    name: "Founder",
    role,
    demo: false,
    expiresAt: Date.now() + 60_000,
  };
}

const opportunity = {
  id: "opp-1",
  organizationId: "org-platform",
  operatingScope: "KLINIKOS_COMPANY_OS",
  version: 1,
  title: "Public-sector workforce opportunity",
  opportunityClass: "GOVERNMENT_CONTRACT",
  targetClass: "GOVERNMENT_PROGRAM",
  targetOrganizationName: "Example Agency",
  targetOrganizationDomain: "agency.example",
  purpose: "Evaluate a reusable workforce procurement opportunity.",
  ask: "Confirm the authoritative submission path.",
  lifecycleStage: "DISCOVERED",
  qualificationState: "UNQUALIFIED",
  providerState: "UNPROVEN",
  deliveryState: "UNPROVEN",
  responseState: "UNPROVEN",
  submissionState: "NOT_STARTED",
  awardState: "UNPROVEN",
  contractState: "UNPROVEN",
  cashState: "UNPROVEN",
  ownerId: null,
  deadlineAt: null,
  nextAction: "Verify source",
  nextActionDueAt: null,
  blocker: null,
  sourceSystem: "outlook-audit",
  sourceType: "OUTLOOK_SUMMARY",
  sourceReference: "outlook-summary://2026-09-01/thread-1",
  sourceFingerprintSha256: fingerprint,
  sourceObservedAt: now,
  createdById: "user-1",
  createdAt: now,
  updatedAt: now,
};

const createInput = {
  title: opportunity.title,
  opportunityClass: opportunity.opportunityClass,
  targetClass: opportunity.targetClass,
  targetOrganizationName: opportunity.targetOrganizationName,
  targetOrganizationDomain: opportunity.targetOrganizationDomain,
  purpose: opportunity.purpose,
  ask: opportunity.ask,
  nextAction: opportunity.nextAction,
  sourceSystem: opportunity.sourceSystem,
  sourceType: "OUTLOOK_SUMMARY",
  sourceReference: opportunity.sourceReference,
  sourceFingerprintSha256: fingerprint,
  sourceObservedAt: now,
};

const providerEvidenceInput = {
  expectedVersion: 1,
  ingestionKey: "provider-acceptance-1",
  claimKey: "outbound.provider_acceptance",
  claimText: "The configured email provider accepted the message.",
  claimTruthClass: "ACTUAL",
  evidenceType: "PROVIDER_ACCEPTANCE",
  sourceSystem: "email-provider",
  sourceType: "EMAIL_PROVIDER_RECEIPT",
  sourceReference: "email-provider-receipt://message-1",
  sourceThreadId: "thread-1",
  sourceMessageId: "message-1",
  sourceArtifactId: "artifact-1",
  sourceFingerprintSha256: "b".repeat(64),
  sourceLocator: "provider/message-1",
  sourceSection: "delivery",
  sourcePage: 1,
  sourceObservedAt: now,
  verifiedByCurrentActor: true,
  reviewAfter: new Date("2026-09-15T12:00:00.000Z"),
  expiresAt: new Date("2026-12-01T12:00:00.000Z"),
  retentionReviewAt: new Date("2027-09-01T12:00:00.000Z"),
} as const;

function persistedProviderEvidence(overrides: Record<string, unknown> = {}) {
  const verifiedAt = new Date("2026-09-01T13:00:00.000Z");
  return {
    id: "evidence-existing",
    claimKey: providerEvidenceInput.claimKey,
    claimText: providerEvidenceInput.claimText,
    truthClass: providerEvidenceInput.claimTruthClass,
    evidenceType: providerEvidenceInput.evidenceType,
    sourceSystem: providerEvidenceInput.sourceSystem,
    sourceType: providerEvidenceInput.sourceType,
    sourceReference: providerEvidenceInput.sourceReference,
    sourceThreadId: providerEvidenceInput.sourceThreadId,
    sourceMessageId: providerEvidenceInput.sourceMessageId,
    sourceArtifactId: providerEvidenceInput.sourceArtifactId,
    sourceFingerprintSha256: providerEvidenceInput.sourceFingerprintSha256,
    sourceLocator: providerEvidenceInput.sourceLocator,
    sourceSection: providerEvidenceInput.sourceSection,
    sourcePage: providerEvidenceInput.sourcePage,
    sourceObservedAt: providerEvidenceInput.sourceObservedAt,
    observedByActorId: "user-1",
    verifiedAt,
    verifiedByActorId: "user-1",
    approvalState: "APPROVED",
    approvedAt: verifiedAt,
    approvedByActorId: "user-1",
    reviewAfter: providerEvidenceInput.reviewAfter,
    expiresAt: providerEvidenceInput.expiresAt,
    revokedAt: null,
    tombstonedAt: null,
    supersedesEvidenceId: null,
    correctionReason: null,
    agreementReference: null,
    counterparty: null,
    agreementEffectiveAt: null,
    signatureEvidenceReference: null,
    amountCents: null,
    currency: null,
    payeeEntityReference: null,
    externalTransactionReference: null,
    reconciliationState: null,
    retentionReviewAt: providerEvidenceInput.retentionReviewAt,
    recordedByActorId: "user-1",
    createdAt: verifiedAt,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("KLINIKOS_PLATFORM_ORGANIZATION_SLUG", "clinicos-by-zumi");
  organizationFindFirst.mockResolvedValue({
    id: "org-platform",
    slug: "clinicos-by-zumi",
    status: "active",
  });
  userFindFirst.mockResolvedValue({ id: "user-1" });
  opportunityFindFirst.mockResolvedValue(null);
  opportunityFindMany.mockResolvedValue([]);
  opportunityCreate.mockResolvedValue(opportunity);
  opportunityUpdateMany.mockResolvedValue({ count: 1 });
  evidenceFindFirst.mockResolvedValue(null);
  evidenceFindMany.mockResolvedValue([]);
  evidenceCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      id: "evidence-1",
      createdAt: now,
      verifiedAt: null,
      verifiedByActorId: null,
      expiresAt: null,
      revokedAt: null,
      tombstonedAt: null,
      supersedesEvidenceId: null,
      agreementReference: null,
      counterparty: null,
      agreementEffectiveAt: null,
      signatureEvidenceReference: null,
      amountCents: null,
      currency: null,
      payeeEntityReference: null,
      externalTransactionReference: null,
      reconciliationState: null,
      ...data,
    }),
  );
  eventFindFirst.mockResolvedValue(null);
  eventCreate.mockResolvedValue({ id: "event-1" });
  auditCreate.mockResolvedValue({ id: "audit-1" });
  advisoryLock.mockResolvedValue([{ pg_advisory_xact_lock: null }]);
});

describe("company opportunity repository", () => {
  it("rejects multiline message bodies, email headers, and secret-like text at creation", () => {
    for (const unsafe of [
      { purpose: "From: sender@example.test\nTo: operator@example.test\nFull email body" },
      { ask: "Subject: copied message content" },
      { nextAction: "Authorization: Bearer secret-token" },
      { blocker: "api_key=do-not-store-this" },
      { sourceReference: "outlook-summary://api_key=do-not-store-this" },
    ]) {
      expect(repository.createCompanyOpportunitySchema.safeParse({
        ...createInput,
        ...unsafe,
      }).success).toBe(false);
    }

    expect(repository.createCompanyOpportunitySchema.safeParse(createInput).success).toBe(true);
  });

  it("rejects secret-like evidence claims and unsafe opaque references", () => {
    for (const unsafe of [
      { claimText: "Authorization: Bearer do-not-store-this" },
      { sourceThreadId: "api_key=do-not-store-this" },
      { sourceMessageId: "https://example.test/message" },
      { sourceReference: "email-provider-receipt://Authorization:Bearer-do-not-store-this" },
    ]) {
      expect(repository.appendCompanyOpportunityEvidenceSchema.safeParse({
        ...providerEvidenceInput,
        ...unsafe,
      }).success).toBe(false);
    }

    expect(repository.appendCompanyOpportunityEvidenceSchema.safeParse(providerEvidenceInput).success).toBe(true);
  });

  it("fails before persistence outside the configured first-party platform organization", async () => {
    await expect(
      repository.createCompanyOpportunity(session("clinic_owner", "customer-clinic", "org-customer"), createInput),
    ).rejects.toMatchObject({ status: 404 });
    await expect(repository.createCompanyOpportunity(session("administrator"), createInput)).rejects.toMatchObject({
      status: 404,
    });
    await expect(repository.createCompanyOpportunity({ ...session(), demo: true }, createInput)).rejects.toMatchObject({
      status: 404,
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(opportunityCreate).not.toHaveBeenCalled();
  });

  it("creates a discovered aggregate with observed-source evidence, event, and audit atomically", async () => {
    const result = await repository.createCompanyOpportunity(session(), createInput);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(advisoryLock).toHaveBeenCalledTimes(1);
    expect(opportunityCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organizationId: "org-platform",
        lifecycleStage: "DISCOVERED",
        qualificationState: "UNQUALIFIED",
        awardState: "UNPROVEN",
        contractState: "UNPROVEN",
        cashState: "UNPROVEN",
        createdById: "user-1",
      }),
    }));
    expect(evidenceCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organizationId: "org-platform",
        opportunityId: "opp-1",
        claimKey: "source_observed",
        truthClass: "ACTUAL",
        evidenceType: "OBSERVED_SOURCE",
        approvalState: "NEEDS_REVIEW",
        disclosureState: "INTERNAL_ONLY",
        recordedByActorId: "user-1",
      }),
    }));
    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "OPPORTUNITY_CREATED",
        expectedVersion: 0,
        resultingVersion: 1,
      }),
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-platform",
        action: "company.opportunity_created",
        resourceId: "opp-1",
      }),
    });
    expect(result).toMatchObject({
      id: "opp-1",
      lifecycleStage: "DISCOVERED",
      awardState: "UNPROVEN",
      contractState: "UNPROVEN",
      cashState: "UNPROVEN",
    });
    expect(result).not.toHaveProperty("sourceFingerprintSha256");
  });

  it("makes duplicate source import idempotent only when the semantic payload matches", async () => {
    opportunityFindFirst.mockResolvedValueOnce({ ...opportunity, evidence: [] });
    await expect(repository.createCompanyOpportunity(session(), createInput)).resolves.toMatchObject({ id: "opp-1" });
    expect(opportunityCreate).not.toHaveBeenCalled();
    expect(evidenceCreate).not.toHaveBeenCalled();

    opportunityFindFirst.mockResolvedValueOnce({ ...opportunity, evidence: [] });
    await expect(
      repository.createCompanyOpportunity(session(), { ...createInput, title: "Different semantic claim" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("re-derives time-sensitive rails on an idempotent create retry", async () => {
    const expiredQualification = persistedProviderEvidence({
      id: "qualification-idempotent-retry",
      claimKey: "pipeline.qualified",
      claimText: "The opportunity was previously qualified.",
      truthClass: "PIPELINE",
      evidenceType: "QUALIFIED_PIPELINE",
      sourceType: "AUTHORITATIVE_RECORD",
      sourceReference: "authoritative-record://qualification-idempotent-retry",
      expiresAt: new Date("2026-09-01T14:00:00.000Z"),
      createdAt: new Date("2026-09-01T13:00:00.000Z"),
    });
    opportunityFindFirst.mockResolvedValueOnce({
      ...opportunity,
      qualificationState: "QUALIFIED",
      evidence: [expiredQualification],
    });

    await expect(repository.createCompanyOpportunity(session(), createInput)).resolves.toMatchObject({
      id: "opp-1",
      qualificationState: "STALE",
    });
  });

  it("orders late-ingested evidence by effective observation rather than ingestion time", async () => {
    const newerAward = persistedProviderEvidence({
      id: "award-newer-observation",
      claimKey: "award.actual",
      claimText: "The authoritative notice records an award.",
      truthClass: "ACTUAL",
      evidenceType: "AWARD_NOTICE",
      sourceType: "OFFICIAL_NOTICE",
      sourceReference: "official-notice://award-newer-observation",
      sourceObservedAt: new Date("2026-09-01T12:30:00.000Z"),
      verifiedAt: new Date("2026-09-01T12:45:00.000Z"),
      createdAt: new Date("2026-09-01T13:00:00.000Z"),
    });
    const olderDeclineIngestedLater = persistedProviderEvidence({
      id: "decline-older-observation",
      claimKey: "award.declined",
      claimText: "An older authoritative notice recorded a decline.",
      truthClass: "ACTUAL",
      evidenceType: "DECLINE_NOTICE",
      sourceType: "OFFICIAL_NOTICE",
      sourceReference: "official-notice://decline-older-observation",
      sourceObservedAt: new Date("2026-09-01T12:00:00.000Z"),
      verifiedAt: new Date("2026-09-01T12:15:00.000Z"),
      createdAt: new Date("2026-09-01T14:00:00.000Z"),
    });
    opportunityFindFirst.mockResolvedValueOnce({
      ...opportunity,
      awardState: "DECLINED",
      evidence: [newerAward, olderDeclineIngestedLater],
    });

    await expect(repository.getCompanyOpportunity(session(), "opp-1")).resolves.toMatchObject({
      awardState: "AWARDED",
    });
  });

  it("appends rather than mutates evidence and updates only the independently proven rail", async () => {
    opportunityFindFirst.mockResolvedValueOnce(opportunity);
    evidenceFindMany.mockResolvedValueOnce([]);
    opportunityFindFirst.mockResolvedValueOnce({ ...opportunity, version: 2, providerState: "ACCEPTED" });

    const result = await repository.appendCompanyOpportunityEvidence(
      session(),
      "opp-1",
      providerEvidenceInput,
    );

    expect(evidenceCreate).toHaveBeenCalledTimes(1);
    expect(evidenceCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        approvalState: "APPROVED",
        approvedByActorId: "user-1",
      }),
    }));
    expect(tx.companyOpportunityEvidence).not.toHaveProperty("update");
    expect(opportunityUpdateMany).toHaveBeenCalledWith({
      where: { id: "opp-1", organizationId: "org-platform", version: 1 },
      data: expect.objectContaining({
        version: { increment: 1 },
        providerState: "ACCEPTED",
        deliveryState: "UNPROVEN",
        responseState: "UNPROVEN",
        awardState: "UNPROVEN",
        contractState: "UNPROVEN",
        cashState: "UNPROVEN",
      }),
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "EVIDENCE_APPENDED",
        expectedVersion: 1,
        resultingVersion: 2,
        railType: "provider",
        toRailState: "ACCEPTED",
      }),
    });
    expect(result).toMatchObject({ id: "opp-1", version: 2, providerState: "ACCEPTED" });
  });

  it("replays evidence only when every persisted semantic field and verifier identity match", async () => {
    const existing = persistedProviderEvidence();
    opportunityFindFirst.mockResolvedValueOnce(opportunity);
    evidenceFindFirst.mockResolvedValueOnce(existing);
    evidenceFindMany.mockResolvedValueOnce([existing]);

    await expect(
      repository.appendCompanyOpportunityEvidence(session(), "opp-1", providerEvidenceInput),
    ).resolves.toMatchObject({ id: "opp-1", providerState: "ACCEPTED" });
    expect(evidenceCreate).not.toHaveBeenCalled();

    for (const changed of [
      { sourceMessageId: "different-message" },
      { sourceLocator: "provider/different-message" },
      { reviewAfter: new Date("2026-09-16T12:00:00.000Z") },
      { retentionReviewAt: new Date("2027-09-02T12:00:00.000Z") },
      { verifiedByCurrentActor: false },
    ]) {
      opportunityFindFirst.mockResolvedValueOnce(opportunity);
      evidenceFindFirst.mockResolvedValueOnce(existing);
      await expect(
        repository.appendCompanyOpportunityEvidence(session(), "opp-1", {
          ...providerEvidenceInput,
          ...changed,
        }),
      ).rejects.toMatchObject({ status: 409 });
    }
  });

  it("rejects contract and cash idempotency replays whose financial semantics changed", async () => {
    const settlementInput = {
      expectedVersion: 1,
      ingestionKey: "cash-settlement-1",
      claimKey: "cash.received",
      claimText: "The payment processor reported a settled payment.",
      claimTruthClass: "ACTUAL",
      evidenceType: "PAYMENT_SETTLEMENT",
      sourceSystem: "payment-processor",
      sourceType: "PAYMENT_PROCESSOR",
      sourceReference: "payment-processor://settlement-1",
      sourceFingerprintSha256: "c".repeat(64),
      sourceObservedAt: now,
      verifiedByCurrentActor: true,
      cash: {
        amountCents: 2000,
        currency: "USD",
        payeeEntityReference: "klinikos-inc",
        externalTransactionReference: "settlement-1",
        reconciliationState: "SETTLED",
      },
    } as const;
    const persistedSettlement = persistedProviderEvidence({
      claimKey: settlementInput.claimKey,
      claimText: settlementInput.claimText,
      evidenceType: settlementInput.evidenceType,
      sourceSystem: settlementInput.sourceSystem,
      sourceType: settlementInput.sourceType,
      sourceReference: settlementInput.sourceReference,
      sourceThreadId: null,
      sourceMessageId: null,
      sourceArtifactId: null,
      sourceFingerprintSha256: settlementInput.sourceFingerprintSha256,
      sourceLocator: null,
      sourceSection: null,
      sourcePage: null,
      reviewAfter: null,
      expiresAt: null,
      amountCents: 1000,
      currency: "USD",
      payeeEntityReference: "klinikos-inc",
      externalTransactionReference: "settlement-1",
      reconciliationState: "SETTLED",
      retentionReviewAt: null,
    });
    opportunityFindFirst.mockResolvedValueOnce(opportunity);
    evidenceFindFirst.mockResolvedValueOnce(persistedSettlement);
    await expect(
      repository.appendCompanyOpportunityEvidence(session(), "opp-1", settlementInput),
    ).rejects.toMatchObject({ status: 409 });

    const agreementInput = {
      expectedVersion: 1,
      ingestionKey: "agreement-1",
      claimKey: "contract.executed",
      claimText: "The parties executed the referenced agreement.",
      claimTruthClass: "CONTRACTED",
      evidenceType: "EXECUTED_AGREEMENT",
      sourceSystem: "contract-register",
      sourceType: "EXECUTED_DOCUMENT",
      sourceReference: "executed-document-sha256://agreement-1",
      sourceFingerprintSha256: "d".repeat(64),
      sourceObservedAt: now,
      verifiedByCurrentActor: true,
      contract: {
        agreementReference: "agreement-1",
        counterparty: "Example Agency",
        effectiveAt: new Date("2026-09-01T00:00:00.000Z"),
        signatureEvidenceReference: "signature-sha256://agreement-1",
      },
    } as const;
    const persistedAgreement = persistedProviderEvidence({
      claimKey: agreementInput.claimKey,
      claimText: agreementInput.claimText,
      truthClass: agreementInput.claimTruthClass,
      evidenceType: agreementInput.evidenceType,
      sourceSystem: agreementInput.sourceSystem,
      sourceType: agreementInput.sourceType,
      sourceReference: agreementInput.sourceReference,
      sourceThreadId: null,
      sourceMessageId: null,
      sourceArtifactId: null,
      sourceFingerprintSha256: agreementInput.sourceFingerprintSha256,
      sourceLocator: null,
      sourceSection: null,
      sourcePage: null,
      reviewAfter: null,
      expiresAt: null,
      agreementReference: "different-agreement",
      counterparty: "Example Agency",
      agreementEffectiveAt: agreementInput.contract.effectiveAt,
      signatureEvidenceReference: agreementInput.contract.signatureEvidenceReference,
      retentionReviewAt: null,
    });
    opportunityFindFirst.mockResolvedValueOnce(opportunity);
    evidenceFindFirst.mockResolvedValueOnce(persistedAgreement);
    await expect(
      repository.appendCompanyOpportunityEvidence(session(), "opp-1", agreementInput),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("allows only a verified same-claim correction to supersede one active prior record", async () => {
    const correction = {
      expectedVersion: 1,
      ingestionKey: "correction-1",
      claimKey: "award.current",
      claimText: "The earlier award evidence was associated with the wrong opportunity.",
      claimTruthClass: "ACTUAL",
      evidenceType: "EVIDENCE_CORRECTION",
      sourceSystem: "company-review",
      sourceType: "AUTHORITATIVE_RECORD",
      sourceReference: "authoritative-record://award-correction-1",
      sourceFingerprintSha256: "e".repeat(64),
      sourceObservedAt: now,
      verifiedByCurrentActor: true,
      supersedesEvidenceId: "award-evidence-1",
      correctionReason: "Wrong opportunity association confirmed by authoritative review.",
    } as const;

    opportunityFindFirst.mockResolvedValueOnce(opportunity);
    evidenceFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "award-evidence-1",
        claimKey: "different-claim",
        evidenceType: "AWARD_NOTICE",
        tombstonedAt: null,
      });
    await expect(
      repository.appendCompanyOpportunityEvidence(session(), "opp-1", correction),
    ).rejects.toMatchObject({ status: 409 });

    opportunityFindFirst.mockResolvedValueOnce(opportunity);
    evidenceFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "award-evidence-1",
        claimKey: correction.claimKey,
        evidenceType: "AWARD_NOTICE",
        tombstonedAt: null,
      })
      .mockResolvedValueOnce({ id: "existing-correction" });
    await expect(
      repository.appendCompanyOpportunityEvidence(session(), "opp-1", correction),
    ).rejects.toMatchObject({ status: 409 });

    await expect(
      repository.appendCompanyOpportunityEvidence(session(), "opp-1", {
        ...correction,
        ingestionKey: "unverified-correction",
        verifiedByCurrentActor: false,
      }),
    ).rejects.toBeDefined();
    expect(evidenceCreate).not.toHaveBeenCalled();
  });

  it("derives expired and revoked current rails at read time instead of returning stale persisted truth", async () => {
    const expiredQualification = persistedProviderEvidence({
      id: "qualification-1",
      claimKey: "pipeline.qualified",
      claimText: "The opportunity was previously qualified.",
      truthClass: "PIPELINE",
      evidenceType: "QUALIFIED_PIPELINE",
      sourceType: "AUTHORITATIVE_RECORD",
      sourceReference: "authoritative-record://qualification-1",
      expiresAt: new Date("2026-09-01T14:00:00.000Z"),
      createdAt: new Date("2026-09-01T13:00:00.000Z"),
    });
    const revokedProvider = persistedProviderEvidence({
      id: "provider-1",
      approvalState: "REVOKED",
      approvedAt: new Date("2026-09-01T13:00:00.000Z"),
      revokedAt: new Date("2026-09-01T15:00:00.000Z"),
      expiresAt: null,
      createdAt: new Date("2026-09-01T14:00:00.000Z"),
    });
    opportunityFindFirst.mockResolvedValueOnce({
      ...opportunity,
      qualificationState: "QUALIFIED",
      providerState: "ACCEPTED",
      evidence: [expiredQualification, revokedProvider],
    });

    await expect(repository.getCompanyOpportunity(session(), "opp-1")).resolves.toMatchObject({
      qualificationState: "STALE",
      providerState: "REVOKED",
    });
  });

  it("rejects stale transitions and requires qualifying evidence for consequential stages", async () => {
    opportunityFindFirst.mockResolvedValue({ ...opportunity, lifecycleStage: "FIT_REVIEW", version: 3 });
    evidenceFindMany.mockResolvedValue([]);

    await expect(
      repository.transitionCompanyOpportunity(session(), "opp-1", {
        expectedVersion: 2,
        targetStage: "QUALIFIED",
        idempotencyKey: "transition-1",
        reason: "Source was reviewed.",
      }),
    ).rejects.toMatchObject({ status: 409 });

    await expect(
      repository.transitionCompanyOpportunity(session(), "opp-1", {
        expectedVersion: 3,
        targetStage: "QUALIFIED",
        idempotencyKey: "transition-2",
        reason: "Source was reviewed.",
      }),
    ).rejects.toMatchObject({ status: 409 });

    expect(opportunityUpdateMany).not.toHaveBeenCalled();
  });

  it("does not expose delete or in-place evidence mutation methods", () => {
    expect(repository).not.toHaveProperty("deleteCompanyOpportunity");
    expect(repository).not.toHaveProperty("updateCompanyOpportunityEvidence");
    expect(repository).not.toHaveProperty("deleteCompanyOpportunityEvidence");
  });
});
