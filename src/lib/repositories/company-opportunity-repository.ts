import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ClinicAction } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import {
  companyOpportunityEvidenceTypeSchema,
  companyOpportunityLifecycleStageSchema,
  companyOpportunitySourceReferenceSchemes,
  companyOpportunitySourceTypeSchema,
  deriveCompanyOpportunityTruthRails,
  evaluateCompanyOpportunityEvidence,
  evaluateCompanyOpportunityTransition,
  type CompanyOpportunityEvidenceQualification,
  type CompanyOpportunityTruthRails,
} from "@/lib/company/company-opportunity-contract";
import { isCompanyOpportunityAccessAllowed } from "@/lib/company/company-opportunity-access";
import { companyTruthClassSchema } from "@/lib/company/company-truth";
import {
  symphonyOpportunityClasses,
  symphonyTargetClasses,
} from "@/lib/company/symphony-opportunity-types";

type Transaction = Prisma.TransactionClient;

const safeText = (max: number) => z.string().trim().min(1).max(max);
const safeSingleLineText = (max: number) => safeText(max).refine(
  (value) => !/[\r\n]/.test(value),
  "This field must be a concise single-line claim, not a message body.",
);
const unsafeSynopsisPattern = /^(?:from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_-]?key|secret|authorization|bearer|password)\s*[:=]/i;
const safeSynopsisText = (max: number) => safeSingleLineText(max).refine(
  (value) => !unsafeSynopsisPattern.test(value),
  "This field must be a minimized synopsis without message headers or secret-like material.",
);
const optionalSynopsisText = (max: number) => safeSynopsisText(max).nullable().optional();
const optionalSingleLineText = (max: number) => safeSingleLineText(max).nullable().optional();
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const dateInputSchema = z.coerce.date();
const sourceReferenceSchema = safeSingleLineText(2048).refine(
  (value) => /^[a-z][a-z0-9-]*:\/\/[A-Za-z0-9._~:/#=-]+$/.test(value) && !/[?&@%]/.test(value),
  "Source references must be inert, allowlisted opaque references without URLs, credentials, or query data.",
);
const sourceLocatorSchema = safeSingleLineText(1000).refine(
  (value) => !/^(?:https?|ftp|file):/i.test(value) && !/[?&@\r\n]/.test(value),
  "Source locators must be inert identifiers without fetchable URLs, credentials, or query data.",
).nullable().optional();

function addSourceReferenceIssue(
  input: { sourceType: z.infer<typeof companyOpportunitySourceTypeSchema>; sourceReference: string },
  context: z.RefinementCtx,
) {
  if (!input.sourceReference.startsWith(companyOpportunitySourceReferenceSchemes[input.sourceType])) {
    context.addIssue({
      code: "custom",
      path: ["sourceReference"],
      message: "The opaque source-reference scheme must match the declared source type.",
    });
  }
}

export const createCompanyOpportunitySchema = z.object({
  title: safeSynopsisText(240),
  opportunityClass: z.enum(symphonyOpportunityClasses),
  targetClass: z.enum(symphonyTargetClasses),
  targetOrganizationName: safeSynopsisText(300),
  targetOrganizationDomain: z.string().trim().min(1).max(253).regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i,
  ).nullable().optional(),
  purpose: safeSynopsisText(1200),
  ask: optionalSynopsisText(1200),
  ownerId: optionalSingleLineText(200),
  deadlineAt: dateInputSchema.nullable().optional(),
  nextAction: optionalSynopsisText(600),
  nextActionDueAt: dateInputSchema.nullable().optional(),
  blocker: optionalSynopsisText(600),
  sourceSystem: safeSynopsisText(120),
  sourceType: companyOpportunitySourceTypeSchema,
  sourceReference: sourceReferenceSchema,
  sourceFingerprintSha256: sha256Schema,
  sourceObservedAt: dateInputSchema,
}).strict().superRefine(addSourceReferenceIssue);

const contractEvidenceInputSchema = z.object({
  agreementReference: safeSingleLineText(300),
  counterparty: safeSynopsisText(300),
  effectiveAt: dateInputSchema,
  signatureEvidenceReference: safeSingleLineText(500),
}).strict();

const cashEvidenceInputSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  payeeEntityReference: safeSingleLineText(300),
  externalTransactionReference: safeSingleLineText(500),
  reconciliationState: z.enum(["SETTLED", "REVERSED"]),
}).strict();

const evidenceAppendBaseSchema = z.object({
  expectedVersion: z.number().int().positive(),
  ingestionKey: safeSingleLineText(300),
  claimKey: safeSingleLineText(200),
  claimText: safeSingleLineText(600),
  claimTruthClass: companyTruthClassSchema,
  sourceSystem: safeSynopsisText(120),
  sourceType: companyOpportunitySourceTypeSchema,
  sourceReference: sourceReferenceSchema,
  sourceThreadId: optionalSingleLineText(300),
  sourceMessageId: optionalSingleLineText(300),
  sourceArtifactId: optionalSingleLineText(300),
  sourceFingerprintSha256: sha256Schema,
  sourceLocator: sourceLocatorSchema,
  sourceSection: optionalSingleLineText(300),
  sourcePage: z.number().int().positive().nullable().optional(),
  sourceObservedAt: dateInputSchema,
  verifiedByCurrentActor: z.boolean().default(false),
  reviewAfter: dateInputSchema.nullable().optional(),
  expiresAt: dateInputSchema.nullable().optional(),
  retentionReviewAt: dateInputSchema.nullable().optional(),
}).strict();

const ordinaryEvidenceTypeSchema = z.enum([
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
  "OTHER_REVIEW_REQUIRED",
]);

const noContract = { contract: z.never().optional() } as const;
const noCash = { cash: z.never().optional() } as const;
const noCorrection = {
  supersedesEvidenceId: z.never().optional(),
  correctionReason: z.never().optional(),
} as const;

const ordinaryEvidenceAppendSchema = evidenceAppendBaseSchema.extend({
  evidenceType: ordinaryEvidenceTypeSchema,
  ...noCorrection,
  ...noContract,
  ...noCash,
}).strict();

const correctionEvidenceAppendSchema = evidenceAppendBaseSchema.extend({
  evidenceType: z.literal("EVIDENCE_CORRECTION"),
  verifiedByCurrentActor: z.literal(true),
  expiresAt: z.null().optional(),
  supersedesEvidenceId: safeSingleLineText(200),
  correctionReason: safeSingleLineText(600),
  ...noContract,
  ...noCash,
}).strict();

const executedAgreementEvidenceAppendSchema = evidenceAppendBaseSchema.extend({
  evidenceType: z.literal("EXECUTED_AGREEMENT"),
  ...noCorrection,
  contract: contractEvidenceInputSchema,
  ...noCash,
}).strict();

const contractTerminationEvidenceAppendSchema = evidenceAppendBaseSchema.extend({
  evidenceType: z.literal("CONTRACT_TERMINATION"),
  ...noCorrection,
  contract: contractEvidenceInputSchema,
  ...noCash,
}).strict();

const paymentSettlementEvidenceAppendSchema = evidenceAppendBaseSchema.extend({
  evidenceType: z.literal("PAYMENT_SETTLEMENT"),
  ...noCorrection,
  ...noContract,
  cash: cashEvidenceInputSchema.extend({ reconciliationState: z.literal("SETTLED") }).strict(),
}).strict();

const paymentReversalEvidenceAppendSchema = evidenceAppendBaseSchema.extend({
  evidenceType: z.literal("PAYMENT_REVERSAL"),
  ...noCorrection,
  ...noContract,
  cash: cashEvidenceInputSchema.extend({ reconciliationState: z.literal("REVERSED") }).strict(),
}).strict();

export const appendCompanyOpportunityEvidenceSchema = z.discriminatedUnion("evidenceType", [
  ordinaryEvidenceAppendSchema,
  correctionEvidenceAppendSchema,
  executedAgreementEvidenceAppendSchema,
  contractTerminationEvidenceAppendSchema,
  paymentSettlementEvidenceAppendSchema,
  paymentReversalEvidenceAppendSchema,
]).superRefine((input, context) => {
  addSourceReferenceIssue(input, context);
});

export const transitionCompanyOpportunitySchema = z.object({
  expectedVersion: z.number().int().positive(),
  targetStage: companyOpportunityLifecycleStageSchema,
  idempotencyKey: safeSingleLineText(300),
  reason: safeSynopsisText(1000),
}).strict();

export const listCompanyOpportunitiesSchema = z.object({
  cursor: safeText(200).optional(),
  limit: z.number().int().min(1).max(100).default(25),
}).strict();

export class CompanyOpportunityAccessError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "CompanyOpportunityAccessError";
  }
}

type OpportunityRecord = {
  id: string;
  organizationId: string;
  version: number;
  title: string;
  opportunityClass: string;
  targetClass: string;
  targetOrganizationName: string;
  targetOrganizationDomain: string | null;
  purpose: string;
  ask: string | null;
  lifecycleStage: string;
  qualificationState: string;
  providerState: string;
  deliveryState: string;
  responseState: string;
  submissionState: string;
  awardState: string;
  contractState: string;
  cashState: string;
  ownerId: string | null;
  deadlineAt: Date | null;
  nextAction: string | null;
  nextActionDueAt: Date | null;
  blocker: string | null;
  sourceSystem: string;
  sourceType: string;
  sourceReference: string;
  sourceFingerprintSha256: string;
  sourceObservedAt: Date;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EvidenceRecord = {
  id: string;
  claimKey: string;
  claimText: string;
  truthClass: string;
  evidenceType: string;
  sourceSystem: string;
  sourceType: string;
  sourceReference: string;
  sourceThreadId: string | null;
  sourceMessageId: string | null;
  sourceArtifactId: string | null;
  sourceFingerprintSha256: string;
  sourceLocator: string | null;
  sourceSection: string | null;
  sourcePage: number | null;
  sourceObservedAt: Date;
  observedByActorId: string | null;
  verifiedAt: Date | null;
  verifiedByActorId: string | null;
  approvalState: string;
  approvedAt: Date | null;
  approvedByActorId: string | null;
  reviewAfter: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  tombstonedAt: Date | null;
  supersedesEvidenceId: string | null;
  correctionReason: string | null;
  agreementReference: string | null;
  counterparty: string | null;
  agreementEffectiveAt: Date | null;
  signatureEvidenceReference: string | null;
  amountCents: number | null;
  currency: string | null;
  payeeEntityReference: string | null;
  externalTransactionReference: string | null;
  reconciliationState: string | null;
  retentionReviewAt: Date | null;
  recordedByActorId: string | null;
  createdAt: Date;
};

type OpportunityWithEvidenceRecord = OpportunityRecord & { evidence: EvidenceRecord[] };

const opportunitySelect = {
  id: true,
  organizationId: true,
  version: true,
  title: true,
  opportunityClass: true,
  targetClass: true,
  targetOrganizationName: true,
  targetOrganizationDomain: true,
  purpose: true,
  ask: true,
  lifecycleStage: true,
  qualificationState: true,
  providerState: true,
  deliveryState: true,
  responseState: true,
  submissionState: true,
  awardState: true,
  contractState: true,
  cashState: true,
  ownerId: true,
  deadlineAt: true,
  nextAction: true,
  nextActionDueAt: true,
  blocker: true,
  sourceSystem: true,
  sourceType: true,
  sourceReference: true,
  sourceFingerprintSha256: true,
  sourceObservedAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

const evidenceSelect = {
  id: true,
  claimKey: true,
  claimText: true,
  truthClass: true,
  evidenceType: true,
  sourceSystem: true,
  sourceType: true,
  sourceReference: true,
  sourceThreadId: true,
  sourceMessageId: true,
  sourceArtifactId: true,
  sourceFingerprintSha256: true,
  sourceLocator: true,
  sourceSection: true,
  sourcePage: true,
  sourceObservedAt: true,
  observedByActorId: true,
  verifiedAt: true,
  verifiedByActorId: true,
  approvalState: true,
  approvedAt: true,
  approvedByActorId: true,
  reviewAfter: true,
  expiresAt: true,
  revokedAt: true,
  tombstonedAt: true,
  supersedesEvidenceId: true,
  correctionReason: true,
  agreementReference: true,
  counterparty: true,
  agreementEffectiveAt: true,
  signatureEvidenceReference: true,
  amountCents: true,
  currency: true,
  payeeEntityReference: true,
  externalTransactionReference: true,
  reconciliationState: true,
  retentionReviewAt: true,
  recordedByActorId: true,
  createdAt: true,
} as const;

const opportunityWithEvidenceSelect = {
  ...opportunitySelect,
  evidence: {
    select: evidenceSelect,
    orderBy: [{ sourceObservedAt: "asc" as const }, { createdAt: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.CompanyExternalOpportunitySelect;

export type CompanyOpportunityDto = ReturnType<typeof toCompanyOpportunityDto>;

function toCompanyOpportunityDto(
  record: OpportunityRecord,
  currentRails: Readonly<CompanyOpportunityTruthRails> = opportunityRails(record),
) {
  return {
    id: record.id,
    version: record.version,
    title: record.title,
    opportunityClass: record.opportunityClass,
    targetClass: record.targetClass,
    targetOrganizationName: record.targetOrganizationName,
    targetOrganizationDomain: record.targetOrganizationDomain,
    purpose: record.purpose,
    ask: record.ask,
    lifecycleStage: record.lifecycleStage,
    qualificationState: currentRails.qualification,
    providerState: currentRails.provider,
    deliveryState: currentRails.delivery,
    responseState: currentRails.response,
    submissionState: currentRails.submission,
    awardState: currentRails.award,
    contractState: currentRails.contract,
    cashState: currentRails.cash,
    ownerId: record.ownerId,
    deadlineAt: record.deadlineAt?.toISOString() ?? null,
    nextAction: record.nextAction,
    nextActionDueAt: record.nextActionDueAt?.toISOString() ?? null,
    blocker: record.blocker,
    sourceSystem: record.sourceSystem,
    sourceObservedAt: record.sourceObservedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function requireCompanyOpportunityAccess(session: ClinicSession, action: ClinicAction) {
  if (session.demo || !isCompanyOpportunityAccessAllowed({
    role: session.role,
    action,
    organizationSlug: session.organizationSlug,
  })) {
    throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
  }
}

async function assertActiveCompanyReadContext(session: ClinicSession) {
  const [organization, actor] = await Promise.all([
    db.organization.findFirst({
      where: {
        id: session.organizationId,
        slug: session.organizationSlug,
        status: "active",
      },
      select: { id: true },
    }),
    db.user.findFirst({
      where: {
        id: session.userId,
        organizationId: session.organizationId,
        status: "active",
      },
      select: { id: true },
    }),
  ]);
  if (!organization || !actor) {
    throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
  }
}

async function assertActiveCompanyContext(tx: Transaction, session: ClinicSession) {
  const [organization, actor] = await Promise.all([
    tx.organization.findFirst({
      where: {
        id: session.organizationId,
        slug: session.organizationSlug,
        status: "active",
      },
      select: { id: true, slug: true, status: true },
    }),
    tx.user.findFirst({
      where: {
        id: session.userId,
        organizationId: session.organizationId,
        status: "active",
      },
      select: { id: true },
    }),
  ]);
  if (!organization || !actor) {
    throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
  }
}

async function assertOptionalOwner(tx: Transaction, session: ClinicSession, ownerId: string | null | undefined) {
  if (!ownerId) return;
  const owner = await tx.user.findFirst({
    where: { id: ownerId, organizationId: session.organizationId, status: "active" },
    select: { id: true },
  });
  if (!owner) throw new CompanyOpportunityAccessError("The selected owner is not available.", 400);
}

function datesEqual(left: Date | null | undefined, right: Date | null | undefined) {
  return (left?.getTime() ?? null) === (right?.getTime() ?? null);
}

function createSemanticsMatch(
  existing: OpportunityRecord,
  input: z.infer<typeof createCompanyOpportunitySchema>,
) {
  return (
    existing.title === input.title &&
    existing.opportunityClass === input.opportunityClass &&
    existing.targetClass === input.targetClass &&
    existing.targetOrganizationName === input.targetOrganizationName &&
    existing.targetOrganizationDomain === (input.targetOrganizationDomain ?? null) &&
    existing.purpose === input.purpose &&
    existing.ask === (input.ask ?? null) &&
    existing.ownerId === (input.ownerId ?? null) &&
    datesEqual(existing.deadlineAt, input.deadlineAt) &&
    existing.nextAction === (input.nextAction ?? null) &&
    datesEqual(existing.nextActionDueAt, input.nextActionDueAt) &&
    existing.blocker === (input.blocker ?? null) &&
    existing.sourceType === input.sourceType &&
    existing.sourceReference === input.sourceReference &&
    datesEqual(existing.sourceObservedAt, input.sourceObservedAt)
  );
}

function evidenceQualification(record: EvidenceRecord): CompanyOpportunityEvidenceQualification | null {
  const contract =
    record.agreementReference &&
    record.counterparty &&
    record.agreementEffectiveAt &&
    record.signatureEvidenceReference
      ? {
          agreementReference: record.agreementReference,
          counterparty: record.counterparty,
          effectiveAt: record.agreementEffectiveAt,
          signatureEvidenceReference: record.signatureEvidenceReference,
        }
      : undefined;
  const cash =
    record.amountCents &&
    record.currency &&
    record.payeeEntityReference &&
    record.externalTransactionReference &&
    (record.reconciliationState === "SETTLED" || record.reconciliationState === "REVERSED")
      ? {
          amountCents: record.amountCents,
          currency: record.currency,
          payeeEntityReference: record.payeeEntityReference,
          externalTransactionReference: record.externalTransactionReference,
          reconciliationState: record.reconciliationState,
        }
      : undefined;

  const parsed = z.object({
    evidenceType: companyOpportunityEvidenceTypeSchema,
    claimTruthClass: companyTruthClassSchema,
    sourceType: companyOpportunitySourceTypeSchema,
    sourceReference: sourceReferenceSchema,
    sourceFingerprintSha256: sha256Schema,
    sourceObservedAt: z.date(),
    verifiedAt: z.date().nullable(),
    verifiedByActorId: z.string().nullable(),
    approvalState: z.enum(["NEEDS_REVIEW", "APPROVED", "REJECTED", "REVOKED"]),
    expiresAt: z.date().nullable(),
    revokedAt: z.date().nullable(),
    contract: contractEvidenceInputSchema.optional(),
    cash: cashEvidenceInputSchema.optional(),
  }).strict().safeParse({
    evidenceType: record.evidenceType,
    claimTruthClass: record.truthClass,
    sourceType: record.sourceType,
    sourceReference: record.sourceReference,
    sourceFingerprintSha256: record.sourceFingerprintSha256,
    sourceObservedAt: record.sourceObservedAt,
    verifiedAt: record.verifiedAt,
    verifiedByActorId: record.verifiedByActorId,
    approvalState: record.approvalState,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    ...(contract ? { contract } : {}),
    ...(cash ? { cash } : {}),
  });
  return parsed.success ? parsed.data : null;
}

function activeEvidence(records: readonly EvidenceRecord[], now: Date) {
  const supersededIds = new Set(
    records
      .filter((record) => {
        if (
          record.evidenceType !== "EVIDENCE_CORRECTION" ||
          !record.supersedesEvidenceId ||
          record.tombstonedAt
        ) return false;
        const qualification = evidenceQualification(record);
        return Boolean(qualification && evaluateCompanyOpportunityEvidence(qualification, now).qualifies);
      })
      .map((record) => record.supersedesEvidenceId)
      .filter((id): id is string => Boolean(id)),
  );
  return [...records]
    .filter((record) => !record.tombstonedAt && !supersededIds.has(record.id))
    .sort((left, right) => {
      const effectiveTime = (record: EvidenceRecord) =>
        (record.evidenceType === "EXECUTED_AGREEMENT" || record.evidenceType === "CONTRACT_TERMINATION") &&
        record.agreementEffectiveAt
          ? record.agreementEffectiveAt.getTime()
          : record.sourceObservedAt.getTime();
      return effectiveTime(left) - effectiveTime(right) ||
        left.sourceObservedAt.getTime() - right.sourceObservedAt.getTime() ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id);
    })
    .map(evidenceQualification)
    .filter((item): item is CompanyOpportunityEvidenceQualification => Boolean(item));
}

function deriveTruthRails(records: readonly EvidenceRecord[], now: Date) {
  return deriveCompanyOpportunityTruthRails(activeEvidence(records, now), now);
}

const railKeys = [
  "qualification",
  "provider",
  "delivery",
  "response",
  "submission",
  "award",
  "contract",
  "cash",
] as const;

function opportunityRails(opportunity: OpportunityRecord): CompanyOpportunityTruthRails {
  return {
    qualification: opportunity.qualificationState as CompanyOpportunityTruthRails["qualification"],
    provider: opportunity.providerState as CompanyOpportunityTruthRails["provider"],
    delivery: opportunity.deliveryState as CompanyOpportunityTruthRails["delivery"],
    response: opportunity.responseState as CompanyOpportunityTruthRails["response"],
    submission: opportunity.submissionState as CompanyOpportunityTruthRails["submission"],
    award: opportunity.awardState as CompanyOpportunityTruthRails["award"],
    contract: opportunity.contractState as CompanyOpportunityTruthRails["contract"],
    cash: opportunity.cashState as CompanyOpportunityTruthRails["cash"],
  };
}

async function findOpportunity(tx: Transaction, organizationId: string, opportunityId: string) {
  return tx.companyExternalOpportunity.findFirst({
    where: { id: opportunityId, organizationId, operatingScope: "KLINIKOS_COMPANY_OS" },
    select: opportunitySelect,
  }) as Promise<OpportunityRecord | null>;
}

export async function createCompanyOpportunity(session: ClinicSession, rawInput: unknown) {
  requireCompanyOpportunityAccess(session, "create");
  const input = createCompanyOpportunitySchema.parse(rawInput);
  const now = new Date();
  if (input.sourceObservedAt > now) {
    throw new CompanyOpportunityAccessError("Opportunity source cannot be observed in the future.", 400);
  }

  return db.$transaction(async (tx) => {
    await assertActiveCompanyContext(tx, session);
    await assertOptionalOwner(tx, session, input.ownerId);
    const lockKey = `company-opportunity-source:${session.organizationId}:${input.sourceSystem}:${input.sourceFingerprintSha256}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS "lock"`;

    const existing = (await tx.companyExternalOpportunity.findFirst({
      where: {
        organizationId: session.organizationId,
        sourceSystem: input.sourceSystem,
        sourceFingerprintSha256: input.sourceFingerprintSha256,
      },
      select: opportunityWithEvidenceSelect,
    })) as OpportunityWithEvidenceRecord | null;
    if (existing) {
      if (!createSemanticsMatch(existing, input)) {
        throw new CompanyOpportunityAccessError(
          "This source fingerprint is already bound to different opportunity semantics.",
          409,
        );
      }
      return toCompanyOpportunityDto(existing, deriveTruthRails(existing.evidence, now));
    }

    const created = (await tx.companyExternalOpportunity.create({
      data: {
        organizationId: session.organizationId,
        operatingScope: "KLINIKOS_COMPANY_OS",
        version: 1,
        title: input.title,
        opportunityClass: input.opportunityClass,
        targetClass: input.targetClass,
        targetOrganizationName: input.targetOrganizationName,
        targetOrganizationDomain: input.targetOrganizationDomain ?? null,
        purpose: input.purpose,
        ask: input.ask ?? null,
        lifecycleStage: "DISCOVERED",
        qualificationState: "UNQUALIFIED",
        providerState: "UNPROVEN",
        deliveryState: "UNPROVEN",
        responseState: "UNPROVEN",
        submissionState: "NOT_STARTED",
        awardState: "UNPROVEN",
        contractState: "UNPROVEN",
        cashState: "UNPROVEN",
        ownerId: input.ownerId ?? null,
        deadlineAt: input.deadlineAt ?? null,
        nextAction: input.nextAction ?? null,
        nextActionDueAt: input.nextActionDueAt ?? null,
        blocker: input.blocker ?? null,
        sourceSystem: input.sourceSystem,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference,
        sourceFingerprintSha256: input.sourceFingerprintSha256,
        sourceObservedAt: input.sourceObservedAt,
        createdById: session.userId,
      },
      select: opportunitySelect,
    })) as OpportunityRecord;

    const initialEvidence = await tx.companyOpportunityEvidence.create({
      data: {
        organizationId: session.organizationId,
        opportunityId: created.id,
        claimKey: "source_observed",
        claimText: "The referenced source was observed and recorded for review.",
        truthClass: "ACTUAL",
        evidenceType: "OBSERVED_SOURCE",
        sourceSystem: input.sourceSystem,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference,
        sourceFingerprintSha256: input.sourceFingerprintSha256,
        ingestionKey: `source:${input.sourceSystem}:${input.sourceFingerprintSha256}`,
        sourceObservedAt: input.sourceObservedAt,
        observedByActorId: session.userId,
        approvalState: "NEEDS_REVIEW",
        disclosureState: "INTERNAL_ONLY",
        recordedByActorId: session.userId,
      },
      select: { id: true },
    });
    await tx.companyOpportunityEvent.create({
      data: {
        organizationId: session.organizationId,
        opportunityId: created.id,
        idempotencyKey: `opportunity:create:${input.sourceFingerprintSha256}`,
        actorId: session.userId,
        eventType: "OPPORTUNITY_CREATED",
        expectedVersion: 0,
        resultingVersion: 1,
        toLifecycleStage: "DISCOVERED",
        evidenceId: initialEvidence.id,
        reason: "A source was observed; no pipeline, award, contract, or cash state was inferred.",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "company.opportunity_created",
        resourceType: "company_external_opportunity",
        resourceId: created.id,
        metadata: {
          operatingScope: "KLINIKOS_COMPANY_OS",
          sourceSystem: input.sourceSystem,
          evidenceId: initialEvidence.id,
        },
      },
    });

    return toCompanyOpportunityDto(created);
  });
}

export async function listCompanyOpportunities(session: ClinicSession, rawInput: unknown = {}) {
  requireCompanyOpportunityAccess(session, "read");
  const input = listCompanyOpportunitiesSchema.parse(rawInput);
  await assertActiveCompanyReadContext(session);
  if (input.cursor) {
    const cursor = await db.companyExternalOpportunity.findFirst({
      where: {
        id: input.cursor,
        organizationId: session.organizationId,
        operatingScope: "KLINIKOS_COMPANY_OS",
      },
      select: { id: true },
    });
    if (!cursor) throw new CompanyOpportunityAccessError("Company opportunity cursor not found.", 404);
  }
  const records = (await db.companyExternalOpportunity.findMany({
    where: { organizationId: session.organizationId, operatingScope: "KLINIKOS_COMPANY_OS" },
    select: opportunityWithEvidenceSelect,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  })) as OpportunityWithEvidenceRecord[];
  const hasMore = records.length > input.limit;
  const page = hasMore ? records.slice(0, input.limit) : records;
  const now = new Date();
  return {
    items: page.map((record) => toCompanyOpportunityDto(record, deriveTruthRails(record.evidence, now))),
    nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
  };
}

export async function getCompanyOpportunity(session: ClinicSession, opportunityId: string) {
  requireCompanyOpportunityAccess(session, "read");
  const id = safeText(200).parse(opportunityId);
  await assertActiveCompanyReadContext(session);
  const record = (await db.companyExternalOpportunity.findFirst({
    where: { id, organizationId: session.organizationId, operatingScope: "KLINIKOS_COMPANY_OS" },
    select: opportunityWithEvidenceSelect,
  })) as OpportunityWithEvidenceRecord | null;
  if (!record) throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
  return toCompanyOpportunityDto(record, deriveTruthRails(record.evidence, new Date()));
}

function evidenceInputMatches(
  existing: Record<string, unknown>,
  input: z.infer<typeof appendCompanyOpportunityEvidenceSchema>,
  actorId: string,
) {
  const nullable = <T>(value: T | null | undefined) => value ?? null;
  const dateFieldMatches = (field: string, expected: Date | null | undefined) =>
    existing[field] instanceof Date && expected instanceof Date
      ? existing[field].getTime() === expected.getTime()
      : nullable(existing[field]) === nullable(expected);
  const contract = input.contract;
  const cash = input.cash;
  const verificationMatches = input.verifiedByCurrentActor
    ? existing.verifiedAt instanceof Date &&
      existing.verifiedByActorId === actorId &&
      existing.approvalState === "APPROVED" &&
      existing.approvedAt instanceof Date &&
      existing.approvedByActorId === actorId
    : existing.verifiedAt === null &&
      existing.verifiedByActorId === null &&
      existing.approvalState === "NEEDS_REVIEW" &&
      existing.approvedAt === null &&
      existing.approvedByActorId === null;
  const scalarMatches =
    existing.claimKey === input.claimKey &&
    existing.claimText === input.claimText &&
    existing.truthClass === input.claimTruthClass &&
    existing.evidenceType === input.evidenceType &&
    existing.sourceSystem === input.sourceSystem &&
    existing.sourceType === input.sourceType &&
    existing.sourceReference === input.sourceReference &&
    existing.sourceThreadId === nullable(input.sourceThreadId) &&
    existing.sourceMessageId === nullable(input.sourceMessageId) &&
    existing.sourceArtifactId === nullable(input.sourceArtifactId) &&
    existing.sourceFingerprintSha256 === input.sourceFingerprintSha256 &&
    existing.sourceLocator === nullable(input.sourceLocator) &&
    existing.sourceSection === nullable(input.sourceSection) &&
    existing.sourcePage === nullable(input.sourcePage) &&
    existing.observedByActorId === actorId &&
    existing.supersedesEvidenceId === nullable(input.supersedesEvidenceId) &&
    existing.correctionReason === nullable(input.correctionReason) &&
    existing.agreementReference === nullable(contract?.agreementReference) &&
    existing.counterparty === nullable(contract?.counterparty) &&
    existing.signatureEvidenceReference === nullable(contract?.signatureEvidenceReference) &&
    existing.amountCents === nullable(cash?.amountCents) &&
    existing.currency === nullable(cash?.currency) &&
    existing.payeeEntityReference === nullable(cash?.payeeEntityReference) &&
    existing.externalTransactionReference === nullable(cash?.externalTransactionReference) &&
    existing.reconciliationState === nullable(cash?.reconciliationState) &&
    existing.retentionReviewAt !== undefined &&
    existing.recordedByActorId === actorId;
  return scalarMatches &&
    verificationMatches &&
    dateFieldMatches("sourceObservedAt", input.sourceObservedAt) &&
    dateFieldMatches("reviewAfter", input.reviewAfter) &&
    dateFieldMatches("expiresAt", input.expiresAt) &&
    dateFieldMatches("agreementEffectiveAt", contract?.effectiveAt) &&
    dateFieldMatches("retentionReviewAt", input.retentionReviewAt);
}

function qualificationFromAppendInput(
  input: z.infer<typeof appendCompanyOpportunityEvidenceSchema>,
  now: Date,
  actorId: string,
): CompanyOpportunityEvidenceQualification {
  return {
    evidenceType: input.evidenceType,
    claimTruthClass: input.claimTruthClass,
    sourceType: input.sourceType,
    sourceReference: input.sourceReference,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    sourceObservedAt: input.sourceObservedAt,
    verifiedAt: input.verifiedByCurrentActor ? now : null,
    verifiedByActorId: input.verifiedByCurrentActor ? actorId : null,
    approvalState: input.verifiedByCurrentActor ? "APPROVED" : "NEEDS_REVIEW",
    expiresAt: input.expiresAt ?? null,
    revokedAt: null,
    ...(input.contract ? { contract: input.contract } : {}),
    ...(input.cash ? { cash: input.cash } : {}),
  };
}

export async function appendCompanyOpportunityEvidence(
  session: ClinicSession,
  opportunityId: string,
  rawInput: unknown,
) {
  requireCompanyOpportunityAccess(session, "update");
  const id = safeText(200).parse(opportunityId);
  const input = appendCompanyOpportunityEvidenceSchema.parse(rawInput);
  const now = new Date();
  if (input.sourceObservedAt > now) {
    throw new CompanyOpportunityAccessError("Evidence cannot be recorded with a future observation timestamp.", 400);
  }
  if (input.expiresAt && input.expiresAt <= input.sourceObservedAt) {
    throw new CompanyOpportunityAccessError("Evidence expiry must follow its source observation.", 400);
  }

  return db.$transaction(async (tx) => {
    await assertActiveCompanyContext(tx, session);
    const lockKey = `company-opportunity:${session.organizationId}:${id}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS "lock"`;

    const opportunity = await findOpportunity(tx, session.organizationId, id);
    if (!opportunity) throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);

    const existing = await tx.companyOpportunityEvidence.findFirst({
      where: {
        organizationId: session.organizationId,
        opportunityId: id,
        ingestionKey: input.ingestionKey,
      },
    });
    if (existing) {
      if (!evidenceInputMatches(existing as unknown as Record<string, unknown>, input, session.userId)) {
        throw new CompanyOpportunityAccessError(
          "This evidence ingestion key is already bound to different semantics.",
          409,
        );
      }
      const currentEvidence = (await tx.companyOpportunityEvidence.findMany({
        where: { organizationId: session.organizationId, opportunityId: id },
        select: evidenceSelect,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })) as EvidenceRecord[];
      return toCompanyOpportunityDto(opportunity, deriveTruthRails(currentEvidence, now));
    }
    if (opportunity.version !== input.expectedVersion) {
      throw new CompanyOpportunityAccessError(
        "The opportunity changed; reload before recording evidence.",
        409,
      );
    }

    if (input.supersedesEvidenceId) {
      const prior = await tx.companyOpportunityEvidence.findFirst({
        where: {
          id: input.supersedesEvidenceId,
          organizationId: session.organizationId,
          opportunityId: id,
        },
        select: { id: true, claimKey: true, evidenceType: true, tombstonedAt: true },
      });
      if (!prior) throw new CompanyOpportunityAccessError("Prior evidence not found.", 404);
      if (
        prior.claimKey !== input.claimKey ||
        prior.evidenceType === "EVIDENCE_CORRECTION" ||
        prior.tombstonedAt
      ) {
        throw new CompanyOpportunityAccessError(
          "Evidence correction must target one active prior record for the same claim.",
          409,
        );
      }
      const alreadySuperseded = await tx.companyOpportunityEvidence.findFirst({
        where: {
          organizationId: session.organizationId,
          opportunityId: id,
          supersedesEvidenceId: input.supersedesEvidenceId,
        },
        select: { id: true },
      });
      if (alreadySuperseded) {
        throw new CompanyOpportunityAccessError("Prior evidence has already been superseded.", 409);
      }
      const correctionEvaluation = evaluateCompanyOpportunityEvidence(
        qualificationFromAppendInput(input, now, session.userId),
        now,
      );
      if (!correctionEvaluation.qualifies) {
        throw new CompanyOpportunityAccessError(correctionEvaluation.reason, 409);
      }
    }

    const createdEvidence = await tx.companyOpportunityEvidence.create({
      data: {
        organizationId: session.organizationId,
        opportunityId: id,
        claimKey: input.claimKey,
        claimText: input.claimText,
        truthClass: input.claimTruthClass,
        evidenceType: input.evidenceType,
        sourceSystem: input.sourceSystem,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference,
        sourceThreadId: input.sourceThreadId ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        sourceArtifactId: input.sourceArtifactId ?? null,
        sourceFingerprintSha256: input.sourceFingerprintSha256,
        sourceLocator: input.sourceLocator ?? null,
        sourceSection: input.sourceSection ?? null,
        sourcePage: input.sourcePage ?? null,
        ingestionKey: input.ingestionKey,
        sourceObservedAt: input.sourceObservedAt,
        observedByActorId: session.userId,
        verifiedAt: input.verifiedByCurrentActor ? now : null,
        verifiedByActorId: input.verifiedByCurrentActor ? session.userId : null,
        approvalState: input.verifiedByCurrentActor ? "APPROVED" : "NEEDS_REVIEW",
        approvedAt: input.verifiedByCurrentActor ? now : null,
        approvedByActorId: input.verifiedByCurrentActor ? session.userId : null,
        disclosureState: "INTERNAL_ONLY",
        reviewAfter: input.reviewAfter ?? null,
        expiresAt: input.expiresAt ?? null,
        supersedesEvidenceId: input.supersedesEvidenceId ?? null,
        correctionReason: input.correctionReason ?? null,
        agreementReference: input.contract?.agreementReference ?? null,
        counterparty: input.contract?.counterparty ?? null,
        agreementEffectiveAt: input.contract?.effectiveAt ?? null,
        signatureEvidenceReference: input.contract?.signatureEvidenceReference ?? null,
        amountCents: input.cash?.amountCents ?? null,
        currency: input.cash?.currency ?? null,
        payeeEntityReference: input.cash?.payeeEntityReference ?? null,
        externalTransactionReference: input.cash?.externalTransactionReference ?? null,
        reconciliationState: input.cash?.reconciliationState ?? null,
        retentionReviewAt: input.retentionReviewAt ?? null,
        recordedByActorId: session.userId,
      },
      select: evidenceSelect,
    }) as EvidenceRecord;

    const priorEvidence = (await tx.companyOpportunityEvidence.findMany({
      where: { organizationId: session.organizationId, opportunityId: id },
      select: evidenceSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })) as EvidenceRecord[];
    const evidenceRecords = priorEvidence.some((item) => item.id === createdEvidence.id)
      ? priorEvidence
      : [...priorEvidence, createdEvidence];
    const nextRails = deriveTruthRails(evidenceRecords, now);
    const previousRails = opportunityRails(opportunity);
    const changedRail = railKeys.find((key) => previousRails[key] !== nextRails[key]);

    const updated = await tx.companyExternalOpportunity.updateMany({
      where: { id, organizationId: session.organizationId, version: input.expectedVersion },
      data: {
        version: { increment: 1 },
        qualificationState: nextRails.qualification,
        providerState: nextRails.provider,
        deliveryState: nextRails.delivery,
        responseState: nextRails.response,
        submissionState: nextRails.submission,
        awardState: nextRails.award,
        contractState: nextRails.contract,
        cashState: nextRails.cash,
      },
    });
    if (updated.count !== 1) {
      throw new CompanyOpportunityAccessError(
        "The opportunity changed; reload before recording evidence.",
        409,
      );
    }

    await tx.companyOpportunityEvent.create({
      data: {
        organizationId: session.organizationId,
        opportunityId: id,
        idempotencyKey: `evidence:${input.ingestionKey}`,
        actorId: session.userId,
        eventType: input.supersedesEvidenceId ? "EVIDENCE_SUPERSEDED" : "EVIDENCE_APPENDED",
        expectedVersion: input.expectedVersion,
        resultingVersion: input.expectedVersion + 1,
        railType: changedRail ?? null,
        fromRailState: changedRail ? previousRails[changedRail] : null,
        toRailState: changedRail ? nextRails[changedRail] : null,
        evidenceId: createdEvidence.id,
        reason: input.correctionReason ?? "Evidence appended without inferring unsupported truth.",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: input.supersedesEvidenceId
          ? "company.opportunity_evidence_superseded"
          : "company.opportunity_evidence_appended",
        resourceType: "company_external_opportunity",
        resourceId: id,
        changes: changedRail
          ? { [changedRail]: { from: previousRails[changedRail], to: nextRails[changedRail] } }
          : undefined,
        metadata: {
          evidenceId: createdEvidence.id,
          evidenceType: input.evidenceType,
          claimTruthClass: input.claimTruthClass,
        },
      },
    });

    const persisted = await findOpportunity(tx, session.organizationId, id);
    if (!persisted) throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
    return toCompanyOpportunityDto(persisted, nextRails);
  });
}

export async function transitionCompanyOpportunity(
  session: ClinicSession,
  opportunityId: string,
  rawInput: unknown,
) {
  requireCompanyOpportunityAccess(session, "update");
  const id = safeText(200).parse(opportunityId);
  const input = transitionCompanyOpportunitySchema.parse(rawInput);
  const now = new Date();

  return db.$transaction(async (tx) => {
    await assertActiveCompanyContext(tx, session);
    const lockKey = `company-opportunity:${session.organizationId}:${id}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS "lock"`;

    const existingEvent = await tx.companyOpportunityEvent.findFirst({
      where: {
        organizationId: session.organizationId,
        opportunityId: id,
        idempotencyKey: input.idempotencyKey,
      },
    });
    const opportunity = await findOpportunity(tx, session.organizationId, id);
    if (!opportunity) throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
    if (existingEvent) {
      if (
        existingEvent.expectedVersion !== input.expectedVersion ||
        existingEvent.toLifecycleStage !== input.targetStage ||
        existingEvent.reason !== input.reason
      ) {
        throw new CompanyOpportunityAccessError(
          "This transition idempotency key is already bound to different semantics.",
          409,
        );
      }
      const currentEvidence = (await tx.companyOpportunityEvidence.findMany({
        where: { organizationId: session.organizationId, opportunityId: id },
        select: evidenceSelect,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })) as EvidenceRecord[];
      return toCompanyOpportunityDto(opportunity, deriveTruthRails(currentEvidence, now));
    }

    const evidenceRecords = (await tx.companyOpportunityEvidence.findMany({
      where: { organizationId: session.organizationId, opportunityId: id },
      select: evidenceSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })) as EvidenceRecord[];
    const evaluation = evaluateCompanyOpportunityTransition({
      currentStage: opportunity.lifecycleStage as z.infer<typeof companyOpportunityLifecycleStageSchema>,
      targetStage: input.targetStage,
      expectedVersion: input.expectedVersion,
      actualVersion: opportunity.version,
      evidence: activeEvidence(evidenceRecords, now),
      now,
    });
    if (!evaluation.allowed) {
      throw new CompanyOpportunityAccessError(evaluation.reason, 409);
    }

    const updated = await tx.companyExternalOpportunity.updateMany({
      where: { id, organizationId: session.organizationId, version: input.expectedVersion },
      data: { lifecycleStage: input.targetStage, version: { increment: 1 } },
    });
    if (updated.count !== 1) {
      throw new CompanyOpportunityAccessError(
        "The opportunity changed; reload before applying this transition.",
        409,
      );
    }
    await tx.companyOpportunityEvent.create({
      data: {
        organizationId: session.organizationId,
        opportunityId: id,
        idempotencyKey: input.idempotencyKey,
        actorId: session.userId,
        eventType: "LIFECYCLE_TRANSITIONED",
        expectedVersion: input.expectedVersion,
        resultingVersion: input.expectedVersion + 1,
        fromLifecycleStage: opportunity.lifecycleStage,
        toLifecycleStage: input.targetStage,
        reason: input.reason,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "company.opportunity_transitioned",
        resourceType: "company_external_opportunity",
        resourceId: id,
        changes: { lifecycleStage: { from: opportunity.lifecycleStage, to: input.targetStage } },
        metadata: { expectedVersion: input.expectedVersion, reason: input.reason },
      },
    });
    const persisted = await findOpportunity(tx, session.organizationId, id);
    if (!persisted) throw new CompanyOpportunityAccessError("Company opportunity not found.", 404);
    return toCompanyOpportunityDto(persisted, deriveTruthRails(evidenceRecords, now));
  });
}

export async function recordCompanyOpportunitySymphonyOutcome(
  session: ClinicSession,
  opportunityId: string,
  rawInput: unknown,
) {
  const input = appendCompanyOpportunityEvidenceSchema.parse(rawInput);
  if (![
    "PROVIDER_ACCEPTANCE",
    "PROVIDER_REJECTION",
    "DELIVERY_RECEIPT",
    "DELIVERY_FAILURE",
  ].includes(input.evidenceType)) {
    throw new CompanyOpportunityAccessError(
      "Symphony may record only independent provider or delivery outcome evidence.",
      400,
    );
  }
  return appendCompanyOpportunityEvidence(session, opportunityId, input);
}
