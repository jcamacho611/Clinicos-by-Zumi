import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  appendCompanyOpportunityEvidence,
  createCompanyOpportunity,
  getCompanyOpportunity,
  listCompanyOpportunities,
  transitionCompanyOpportunity,
} from "@/lib/repositories/company-opportunity-repository";

const shouldRun =
  process.env.KLINIKOS_ALLOW_DISPOSABLE_DATABASE_TESTS === "disposable-verification";
const suffix = `company_opportunity_${process.pid}_${Date.now()}`;
const organizationId = `org_${suffix}`;
const userId = `user_${suffix}`;
const organizationSlug = `platform-${suffix}`;
const otherOrganizationId = `other_org_${suffix}`;
const otherUserId = `other_user_${suffix}`;
const otherOrganizationSlug = `tenant-${suffix}`;
const previousPlatformOrganizationSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG;
const opportunityIds = new Set<string>();

function hashFor(label: string) {
  return createHash("sha256").update(`${suffix}:${label}`).digest("hex");
}

function observedAt() {
  return new Date(Date.now() - 5 * 60_000);
}

function session(overrides: Partial<ClinicSession> = {}): ClinicSession {
  return {
    sessionId: `session_${suffix}`,
    userId,
    organizationId,
    organizationName: "Klinikos Test Platform",
    organizationSlug,
    email: `${suffix}@example.test`,
    name: "Company Operator",
    role: "clinic_owner",
    demo: false,
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

function createInput(label: string, sourceObservedAt = observedAt()) {
  return {
    title: `Disposable ${label} opportunity`,
    opportunityClass: "GOVERNMENT_CONTRACT" as const,
    targetClass: "GOVERNMENT_PROGRAM" as const,
    targetOrganizationName: "Example Workforce Agency",
    targetOrganizationDomain: "workforce.example",
    purpose: "Prove the Company OS opportunity evidence boundary.",
    ask: "Confirm the authoritative application path.",
    nextAction: "Review the primary source",
    sourceSystem: "repository-db-test",
    sourceType: "AUTHORITATIVE_RECORD" as const,
    sourceReference: `authoritative-record://${suffix}/${label}`,
    sourceFingerprintSha256: hashFor(`opportunity:${label}`),
    sourceObservedAt,
  };
}

async function createOpportunity(label: string) {
  const created = await createCompanyOpportunity(session(), createInput(label));
  opportunityIds.add(created.id);
  return created;
}

async function aggregateCounts(opportunityId: string) {
  const [evidence, events, audits] = await Promise.all([
    db.companyOpportunityEvidence.count({ where: { organizationId, opportunityId } }),
    db.companyOpportunityEvent.count({ where: { organizationId, opportunityId } }),
    db.auditLog.count({
      where: {
        organizationId,
        resourceType: "company_external_opportunity",
        resourceId: opportunityId,
      },
    }),
  ]);
  return { evidence, events, audits };
}

function directEvidence(
  opportunityId: string,
  label: string,
  overrides: Partial<Prisma.CompanyOpportunityEvidenceUncheckedCreateInput> = {},
): Prisma.CompanyOpportunityEvidenceUncheckedCreateInput {
  return {
    organizationId,
    opportunityId,
    claimKey: `constraint.${label}`,
    claimText: `Database constraint control for ${label}.`,
    truthClass: "ACTUAL",
    evidenceType: "OBSERVED_SOURCE",
    sourceSystem: "repository-db-constraint-test",
    sourceType: "AUTHORITATIVE_RECORD",
    sourceReference: `authoritative-record://${suffix}/constraints/${label}`,
    sourceFingerprintSha256: hashFor(`constraint:${label}`),
    ingestionKey: `constraint:${suffix}:${label}`,
    sourceObservedAt: observedAt(),
    observedByActorId: userId,
    approvalState: "NEEDS_REVIEW",
    disclosureState: "INTERNAL_ONLY",
    recordedByActorId: userId,
    ...overrides,
  };
}

async function expectConstraintViolation(
  opportunityId: string,
  label: string,
  overrides: Partial<Prisma.CompanyOpportunityEvidenceUncheckedCreateInput>,
) {
  const ingestionKey = `constraint:${suffix}:${label}`;
  await expect(
    db.companyOpportunityEvidence.create({ data: directEvidence(opportunityId, label, overrides) }),
  ).rejects.toBeDefined();
  expect(await db.companyOpportunityEvidence.count({
    where: { organizationId, opportunityId, ingestionKey },
  })).toBe(0);
}

describe.skipIf(!shouldRun)("company opportunity repository against disposable PostgreSQL", () => {
  beforeAll(async () => {
    process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG = organizationSlug;
    await db.organization.createMany({
      data: [
        {
          id: organizationId,
          name: "Klinikos Test Platform",
          slug: organizationSlug,
          clinicType: "platform",
        },
        {
          id: otherOrganizationId,
          name: "Unrelated Customer Tenant",
          slug: otherOrganizationSlug,
          clinicType: "clinic",
        },
      ],
    });
    await db.user.createMany({
      data: [
        {
          id: userId,
          organizationId,
          email: `${suffix}@example.test`,
          name: "Company Operator",
          roleKey: "clinic_owner",
        },
        {
          id: otherUserId,
          organizationId: otherOrganizationId,
          email: `other-${suffix}@example.test`,
          name: "Unrelated Tenant Operator",
          roleKey: "clinic_owner",
        },
      ],
    });
  });

  afterAll(async () => {
    try {
      const ids = [...opportunityIds];
      if (ids.length > 0) {
        await db.auditLog.deleteMany({
          where: {
            organizationId: { in: [organizationId, otherOrganizationId] },
            resourceType: "company_external_opportunity",
            resourceId: { in: ids },
          },
        });
        await db.companyOpportunityEvent.deleteMany({
          where: {
            organizationId: { in: [organizationId, otherOrganizationId] },
            opportunityId: { in: ids },
          },
        });
        // The supersession relation uses RESTRICT, so corrections must be removed before their targets.
        await db.companyOpportunityEvidence.deleteMany({
          where: {
            organizationId: { in: [organizationId, otherOrganizationId] },
            opportunityId: { in: ids },
            supersedesEvidenceId: { not: null },
          },
        });
        await db.companyOpportunityEvidence.deleteMany({
          where: {
            organizationId: { in: [organizationId, otherOrganizationId] },
            opportunityId: { in: ids },
          },
        });
        await db.companyExternalOpportunity.deleteMany({
          where: {
            organizationId: { in: [organizationId, otherOrganizationId] },
            id: { in: ids },
          },
        });
      }
      await db.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
      await db.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
    } finally {
      if (previousPlatformOrganizationSlug === undefined) {
        delete process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG;
      } else {
        process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG = previousPlatformOrganizationSlug;
      }
    }
  });

  it("persists discovery, independent evidence rails, and an evidence-gated lifecycle", async () => {
    const sourceObservedAt = observedAt();
    const input = createInput("lifecycle", sourceObservedAt);
    const created = await createCompanyOpportunity(session(), input);
    opportunityIds.add(created.id);

    expect(created).toMatchObject({
      version: 1,
      lifecycleStage: "DISCOVERED",
      qualificationState: "UNQUALIFIED",
      providerState: "UNPROVEN",
      awardState: "UNPROVEN",
      contractState: "UNPROVEN",
      cashState: "UNPROVEN",
    });
    expect(created).not.toHaveProperty("sourceFingerprintSha256");

    const duplicate = await createCompanyOpportunity(session(), input);
    expect(duplicate.id).toBe(created.id);

    const fitReview = await transitionCompanyOpportunity(session(), created.id, {
      expectedVersion: 1,
      targetStage: "FIT_REVIEW",
      idempotencyKey: `fit-review-${suffix}`,
      reason: "The source is ready for fit review; no commercial outcome is inferred.",
    });
    expect(fitReview).toMatchObject({ version: 2, lifecycleStage: "FIT_REVIEW" });

    const evidenced = await appendCompanyOpportunityEvidence(session(), created.id, {
      expectedVersion: 2,
      ingestionKey: `qualification-${suffix}`,
      claimKey: "pipeline.qualified",
      claimText: "A human reviewed the authoritative record and qualified this opportunity for the pipeline.",
      claimTruthClass: "PIPELINE",
      evidenceType: "QUALIFIED_PIPELINE",
      sourceSystem: "repository-db-test",
      sourceType: "AUTHORITATIVE_RECORD",
      sourceReference: `authoritative-record://${suffix}/lifecycle#qualification`,
      sourceFingerprintSha256: hashFor("qualification"),
      sourceObservedAt,
      verifiedByCurrentActor: true,
    });
    expect(evidenced).toMatchObject({
      version: 3,
      lifecycleStage: "FIT_REVIEW",
      qualificationState: "QUALIFIED",
      awardState: "UNPROVEN",
      contractState: "UNPROVEN",
      cashState: "UNPROVEN",
    });

    const qualified = await transitionCompanyOpportunity(session(), created.id, {
      expectedVersion: 3,
      targetStage: "QUALIFIED",
      idempotencyKey: `qualified-${suffix}`,
      reason: "Authoritative qualification evidence exists.",
    });
    expect(qualified).toMatchObject({ version: 4, lifecycleStage: "QUALIFIED" });

    const persisted = await getCompanyOpportunity(session(), created.id);
    expect(persisted).toMatchObject({
      version: 4,
      lifecycleStage: "QUALIFIED",
      qualificationState: "QUALIFIED",
      awardState: "UNPROVEN",
      contractState: "UNPROVEN",
      cashState: "UNPROVEN",
    });
    expect(await aggregateCounts(created.id)).toEqual({ evidence: 2, events: 4, audits: 4 });
  });

  it("rolls back evidence, rail, version, and audit writes atomically when the event append fails", async () => {
    const created = await createOpportunity("atomic-rollback");
    const ingestionKey = `rollback-${suffix}`;

    // Reserve the repository's exact event idempotency key so failure occurs after
    // the evidence insert and optimistic aggregate update inside the transaction.
    await db.companyOpportunityEvent.create({
      data: {
        organizationId,
        opportunityId: created.id,
        idempotencyKey: `evidence:${ingestionKey}`,
        actorId: userId,
        eventType: "REVIEW_REQUIRED",
        expectedVersion: 1,
        resultingVersion: 2,
        reason: "Intentional event-key collision for transaction rollback proof.",
      },
    });
    const before = await aggregateCounts(created.id);

    await expect(
      appendCompanyOpportunityEvidence(session(), created.id, {
        expectedVersion: 1,
        ingestionKey,
        claimKey: "provider.accepted",
        claimText: "The provider acknowledged this opportunity.",
        claimTruthClass: "ACTUAL",
        evidenceType: "PROVIDER_ACCEPTANCE",
        sourceSystem: "repository-db-test",
        sourceType: "EMAIL_PROVIDER_RECEIPT",
        sourceReference: `email-provider-receipt://${suffix}/atomic-rollback`,
        sourceFingerprintSha256: hashFor("atomic-rollback-evidence"),
        sourceObservedAt: observedAt(),
        verifiedByCurrentActor: true,
      }),
    ).rejects.toBeDefined();

    const persisted = await db.companyExternalOpportunity.findUniqueOrThrow({ where: { id: created.id } });
    expect(persisted).toMatchObject({ version: 1, providerState: "UNPROVEN" });
    expect(await aggregateCounts(created.id)).toEqual(before);
    expect(await db.companyOpportunityEvidence.count({
      where: { organizationId, opportunityId: created.id, ingestionKey },
    })).toBe(0);
    expect((await getCompanyOpportunity(session(), created.id)).providerState).toBe("UNPROVEN");
  });

  it("allows exactly one concurrent compare-and-swap evidence append", async () => {
    const created = await createOpportunity("concurrent-cas");
    const candidateKeys = [`cas-a-${suffix}`, `cas-b-${suffix}`];
    const results = await Promise.allSettled(candidateKeys.map((ingestionKey, index) =>
      appendCompanyOpportunityEvidence(session(), created.id, {
        expectedVersion: 1,
        ingestionKey,
        claimKey: "provider.accepted",
        claimText: `Independent provider acceptance receipt ${index + 1}.`,
        claimTruthClass: "ACTUAL",
        evidenceType: "PROVIDER_ACCEPTANCE",
        sourceSystem: "repository-db-test",
        sourceType: "EMAIL_PROVIDER_RECEIPT",
        sourceReference: `email-provider-receipt://${suffix}/concurrent-cas-${index + 1}`,
        sourceFingerprintSha256: hashFor(`concurrent-cas-${index + 1}`),
        sourceObservedAt: observedAt(),
        verifiedByCurrentActor: true,
      }),
    ));

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ status: 409 });
    expect(await db.companyOpportunityEvidence.count({
      where: {
        organizationId,
        opportunityId: created.id,
        ingestionKey: { in: candidateKeys },
      },
    })).toBe(1);
    expect(await aggregateCounts(created.id)).toEqual({ evidence: 2, events: 2, audits: 2 });
    expect(await getCompanyOpportunity(session(), created.id)).toMatchObject({
      version: 2,
      providerState: "ACCEPTED",
    });
  });

  it("fails closed for real, slug-forged, actor-forged, and demo tenant contexts", async () => {
    const created = await createOpportunity("tenant-isolation");
    const before = await aggregateCounts(created.id);
    const isolatedSessions: ClinicSession[] = [
      session({
        sessionId: `other-session-${suffix}`,
        userId: otherUserId,
        organizationId: otherOrganizationId,
        organizationName: "Unrelated Customer Tenant",
        organizationSlug: otherOrganizationSlug,
        email: `other-${suffix}@example.test`,
      }),
      session({
        sessionId: `forged-slug-session-${suffix}`,
        userId: otherUserId,
        organizationId: otherOrganizationId,
        organizationName: "Unrelated Customer Tenant",
        organizationSlug,
        email: `other-${suffix}@example.test`,
      }),
      session({ sessionId: `forged-actor-session-${suffix}`, userId: otherUserId }),
      session({ sessionId: `demo-session-${suffix}`, demo: true }),
    ];

    for (const isolatedSession of isolatedSessions) {
      await expect(listCompanyOpportunities(isolatedSession)).rejects.toMatchObject({ status: 404 });
      await expect(getCompanyOpportunity(isolatedSession, created.id)).rejects.toMatchObject({ status: 404 });
      await expect(
        createCompanyOpportunity(isolatedSession, createInput(`isolation-${isolatedSession.sessionId}`)),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        appendCompanyOpportunityEvidence(isolatedSession, created.id, {
          expectedVersion: 1,
          ingestionKey: `isolation-${isolatedSession.sessionId}`,
          claimKey: "provider.accepted",
          claimText: "This cross-tenant write must never persist.",
          claimTruthClass: "ACTUAL",
          evidenceType: "PROVIDER_ACCEPTANCE",
          sourceSystem: "repository-db-test",
          sourceType: "AUTHORITATIVE_RECORD",
          sourceReference: `authoritative-record://${suffix}/isolation/${isolatedSession.sessionId}`,
          sourceFingerprintSha256: hashFor(`isolation:${isolatedSession.sessionId}`),
          sourceObservedAt: observedAt(),
          verifiedByCurrentActor: true,
        }),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        transitionCompanyOpportunity(isolatedSession, created.id, {
          expectedVersion: 1,
          targetStage: "FIT_REVIEW",
          idempotencyKey: `isolation-transition-${isolatedSession.sessionId}`,
          reason: "This cross-tenant transition must never persist.",
        }),
      ).rejects.toMatchObject({ status: 404 });
    }

    expect(await aggregateCounts(created.id)).toEqual(before);
    expect(await db.companyExternalOpportunity.count({ where: { organizationId: otherOrganizationId } })).toBe(0);
    expect(await getCompanyOpportunity(session(), created.id)).toMatchObject({
      version: 1,
      lifecycleStage: "DISCOVERED",
    });
  });

  it("enforces reciprocal contract, cash, and correction SQL constraints with valid controls", async () => {
    const created = await createOpportunity("sql-constraints");
    const verificationAt = new Date();

    await expectConstraintViolation(created.id, "unrelated-contract-fields", {
      agreementReference: "agreement-unrelated",
      counterparty: "Unrelated Counterparty",
      agreementEffectiveAt: observedAt(),
      signatureEvidenceReference: "signature-unrelated",
    });
    await expectConstraintViolation(created.id, "incomplete-executed-contract", {
      evidenceType: "EXECUTED_AGREEMENT",
      truthClass: "CONTRACTED",
      sourceType: "EXECUTED_DOCUMENT",
      sourceReference: `executed-document-sha256://${hashFor("incomplete-contract-document")}`,
      agreementReference: "agreement-incomplete",
      counterparty: "Contract Counterparty",
      agreementEffectiveAt: observedAt(),
      verifiedAt: verificationAt,
      verifiedByActorId: userId,
      approvalState: "APPROVED",
      approvedAt: verificationAt,
      approvedByActorId: userId,
    });
    await expectConstraintViolation(created.id, "unrelated-cash-fields", {
      amountCents: 12_500,
      currency: "USD",
      payeeEntityReference: "payee-unrelated",
      externalTransactionReference: "transaction-unrelated",
      reconciliationState: "SETTLED",
    });
    await expectConstraintViolation(created.id, "settlement-with-reversed-state", {
      evidenceType: "PAYMENT_SETTLEMENT",
      sourceType: "PAYMENT_PROCESSOR",
      sourceReference: `payment-processor://${suffix}/settlement-reversed`,
      amountCents: 12_500,
      currency: "USD",
      payeeEntityReference: "payee-settlement",
      externalTransactionReference: "transaction-settlement",
      reconciliationState: "REVERSED",
      verifiedAt: verificationAt,
      verifiedByActorId: userId,
      approvalState: "APPROVED",
      approvedAt: verificationAt,
      approvedByActorId: userId,
    });
    await expectConstraintViolation(created.id, "reversal-with-settled-state", {
      evidenceType: "PAYMENT_REVERSAL",
      sourceType: "PAYMENT_PROCESSOR",
      sourceReference: `payment-processor://${suffix}/reversal-settled`,
      amountCents: 12_500,
      currency: "USD",
      payeeEntityReference: "payee-reversal",
      externalTransactionReference: "transaction-reversal",
      reconciliationState: "SETTLED",
      verifiedAt: verificationAt,
      verifiedByActorId: userId,
      approvalState: "APPROVED",
      approvedAt: verificationAt,
      approvedByActorId: userId,
    });

    const correctionTarget = await db.companyOpportunityEvidence.create({
      data: directEvidence(created.id, "correction-target"),
      select: { id: true },
    });
    await expectConstraintViolation(created.id, "non-correction-supersession", {
      supersedesEvidenceId: correctionTarget.id,
      correctionReason: "An ordinary source record may not supersede evidence.",
    });
    await expectConstraintViolation(created.id, "correction-without-target", {
      evidenceType: "EVIDENCE_CORRECTION",
      correctionReason: "A correction must name its prior record.",
      verifiedAt: verificationAt,
      verifiedByActorId: userId,
      approvalState: "APPROVED",
      approvedAt: verificationAt,
      approvedByActorId: userId,
    });
    await expectConstraintViolation(created.id, "correction-without-reason", {
      evidenceType: "EVIDENCE_CORRECTION",
      supersedesEvidenceId: correctionTarget.id,
      verifiedAt: verificationAt,
      verifiedByActorId: userId,
      approvalState: "APPROVED",
      approvedAt: verificationAt,
      approvedByActorId: userId,
    });
    const selfSupersessionId = `self-supersession-${suffix}`;
    await expectConstraintViolation(created.id, "self-supersession", {
      id: selfSupersessionId,
      evidenceType: "EVIDENCE_CORRECTION",
      supersedesEvidenceId: selfSupersessionId,
      correctionReason: "A correction cannot supersede itself.",
      verifiedAt: verificationAt,
      verifiedByActorId: userId,
      approvalState: "APPROVED",
      approvedAt: verificationAt,
      approvedByActorId: userId,
    });

    const executedAgreement = await db.companyOpportunityEvidence.create({
      data: directEvidence(created.id, "valid-executed-contract", {
        evidenceType: "EXECUTED_AGREEMENT",
        truthClass: "CONTRACTED",
        sourceType: "EXECUTED_DOCUMENT",
        sourceReference: `executed-document-sha256://${hashFor("valid-contract-document")}`,
        agreementReference: "agreement-valid",
        counterparty: "Contract Counterparty",
        agreementEffectiveAt: observedAt(),
        signatureEvidenceReference: "signature-valid",
        verifiedAt: verificationAt,
        verifiedByActorId: userId,
        approvalState: "APPROVED",
        approvedAt: verificationAt,
        approvedByActorId: userId,
      }),
      select: { id: true, evidenceType: true },
    });
    const settlement = await db.companyOpportunityEvidence.create({
      data: directEvidence(created.id, "valid-settlement", {
        evidenceType: "PAYMENT_SETTLEMENT",
        sourceType: "PAYMENT_PROCESSOR",
        sourceReference: `payment-processor://${suffix}/valid-settlement`,
        amountCents: 12_500,
        currency: "USD",
        payeeEntityReference: "payee-valid",
        externalTransactionReference: "transaction-valid-settlement",
        reconciliationState: "SETTLED",
        verifiedAt: verificationAt,
        verifiedByActorId: userId,
        approvalState: "APPROVED",
        approvedAt: verificationAt,
        approvedByActorId: userId,
      }),
      select: { id: true, evidenceType: true, reconciliationState: true },
    });
    const reversal = await db.companyOpportunityEvidence.create({
      data: directEvidence(created.id, "valid-reversal", {
        evidenceType: "PAYMENT_REVERSAL",
        sourceType: "PAYMENT_PROCESSOR",
        sourceReference: `payment-processor://${suffix}/valid-reversal`,
        amountCents: 12_500,
        currency: "USD",
        payeeEntityReference: "payee-valid",
        externalTransactionReference: "transaction-valid-reversal",
        reconciliationState: "REVERSED",
        verifiedAt: verificationAt,
        verifiedByActorId: userId,
        approvalState: "APPROVED",
        approvedAt: verificationAt,
        approvedByActorId: userId,
      }),
      select: { id: true, evidenceType: true, reconciliationState: true },
    });
    const correction = await db.companyOpportunityEvidence.create({
      data: directEvidence(created.id, "valid-correction", {
        claimKey: "constraint.correction-target",
        evidenceType: "EVIDENCE_CORRECTION",
        supersedesEvidenceId: correctionTarget.id,
        correctionReason: "The prior observation was replaced by verified corrected evidence.",
        verifiedAt: verificationAt,
        verifiedByActorId: userId,
        approvalState: "APPROVED",
        approvedAt: verificationAt,
        approvedByActorId: userId,
      }),
      select: { id: true, evidenceType: true, supersedesEvidenceId: true },
    });

    expect(executedAgreement.evidenceType).toBe("EXECUTED_AGREEMENT");
    expect(settlement).toMatchObject({ evidenceType: "PAYMENT_SETTLEMENT", reconciliationState: "SETTLED" });
    expect(reversal).toMatchObject({ evidenceType: "PAYMENT_REVERSAL", reconciliationState: "REVERSED" });
    expect(correction).toMatchObject({
      evidenceType: "EVIDENCE_CORRECTION",
      supersedesEvidenceId: correctionTarget.id,
    });
    expect(await db.companyOpportunityEvidence.count({
      where: {
        organizationId,
        opportunityId: created.id,
        id: { in: [executedAgreement.id, settlement.id, reversal.id, correction.id] },
      },
    })).toBe(4);
  });
});
