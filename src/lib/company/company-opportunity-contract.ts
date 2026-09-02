import { z } from "zod";
import { companyTruthClassSchema, type CompanyTruthClass } from "@/lib/company/company-truth";

export const companyOpportunityLifecycleStages = [
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
] as const;

export const companyOpportunityEvidenceTypes = [
  "OBSERVED_SOURCE",
  "QUALIFIED_PIPELINE",
  "PROVIDER_ACCEPTANCE",
  "PROVIDER_REJECTION",
  "DELIVERY_RECEIPT",
  "DELIVERY_FAILURE",
  "RESPONSE_RECEIPT",
  "SUBMISSION_RECEIPT",
  "SUBMISSION_REJECTION",
  "AWARD_NOTICE",
  "DECLINE_NOTICE",
  "EXECUTED_AGREEMENT",
  "CONTRACT_TERMINATION",
  "PAYMENT_SETTLEMENT",
  "PAYMENT_REVERSAL",
  "EVIDENCE_CORRECTION",
  "OTHER_REVIEW_REQUIRED",
] as const;

export const companyOpportunitySourceTypes = [
  "OUTLOOK_SUMMARY",
  "OUTLOOK_MESSAGE",
  "ATTACHMENT",
  "AUTHORITATIVE_RECORD",
  "EXECUTED_DOCUMENT",
  "PORTAL_RECEIPT",
  "EMAIL_PROVIDER_RECEIPT",
  "PAYMENT_PROCESSOR",
  "BANK_RECORD",
  "ACCOUNTING_RECORD",
  "OFFICIAL_NOTICE",
  "INTERNAL_OBSERVATION",
  "OTHER_REVIEW_REQUIRED",
] as const;

export const companyOpportunityQualificationStates = [
  "UNQUALIFIED",
  "QUALIFIED",
  "STALE",
  "DISQUALIFIED",
] as const;
export const companyOpportunityProviderStates = [
  "UNPROVEN",
  "ACCEPTED",
  "REJECTED",
  "REVOKED",
  "RECONCILIATION_REQUIRED",
] as const;
export const companyOpportunityDeliveryStates = [
  "UNPROVEN",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
  "DISPUTED",
  "RECONCILIATION_REQUIRED",
] as const;
export const companyOpportunityResponseStates = [
  "UNPROVEN",
  "RECEIVED",
  "NO_RESPONSE",
  "DISPUTED",
] as const;
export const companyOpportunitySubmissionStates = [
  "NOT_STARTED",
  "PREPARING",
  "SUBMITTED",
  "REJECTED",
  "WITHDRAWN",
  "DISPUTED",
] as const;
export const companyOpportunityAwardStates = [
  "UNPROVEN",
  "AWARDED",
  "DECLINED",
  "WITHDRAWN",
  "DISPUTED",
] as const;
export const companyOpportunityContractStates = [
  "UNPROVEN",
  "PROPOSED",
  "EXECUTED",
  "EXPIRED",
  "TERMINATED",
  "DISPUTED",
] as const;
export const companyOpportunityCashStates = [
  "UNPROVEN",
  "PENDING",
  "RECEIVED",
  "REVERSED",
  "DISPUTED",
  "RECONCILIATION_REQUIRED",
] as const;
export const companyOpportunityEvidenceApprovalStates = [
  "NEEDS_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVOKED",
] as const;

export const companyOpportunityLifecycleStageSchema = z.enum(companyOpportunityLifecycleStages);
export const companyOpportunityEvidenceTypeSchema = z.enum(companyOpportunityEvidenceTypes);
export const companyOpportunitySourceTypeSchema = z.enum(companyOpportunitySourceTypes);

export type CompanyOpportunityLifecycleStage = z.infer<typeof companyOpportunityLifecycleStageSchema>;
export type CompanyOpportunityEvidenceType = z.infer<typeof companyOpportunityEvidenceTypeSchema>;
export type CompanyOpportunitySourceType = z.infer<typeof companyOpportunitySourceTypeSchema>;

export const companyOpportunitySourceReferenceSchemes: Readonly<
  Record<CompanyOpportunitySourceType, string>
> = Object.freeze({
  OUTLOOK_SUMMARY: "outlook-summary://",
  OUTLOOK_MESSAGE: "outlook-message://",
  ATTACHMENT: "attachment-sha256://",
  AUTHORITATIVE_RECORD: "authoritative-record://",
  EXECUTED_DOCUMENT: "executed-document-sha256://",
  PORTAL_RECEIPT: "portal-receipt://",
  EMAIL_PROVIDER_RECEIPT: "email-provider-receipt://",
  PAYMENT_PROCESSOR: "payment-processor://",
  BANK_RECORD: "bank-record://",
  ACCOUNTING_RECORD: "accounting-record://",
  OFFICIAL_NOTICE: "official-notice://",
  INTERNAL_OBSERVATION: "internal-observation://",
  OTHER_REVIEW_REQUIRED: "review-required://",
});

export const companyOpportunityUnsafeSourceReferencePattern =
  /(?:api[_-]?key|secret|authorization|bearer|password)\s*[:=]/i;

export const companyOpportunitySourceReferenceSchema = z.string().trim().min(1).max(2048)
  .refine(
    (value) => !/[\r\n]/.test(value),
    "Source references must be concise single-line identifiers.",
  )
  .regex(/^[a-z][a-z0-9-]*:\/\/[A-Za-z0-9._~:/#=-]+$/)
  .refine(
    (value) =>
      !/[?&@%]/.test(value) &&
      !companyOpportunityUnsafeSourceReferencePattern.test(value),
    "Source references must be inert opaque identifiers without URLs, credentials, or query data.",
  );

const contractEvidenceSchema = z.object({
  agreementReference: z.string().trim().min(1).max(300),
  counterparty: z.string().trim().min(1).max(300),
  effectiveAt: z.date(),
  signatureEvidenceReference: z.string().trim().min(1).max(500),
}).strict();

const cashEvidenceSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  payeeEntityReference: z.string().trim().min(1).max(300),
  externalTransactionReference: z.string().trim().min(1).max(500),
  reconciliationState: z.enum(["SETTLED", "REVERSED"]),
}).strict();

export const companyOpportunityEvidenceQualificationSchema = z.object({
  evidenceType: companyOpportunityEvidenceTypeSchema,
  claimTruthClass: companyTruthClassSchema,
  sourceType: companyOpportunitySourceTypeSchema,
  sourceReference: companyOpportunitySourceReferenceSchema,
  sourceFingerprintSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sourceObservedAt: z.date(),
  verifiedAt: z.date().nullable(),
  verifiedByActorId: z.string().trim().min(1).max(200).nullable(),
  approvalState: z.enum(companyOpportunityEvidenceApprovalStates),
  approvedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  revokedAt: z.date().nullable(),
  contract: contractEvidenceSchema.optional(),
  cash: cashEvidenceSchema.optional(),
}).strict().superRefine((input, context) => {
  if (!input.sourceReference.startsWith(companyOpportunitySourceReferenceSchemes[input.sourceType])) {
    context.addIssue({
      code: "custom",
      path: ["sourceReference"],
      message: "The opaque source-reference scheme must match the declared source type.",
    });
  }
});

export type CompanyOpportunityEvidenceQualification = z.infer<
  typeof companyOpportunityEvidenceQualificationSchema
>;

export type CompanyOpportunityTruthRails = {
  qualification: (typeof companyOpportunityQualificationStates)[number];
  provider: (typeof companyOpportunityProviderStates)[number];
  delivery: (typeof companyOpportunityDeliveryStates)[number];
  response: (typeof companyOpportunityResponseStates)[number];
  submission: (typeof companyOpportunitySubmissionStates)[number];
  award: (typeof companyOpportunityAwardStates)[number];
  contract: (typeof companyOpportunityContractStates)[number];
  cash: (typeof companyOpportunityCashStates)[number];
};

export const emptyCompanyOpportunityTruthRails: Readonly<CompanyOpportunityTruthRails> = Object.freeze({
  qualification: "UNQUALIFIED",
  provider: "UNPROVEN",
  delivery: "UNPROVEN",
  response: "UNPROVEN",
  submission: "NOT_STARTED",
  award: "UNPROVEN",
  contract: "UNPROVEN",
  cash: "UNPROVEN",
});

type EvidenceRule = {
  truthClass: CompanyTruthClass;
  sourceTypes: readonly CompanyOpportunitySourceType[];
  verified: boolean;
  contract?: "SETTLED";
  cash?: "SETTLED" | "REVERSED";
};

const evidenceRules: Record<CompanyOpportunityEvidenceType, EvidenceRule> = {
  OBSERVED_SOURCE: {
    truthClass: "ACTUAL",
    sourceTypes: companyOpportunitySourceTypes,
    verified: false,
  },
  QUALIFIED_PIPELINE: {
    truthClass: "PIPELINE",
    sourceTypes: ["OUTLOOK_MESSAGE", "PORTAL_RECEIPT", "AUTHORITATIVE_RECORD", "OFFICIAL_NOTICE"],
    verified: true,
  },
  PROVIDER_ACCEPTANCE: {
    truthClass: "ACTUAL",
    sourceTypes: ["EMAIL_PROVIDER_RECEIPT", "PORTAL_RECEIPT", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  PROVIDER_REJECTION: {
    truthClass: "ACTUAL",
    sourceTypes: ["EMAIL_PROVIDER_RECEIPT", "PORTAL_RECEIPT", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  DELIVERY_RECEIPT: {
    truthClass: "ACTUAL",
    sourceTypes: ["EMAIL_PROVIDER_RECEIPT", "PORTAL_RECEIPT", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  DELIVERY_FAILURE: {
    truthClass: "ACTUAL",
    sourceTypes: ["EMAIL_PROVIDER_RECEIPT", "PORTAL_RECEIPT", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  RESPONSE_RECEIPT: {
    truthClass: "ACTUAL",
    sourceTypes: ["OUTLOOK_MESSAGE", "PORTAL_RECEIPT", "OFFICIAL_NOTICE", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  SUBMISSION_RECEIPT: {
    truthClass: "ACTUAL",
    sourceTypes: ["PORTAL_RECEIPT", "OFFICIAL_NOTICE", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  SUBMISSION_REJECTION: {
    truthClass: "ACTUAL",
    sourceTypes: ["PORTAL_RECEIPT", "OFFICIAL_NOTICE", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  AWARD_NOTICE: {
    truthClass: "ACTUAL",
    sourceTypes: ["OFFICIAL_NOTICE", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  DECLINE_NOTICE: {
    truthClass: "ACTUAL",
    sourceTypes: ["OUTLOOK_MESSAGE", "PORTAL_RECEIPT", "OFFICIAL_NOTICE", "AUTHORITATIVE_RECORD"],
    verified: true,
  },
  EXECUTED_AGREEMENT: {
    truthClass: "CONTRACTED",
    sourceTypes: ["EXECUTED_DOCUMENT", "AUTHORITATIVE_RECORD"],
    verified: true,
    contract: "SETTLED",
  },
  CONTRACT_TERMINATION: {
    truthClass: "ACTUAL",
    sourceTypes: ["EXECUTED_DOCUMENT", "OFFICIAL_NOTICE", "AUTHORITATIVE_RECORD"],
    verified: true,
    contract: "SETTLED",
  },
  PAYMENT_SETTLEMENT: {
    truthClass: "ACTUAL",
    sourceTypes: ["PAYMENT_PROCESSOR", "BANK_RECORD", "ACCOUNTING_RECORD"],
    verified: true,
    cash: "SETTLED",
  },
  PAYMENT_REVERSAL: {
    truthClass: "ACTUAL",
    sourceTypes: ["PAYMENT_PROCESSOR", "BANK_RECORD", "ACCOUNTING_RECORD"],
    verified: true,
    cash: "REVERSED",
  },
  EVIDENCE_CORRECTION: {
    truthClass: "ACTUAL",
    sourceTypes: ["AUTHORITATIVE_RECORD", "INTERNAL_OBSERVATION"],
    verified: true,
  },
  OTHER_REVIEW_REQUIRED: {
    truthClass: "ASSUMPTION",
    sourceTypes: companyOpportunitySourceTypes,
    verified: false,
  },
};

export type CompanyOpportunityEvidenceEvaluation = {
  qualifies: boolean;
  reason: string;
};

export function evaluateCompanyOpportunityEvidence(
  input: CompanyOpportunityEvidenceQualification,
  now: Date,
): CompanyOpportunityEvidenceEvaluation {
  const parsed = companyOpportunityEvidenceQualificationSchema.safeParse(input);
  if (!parsed.success) {
    return { qualifies: false, reason: "Evidence provenance or required fields are invalid." };
  }

  const evidence = parsed.data;
  const rule = evidenceRules[evidence.evidenceType];
  if (evidence.sourceObservedAt > now) {
    return { qualifies: false, reason: "Evidence observed in the future cannot qualify a consequential transition." };
  }
  if (evidence.verifiedAt && evidence.verifiedAt > now) {
    return { qualifies: false, reason: "Future verification evidence cannot qualify a consequential transition." };
  }
  if (evidence.verifiedAt && evidence.verifiedAt < evidence.sourceObservedAt) {
    return { qualifies: false, reason: "Verification cannot precede the source observation it verifies." };
  }
  if (evidence.approvedAt && evidence.approvedAt > now) {
    return { qualifies: false, reason: "Future approval evidence cannot qualify a consequential transition." };
  }
  if (evidence.approvedAt && evidence.approvedAt < evidence.sourceObservedAt) {
    return { qualifies: false, reason: "Approval cannot precede the source observation it reviews." };
  }
  if (evidence.verifiedAt && evidence.approvedAt && evidence.approvedAt < evidence.verifiedAt) {
    return { qualifies: false, reason: "Approval cannot precede verification." };
  }
  if (evidence.approvalState === "REVOKED") {
    if (!evidence.approvedAt || !evidence.revokedAt || evidence.revokedAt < evidence.approvedAt) {
      return { qualifies: false, reason: "Revoked evidence requires proof of prior approval before revocation." };
    }
  } else if (evidence.revokedAt) {
    return { qualifies: false, reason: "A revocation timestamp requires the REVOKED approval state." };
  }
  if (evidence.revokedAt && evidence.revokedAt <= now) {
    return { qualifies: false, reason: "Revoked evidence cannot qualify a consequential transition." };
  }
  if (evidence.expiresAt && evidence.expiresAt <= now) {
    return { qualifies: false, reason: "Expired evidence cannot qualify a consequential transition." };
  }
  if (evidence.claimTruthClass !== rule.truthClass) {
    return { qualifies: false, reason: "The claim truth class does not match this evidence type." };
  }
  if (!rule.sourceTypes.includes(evidence.sourceType)) {
    return { qualifies: false, reason: "The source type is not authoritative for this evidence claim." };
  }
  if (Boolean(evidence.contract) !== Boolean(rule.contract)) {
    return { qualifies: false, reason: "Contract fields are valid only when complete contract-state evidence is required." };
  }
  if (Boolean(evidence.cash) !== Boolean(rule.cash)) {
    return { qualifies: false, reason: "Cash fields are valid only when complete cash-state evidence is required." };
  }
  if (rule.verified && (!evidence.verifiedAt || !evidence.verifiedByActorId)) {
    return { qualifies: false, reason: "Consequential evidence requires a verified timestamp and actor." };
  }
  if (rule.verified && (evidence.approvalState !== "APPROVED" || !evidence.approvedAt)) {
    return { qualifies: false, reason: "Consequential evidence requires explicit approved review state." };
  }
  if (rule.contract && !evidence.contract) {
    return { qualifies: false, reason: "Contract evidence requires agreement, counterparty, effective-date, and signature references." };
  }
  if (rule.cash && (!evidence.cash || evidence.cash.reconciliationState !== rule.cash)) {
    return { qualifies: false, reason: "Cash evidence requires amount, currency, payee, transaction, and reconciliation truth." };
  }

  return { qualifies: true, reason: "The evidence is current, verified, and authoritative for this claim." };
}

export function applyCompanyOpportunityEvidenceToTruthRails(
  current: Readonly<CompanyOpportunityTruthRails>,
  evidence: CompanyOpportunityEvidenceQualification,
  now: Date,
): CompanyOpportunityTruthRails {
  const evaluation = evaluateCompanyOpportunityEvidence(evidence, now);
  if (!evaluation.qualifies) throw new Error(evaluation.reason);

  const next = { ...current };
  switch (evidence.evidenceType) {
    case "QUALIFIED_PIPELINE":
      next.qualification = "QUALIFIED";
      break;
    case "PROVIDER_ACCEPTANCE":
      next.provider = "ACCEPTED";
      break;
    case "PROVIDER_REJECTION":
      next.provider = "REJECTED";
      break;
    case "DELIVERY_RECEIPT":
      next.delivery = "DELIVERED";
      break;
    case "DELIVERY_FAILURE":
      next.delivery = "FAILED";
      break;
    case "RESPONSE_RECEIPT":
      next.response = "RECEIVED";
      break;
    case "SUBMISSION_RECEIPT":
      next.submission = "SUBMITTED";
      break;
    case "SUBMISSION_REJECTION":
      next.submission = "REJECTED";
      break;
    case "AWARD_NOTICE":
      next.award = "AWARDED";
      break;
    case "DECLINE_NOTICE":
      next.award = "DECLINED";
      break;
    case "EXECUTED_AGREEMENT":
      next.contract = "EXECUTED";
      break;
    case "CONTRACT_TERMINATION":
      next.contract = "TERMINATED";
      break;
    case "PAYMENT_SETTLEMENT":
      next.cash = "RECEIVED";
      break;
    case "PAYMENT_REVERSAL":
      next.cash = "REVERSED";
      break;
    default:
      break;
  }
  return next;
}

function applyInvalidatedEvidenceToTruthRails(
  current: Readonly<CompanyOpportunityTruthRails>,
  evidence: CompanyOpportunityEvidenceQualification,
  now: Date,
): CompanyOpportunityTruthRails {
  const next = { ...current };
  const expired = Boolean(evidence.expiresAt && evidence.expiresAt <= now);
  switch (evidence.evidenceType) {
    case "QUALIFIED_PIPELINE":
      next.qualification = expired ? "STALE" : "DISQUALIFIED";
      break;
    case "PROVIDER_ACCEPTANCE":
    case "PROVIDER_REJECTION":
      next.provider = expired ? "RECONCILIATION_REQUIRED" : "REVOKED";
      break;
    case "DELIVERY_RECEIPT":
    case "DELIVERY_FAILURE":
      next.delivery = "RECONCILIATION_REQUIRED";
      break;
    case "RESPONSE_RECEIPT":
      next.response = "DISPUTED";
      break;
    case "SUBMISSION_RECEIPT":
    case "SUBMISSION_REJECTION":
      next.submission = "DISPUTED";
      break;
    case "AWARD_NOTICE":
    case "DECLINE_NOTICE":
      next.award = "DISPUTED";
      break;
    case "EXECUTED_AGREEMENT":
    case "CONTRACT_TERMINATION":
      next.contract = "DISPUTED";
      break;
    case "PAYMENT_SETTLEMENT":
    case "PAYMENT_REVERSAL":
      next.cash = "RECONCILIATION_REQUIRED";
      break;
    default:
      break;
  }
  return next;
}

function qualifiedBeforeTemporalInvalidation(
  evidence: CompanyOpportunityEvidenceQualification,
  now: Date,
) {
  const invalidatedAt = [evidence.expiresAt, evidence.revokedAt]
    .filter((value): value is Date => Boolean(value && value <= now))
    .sort((left, right) => left.getTime() - right.getTime())[0];
  if (!invalidatedAt) return false;

  // An invalidation may describe truth only if this exact evidence was capable of
  // establishing the rail immediately before it expired or was revoked. Removing
  // the temporal invalidation must not cure a wrong source, wrong truth class,
  // missing verification, rejection, or malformed consequential payload.
  const approvalState = evidence.revokedAt &&
    evidence.revokedAt <= now &&
    evidence.approvalState === "REVOKED"
    ? "APPROVED"
    : evidence.approvalState;
  return evaluateCompanyOpportunityEvidence({
    ...evidence,
    approvalState,
    expiresAt: null,
    revokedAt: null,
  }, new Date(invalidatedAt.getTime() - 1)).qualifies;
}

/**
 * Derive current rails from active evidence in chronological order.
 *
 * Callers own supersession filtering and ordering. This function deliberately
 * treats expired or revoked evidence as current negative truth instead of silently
 * falling back to an older positive claim.
 */
export function deriveCompanyOpportunityTruthRails(
  evidence: readonly CompanyOpportunityEvidenceQualification[],
  now: Date,
): CompanyOpportunityTruthRails {
  let rails: CompanyOpportunityTruthRails = { ...emptyCompanyOpportunityTruthRails };
  for (const item of evidence) {
    const evaluation = evaluateCompanyOpportunityEvidence(item, now);
    if (evaluation.qualifies) {
      rails = applyCompanyOpportunityEvidenceToTruthRails(rails, item, now);
    } else if (qualifiedBeforeTemporalInvalidation(item, now)) {
      rails = applyInvalidatedEvidenceToTruthRails(rails, item, now);
    }
  }
  return rails;
}

const legalNextStages: Record<
  CompanyOpportunityLifecycleStage,
  readonly CompanyOpportunityLifecycleStage[]
> = {
  DISCOVERED: ["FIT_REVIEW", "NOT_A_FIT", "CLOSED"],
  FIT_REVIEW: ["QUALIFIED", "NOT_A_FIT", "CLOSED"],
  QUALIFIED: ["CONTACT_PREPARATION", "APPLICATION_PREPARATION", "DILIGENCE", "DECLINED", "CLOSED"],
  CONTACT_PREPARATION: ["CONTACT_IN_PROGRESS", "CLOSED"],
  CONTACT_IN_PROGRESS: ["AWAITING_RESPONSE", "RESPONSE_RECEIVED", "CLOSED"],
  AWAITING_RESPONSE: ["RESPONSE_RECEIVED", "DECLINED", "CLOSED"],
  RESPONSE_RECEIVED: ["APPLICATION_PREPARATION", "DILIGENCE", "DECISION_PENDING", "CONTRACTING", "DECLINED", "CLOSED"],
  APPLICATION_PREPARATION: ["APPLICATION_SUBMITTED", "CLOSED"],
  APPLICATION_SUBMITTED: ["DILIGENCE", "DECISION_PENDING", "DECLINED", "CLOSED"],
  DILIGENCE: ["DECISION_PENDING", "CONTRACTING", "DECLINED", "CLOSED"],
  DECISION_PENDING: ["AWARDED", "DECLINED", "CLOSED"],
  AWARDED: ["CONTRACTING", "CLOSED"],
  CONTRACTING: ["IMPLEMENTATION", "DECLINED", "CLOSED"],
  IMPLEMENTATION: ["CLOSED"],
  NOT_A_FIT: ["CLOSED"],
  DECLINED: ["CLOSED"],
  CLOSED: [],
};

const transitionEvidence: Partial<
  Record<CompanyOpportunityLifecycleStage, CompanyOpportunityEvidenceType>
> = {
  QUALIFIED: "QUALIFIED_PIPELINE",
  RESPONSE_RECEIVED: "RESPONSE_RECEIPT",
  APPLICATION_SUBMITTED: "SUBMISSION_RECEIPT",
  AWARDED: "AWARD_NOTICE",
  DECLINED: "DECLINE_NOTICE",
  IMPLEMENTATION: "EXECUTED_AGREEMENT",
};

export type CompanyOpportunityTransitionEvaluationInput = {
  currentStage: CompanyOpportunityLifecycleStage;
  targetStage: CompanyOpportunityLifecycleStage;
  expectedVersion: number;
  actualVersion: number;
  evidence: readonly CompanyOpportunityEvidenceQualification[];
  now: Date;
};

export type CompanyOpportunityTransitionEvaluation = {
  allowed: boolean;
  reason: string;
};

export function evaluateCompanyOpportunityTransition(
  input: CompanyOpportunityTransitionEvaluationInput,
): CompanyOpportunityTransitionEvaluation {
  const currentStage = companyOpportunityLifecycleStageSchema.safeParse(input.currentStage);
  const targetStage = companyOpportunityLifecycleStageSchema.safeParse(input.targetStage);
  if (!currentStage.success || !targetStage.success) {
    return { allowed: false, reason: "The requested lifecycle stage is invalid." };
  }
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    return { allowed: false, reason: "A positive expected aggregate version is required." };
  }
  if (input.expectedVersion !== input.actualVersion) {
    return { allowed: false, reason: "The opportunity changed; reload before applying this transition version." };
  }
  if (!legalNextStages[input.currentStage].includes(input.targetStage)) {
    return { allowed: false, reason: "The requested lifecycle jump or backwards transition is not permitted." };
  }

  const requiredEvidenceType = transitionEvidence[input.targetStage];
  if (requiredEvidenceType) {
    const currentRails = deriveCompanyOpportunityTruthRails(input.evidence, input.now);
    const supported =
      (input.targetStage === "QUALIFIED" && currentRails.qualification === "QUALIFIED") ||
      (input.targetStage === "RESPONSE_RECEIVED" && currentRails.response === "RECEIVED") ||
      (input.targetStage === "APPLICATION_SUBMITTED" && currentRails.submission === "SUBMITTED") ||
      (input.targetStage === "AWARDED" && currentRails.award === "AWARDED") ||
      (input.targetStage === "DECLINED" && currentRails.award === "DECLINED") ||
      (input.targetStage === "IMPLEMENTATION" && currentRails.contract === "EXECUTED");
    if (!supported) {
      return {
        allowed: false,
        reason: `${input.targetStage} requires current authoritative ${requiredEvidenceType.toLowerCase()} evidence; an observed source alone is insufficient.`,
      };
    }
  }

  return { allowed: true, reason: "The lifecycle transition is adjacent and supported by qualifying evidence." };
}
