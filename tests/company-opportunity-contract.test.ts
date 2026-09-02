import { describe, expect, it } from "vitest";
import {
  applyCompanyOpportunityEvidenceToTruthRails,
  companyOpportunityEvidenceTypes,
  companyOpportunityLifecycleStages,
  companyOpportunitySourceReferenceSchemes,
  emptyCompanyOpportunityTruthRails,
  evaluateCompanyOpportunityEvidence,
  evaluateCompanyOpportunityTransition,
  deriveCompanyOpportunityTruthRails,
  type CompanyOpportunityEvidenceQualification,
} from "@/lib/company/company-opportunity-contract";
import { companyTruthClasses } from "@/lib/company-execution-control-plane";
import { isCompanyOpportunityAccessAllowed } from "@/lib/company/company-opportunity-access";
import { symphonyTruthClasses } from "@/lib/company/symphony-opportunity-types";
import { can } from "@/lib/auth/rbac";

const now = new Date("2026-09-02T12:00:00.000Z");
const fingerprint = "a".repeat(64);

function evidence(
  overrides: Partial<CompanyOpportunityEvidenceQualification> = {},
): CompanyOpportunityEvidenceQualification {
  const sourceType = overrides.sourceType ?? "OUTLOOK_SUMMARY";
  return {
    evidenceType: "OBSERVED_SOURCE",
    claimTruthClass: "ACTUAL",
    sourceType,
    sourceReference: `${companyOpportunitySourceReferenceSchemes[sourceType]}audit/2026-09-01#thread-1`,
    sourceFingerprintSha256: fingerprint,
    sourceObservedAt: new Date("2026-09-01T12:00:00.000Z"),
    verifiedAt: new Date("2026-09-01T13:00:00.000Z"),
    verifiedByActorId: "founder-1",
    approvalState: "APPROVED",
    approvedAt: new Date("2026-09-01T14:00:00.000Z"),
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("company opportunity truth contract", () => {
  it("uses the one canonical six-class company truth taxonomy", () => {
    expect(companyTruthClasses).toBe(symphonyTruthClasses);
    expect(companyTruthClasses).toEqual([
      "ACTUAL",
      "CONTRACTED",
      "PIPELINE",
      "ASSUMPTION",
      "SCENARIO",
      "TARGET",
    ]);
  });

  it("restricts Company OS opportunity truth to the platform organization and owner-only permission", () => {
    expect(can("clinic_owner", "company", "manage")).toBe(true);
    expect(can("administrator", "company", "read")).toBe(false);
    expect(can("provider", "company", "read")).toBe(false);
    expect(can("front_desk", "company", "read")).toBe(false);

    expect(
      isCompanyOpportunityAccessAllowed({
        role: "clinic_owner",
        action: "manage",
        organizationSlug: "clinicos-by-zumi",
        platformOrganizationSlug: "clinicos-by-zumi",
      }),
    ).toBe(true);
    expect(
      isCompanyOpportunityAccessAllowed({
        role: "clinic_owner",
        action: "manage",
        organizationSlug: "customer-clinic",
        platformOrganizationSlug: "clinicos-by-zumi",
      }),
    ).toBe(false);
  });

  it("uses a procurement lifecycle rather than communication, contract, or cash as workflow", () => {
    expect(companyOpportunityLifecycleStages).toEqual([
      "DISCOVERED",
      "FIT_REVIEW",
      "QUALIFIED",
      "CONTACT_PREPARATION",
      "CONTACT_IN_PROGRESS",
      "AWAITING_RESPONSE",
      "RESPONSE_RECEIVED",
      "APPLICATION_PREPARATION",
      "APPLICATION_SUBMITTED",
      "DILIGENCE",
      "DECISION_PENDING",
      "AWARDED",
      "CONTRACTING",
      "IMPLEMENTATION",
      "NOT_A_FIT",
      "DECLINED",
      "CLOSED",
    ]);
    expect(companyOpportunityLifecycleStages).not.toContain("PROVIDER_ACCEPTED");
    expect(companyOpportunityLifecycleStages).not.toContain("DELIVERY_CONFIRMED");
    expect(companyOpportunityLifecycleStages).not.toContain("AWARDED_OR_CONTRACTED");
    expect(companyOpportunityLifecycleStages).not.toContain("CASH_RECEIVED");
  });

  it("keeps qualification and every consequential truth rail independent and non-boolean", () => {
    expect(emptyCompanyOpportunityTruthRails).toEqual({
      qualification: "UNQUALIFIED",
      provider: "UNPROVEN",
      delivery: "UNPROVEN",
      response: "UNPROVEN",
      submission: "NOT_STARTED",
      award: "UNPROVEN",
      contract: "UNPROVEN",
      cash: "UNPROVEN",
    });

    const providerAccepted = applyCompanyOpportunityEvidenceToTruthRails(
      emptyCompanyOpportunityTruthRails,
      evidence({
        evidenceType: "PROVIDER_ACCEPTANCE",
        sourceType: "EMAIL_PROVIDER_RECEIPT",
      }),
      now,
    );

    expect(providerAccepted).toEqual({
      ...emptyCompanyOpportunityTruthRails,
      provider: "ACCEPTED",
    });
  });

  it("does not let an observed email summary manufacture qualified pipeline", () => {
    const result = evaluateCompanyOpportunityTransition({
      currentStage: "FIT_REVIEW",
      targetStage: "QUALIFIED",
      expectedVersion: 3,
      actualVersion: 3,
      evidence: [evidence()],
      now,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/observed|qualification|pipeline/i);
  });

  it("requires source-authoritative, verified, current evidence instead of trusting labels", () => {
    const mislabeledCash = evidence({
      evidenceType: "PAYMENT_SETTLEMENT",
      sourceType: "INTERNAL_OBSERVATION",
      cash: {
        amountCents: 50000,
        currency: "USD",
        payeeEntityReference: "klinikos-inc",
        externalTransactionReference: "txn-1",
        reconciliationState: "SETTLED",
      },
    });
    expect(evaluateCompanyOpportunityEvidence(mislabeledCash, now)).toMatchObject({
      qualifies: false,
    });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "QUALIFIED_PIPELINE",
          claimTruthClass: "PIPELINE",
          sourceType: "OUTLOOK_MESSAGE",
          verifiedAt: null,
          verifiedByActorId: null,
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "QUALIFIED_PIPELINE",
          claimTruthClass: "PIPELINE",
          sourceType: "OUTLOOK_MESSAGE",
          approvalState: "REJECTED",
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "QUALIFIED_PIPELINE",
          claimTruthClass: "PIPELINE",
          sourceType: "OUTLOOK_MESSAGE",
          sourceObservedAt: new Date("2026-09-02T12:01:00.000Z"),
          verifiedAt: new Date("2026-09-02T12:02:00.000Z"),
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "QUALIFIED_PIPELINE",
          claimTruthClass: "PIPELINE",
          sourceType: "OUTLOOK_MESSAGE",
          verifiedAt: new Date("2026-09-02T12:01:00.000Z"),
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "QUALIFIED_PIPELINE",
          claimTruthClass: "PIPELINE",
          sourceType: "OUTLOOK_MESSAGE",
          expiresAt: new Date("2026-09-02T11:59:59.000Z"),
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "QUALIFIED_PIPELINE",
          claimTruthClass: "PIPELINE",
          sourceType: "OUTLOOK_MESSAGE",
          revokedAt: new Date("2026-09-02T11:00:00.000Z"),
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });
  });

  it("blocks illegal jumps, backwards transitions, and stale compare-and-swap versions", () => {
    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "DISCOVERED",
        targetStage: "APPLICATION_SUBMITTED",
        expectedVersion: 1,
        actualVersion: 1,
        evidence: [],
        now,
      }),
    ).toMatchObject({ allowed: false });

    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "DILIGENCE",
        targetStage: "DISCOVERED",
        expectedVersion: 4,
        actualVersion: 4,
        evidence: [],
        now,
      }),
    ).toMatchObject({ allowed: false });

    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "FIT_REVIEW",
        targetStage: "QUALIFIED",
        expectedVersion: 2,
        actualVersion: 3,
        evidence: [],
        now,
      }),
    ).toMatchObject({ allowed: false, reason: expect.stringMatching(/version|changed/i) });
  });

  it("requires distinct evidence for qualification, submission, award, contract, and cash", () => {
    const qualification = evidence({
      evidenceType: "QUALIFIED_PIPELINE",
      claimTruthClass: "PIPELINE",
      sourceType: "OUTLOOK_MESSAGE",
    });
    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "FIT_REVIEW",
        targetStage: "QUALIFIED",
        expectedVersion: 1,
        actualVersion: 1,
        evidence: [qualification],
        now,
      }).allowed,
    ).toBe(true);

    const submission = evidence({
      evidenceType: "SUBMISSION_RECEIPT",
      sourceType: "PORTAL_RECEIPT",
    });
    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "APPLICATION_PREPARATION",
        targetStage: "APPLICATION_SUBMITTED",
        expectedVersion: 5,
        actualVersion: 5,
        evidence: [submission],
        now,
      }).allowed,
    ).toBe(true);

    const award = evidence({
      evidenceType: "AWARD_NOTICE",
      sourceType: "OFFICIAL_NOTICE",
    });
    const afterAward = applyCompanyOpportunityEvidenceToTruthRails(
      emptyCompanyOpportunityTruthRails,
      award,
      now,
    );
    expect(afterAward.award).toBe("AWARDED");
    expect(afterAward.contract).toBe("UNPROVEN");
    expect(afterAward.cash).toBe("UNPROVEN");

    const agreement = evidence({
      evidenceType: "EXECUTED_AGREEMENT",
      claimTruthClass: "CONTRACTED",
      sourceType: "EXECUTED_DOCUMENT",
      contract: {
        agreementReference: "agreement-1",
        counterparty: "Example Agency",
        effectiveAt: new Date("2026-09-02T12:00:00.000Z"),
        signatureEvidenceReference: "signature-1",
      },
    });
    const afterContract = applyCompanyOpportunityEvidenceToTruthRails(afterAward, agreement, now);
    expect(afterContract.award).toBe("AWARDED");
    expect(afterContract.contract).toBe("EXECUTED");
    expect(afterContract.cash).toBe("UNPROVEN");

    const cash = evidence({
      evidenceType: "PAYMENT_SETTLEMENT",
      sourceType: "PAYMENT_PROCESSOR",
      cash: {
        amountCents: 50000,
        currency: "USD",
        payeeEntityReference: "klinikos-inc",
        externalTransactionReference: "txn-1",
        reconciliationState: "SETTLED",
      },
    });
    const afterCash = applyCompanyOpportunityEvidenceToTruthRails(afterContract, cash, now);
    expect(afterCash.contract).toBe("EXECUTED");
    expect(afterCash.cash).toBe("RECEIVED");
  });

  it("lets the latest active negative evidence defeat an older positive claim", () => {
    const award = evidence({
      evidenceType: "AWARD_NOTICE",
      sourceType: "OFFICIAL_NOTICE",
    });
    const decline = evidence({
      evidenceType: "DECLINE_NOTICE",
      sourceType: "OFFICIAL_NOTICE",
      sourceFingerprintSha256: "b".repeat(64),
    });
    expect(deriveCompanyOpportunityTruthRails([award, decline], now).award).toBe("DECLINED");
    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "DECISION_PENDING",
        targetStage: "AWARDED",
        expectedVersion: 7,
        actualVersion: 7,
        evidence: [award, decline],
        now,
      }),
    ).toMatchObject({ allowed: false });

    const executed = evidence({
      evidenceType: "EXECUTED_AGREEMENT",
      claimTruthClass: "CONTRACTED",
      sourceType: "EXECUTED_DOCUMENT",
      contract: {
        agreementReference: "agreement-1",
        counterparty: "Example Agency",
        effectiveAt: new Date("2026-09-01T00:00:00.000Z"),
        signatureEvidenceReference: "signature-sha256://agreement-1",
      },
    });
    const terminated = evidence({
      evidenceType: "CONTRACT_TERMINATION",
      sourceType: "OFFICIAL_NOTICE",
      sourceFingerprintSha256: "c".repeat(64),
      contract: {
        agreementReference: "agreement-1",
        counterparty: "Example Agency",
        effectiveAt: new Date("2026-09-02T00:00:00.000Z"),
        signatureEvidenceReference: "official-notice://termination-1",
      },
    });
    expect(deriveCompanyOpportunityTruthRails([executed, terminated], now).contract).toBe("TERMINATED");
    expect(
      evaluateCompanyOpportunityTransition({
        currentStage: "CONTRACTING",
        targetStage: "IMPLEMENTATION",
        expectedVersion: 9,
        actualVersion: 9,
        evidence: [executed, terminated],
        now,
      }),
    ).toMatchObject({ allowed: false });
  });

  it("keeps never-qualified expired or revoked evidence neutral", () => {
    const unverifiedExpiredQualification = evidence({
      evidenceType: "QUALIFIED_PIPELINE",
      claimTruthClass: "PIPELINE",
      sourceType: "AUTHORITATIVE_RECORD",
      sourceReference: "authoritative-record://qualification-unverified",
      verifiedAt: null,
      verifiedByActorId: null,
      approvalState: "NEEDS_REVIEW",
      approvedAt: null,
      expiresAt: new Date("2026-09-02T11:00:00.000Z"),
    });
    const rejectedRevokedProvider = evidence({
      evidenceType: "PROVIDER_ACCEPTANCE",
      sourceType: "EMAIL_PROVIDER_RECEIPT",
      sourceReference: "email-provider-receipt://provider-rejected",
      approvalState: "REJECTED",
      revokedAt: new Date("2026-09-02T11:00:00.000Z"),
    });
    const wrongSourceExpiredCash = evidence({
      evidenceType: "PAYMENT_SETTLEMENT",
      sourceType: "OUTLOOK_SUMMARY",
      sourceReference: "outlook-summary://payment-wrong-source",
      expiresAt: new Date("2026-09-02T11:00:00.000Z"),
      cash: {
        amountCents: 50000,
        currency: "USD",
        payeeEntityReference: "klinikos-inc",
        externalTransactionReference: "txn-wrong-source",
        reconciliationState: "SETTLED",
      },
    });
    const wrongTruthExpiredAward = evidence({
      evidenceType: "AWARD_NOTICE",
      claimTruthClass: "PIPELINE",
      sourceType: "OFFICIAL_NOTICE",
      sourceReference: "official-notice://award-wrong-truth",
      expiresAt: new Date("2026-09-02T11:00:00.000Z"),
    });
    const malformedExpiredEvidence = {
      ...evidence({ expiresAt: new Date("2026-09-02T11:00:00.000Z") }),
      evidenceType: "NOT_A_REAL_EVIDENCE_TYPE",
    } as unknown as CompanyOpportunityEvidenceQualification;

    expect(deriveCompanyOpportunityTruthRails([
      unverifiedExpiredQualification,
      rejectedRevokedProvider,
      wrongSourceExpiredCash,
      wrongTruthExpiredAward,
      malformedExpiredEvidence,
    ], now)).toEqual(emptyCompanyOpportunityTruthRails);
  });

  it("requires timestamp proof that REVOKED evidence was approved before revocation", () => {
    const revokedWithoutApprovalTime = evidence({
      evidenceType: "PROVIDER_ACCEPTANCE",
      sourceType: "EMAIL_PROVIDER_RECEIPT",
      sourceReference: "email-provider-receipt://provider-revoked-without-prior-approval",
      approvalState: "REVOKED",
      approvedAt: null,
      revokedAt: new Date("2026-09-02T11:00:00.000Z"),
    });
    const revokedAfterPriorApproval = {
      ...evidence({
        evidenceType: "PROVIDER_ACCEPTANCE",
        sourceType: "EMAIL_PROVIDER_RECEIPT",
        sourceReference: "email-provider-receipt://provider-valid-revocation",
        approvalState: "REVOKED",
        revokedAt: new Date("2026-09-02T11:00:00.000Z"),
      }),
      approvedAt: new Date("2026-09-02T10:00:00.000Z"),
    } as CompanyOpportunityEvidenceQualification;
    const approvedOnlyAfterRevocation = {
      ...revokedAfterPriorApproval,
      sourceReference: "email-provider-receipt://provider-invalid-revocation-order",
      approvedAt: new Date("2026-09-02T11:30:00.000Z"),
    } as CompanyOpportunityEvidenceQualification;

    expect(deriveCompanyOpportunityTruthRails([revokedWithoutApprovalTime], now))
      .toEqual(emptyCompanyOpportunityTruthRails);
    expect(deriveCompanyOpportunityTruthRails([revokedAfterPriorApproval], now).provider)
      .toBe("REVOKED");
    expect(deriveCompanyOpportunityTruthRails([approvedOnlyAfterRevocation], now))
      .toEqual(emptyCompanyOpportunityTruthRails);
  });

  it("rejects unrelated contract or cash payloads even on otherwise valid evidence", () => {
    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          cash: {
            amountCents: 50000,
            currency: "USD",
            payeeEntityReference: "klinikos-inc",
            externalTransactionReference: "txn-1",
            reconciliationState: "SETTLED",
          },
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });
  });

  it("requires complete contract and cash evidence and supports negative/correction states", () => {
    expect(companyOpportunityEvidenceTypes).toEqual(
      expect.arrayContaining([
        "DELIVERY_FAILURE",
        "DECLINE_NOTICE",
        "CONTRACT_TERMINATION",
        "PAYMENT_REVERSAL",
        "EVIDENCE_CORRECTION",
      ]),
    );

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "EXECUTED_AGREEMENT",
          claimTruthClass: "CONTRACTED",
          sourceType: "EXECUTED_DOCUMENT",
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      evaluateCompanyOpportunityEvidence(
        evidence({
          evidenceType: "PAYMENT_SETTLEMENT",
          sourceType: "PAYMENT_PROCESSOR",
        }),
        now,
      ),
    ).toMatchObject({ qualifies: false });

    expect(
      deriveCompanyOpportunityTruthRails([
        evidence({
          evidenceType: "PROVIDER_ACCEPTANCE",
          sourceType: "EMAIL_PROVIDER_RECEIPT",
          expiresAt: new Date("2026-10-01T00:00:00.000Z"),
          revokedAt: new Date("2026-09-02T11:00:00.000Z"),
        }),
      ], now).provider,
    ).toBe("REVOKED");
  });
});
