-- First-party Klinikos Company OS opportunity evidence ledger.
--
-- This additive migration creates one platform-organization-scoped opportunity
-- aggregate with append-oriented evidence and events. It does not alter clinical
-- messages, documents, tasks, patients, or customer-clinic data.

CREATE TABLE "company_external_opportunities" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "operatingScope" TEXT NOT NULL DEFAULT 'KLINIKOS_COMPANY_OS',
  "version" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "opportunityClass" TEXT NOT NULL,
  "targetClass" TEXT NOT NULL,
  "targetOrganizationName" TEXT NOT NULL,
  "targetOrganizationDomain" TEXT,
  "purpose" TEXT NOT NULL,
  "ask" TEXT,
  "lifecycleStage" TEXT NOT NULL DEFAULT 'DISCOVERED',
  "qualificationState" TEXT NOT NULL DEFAULT 'UNQUALIFIED',
  "providerState" TEXT NOT NULL DEFAULT 'UNPROVEN',
  "deliveryState" TEXT NOT NULL DEFAULT 'UNPROVEN',
  "responseState" TEXT NOT NULL DEFAULT 'UNPROVEN',
  "submissionState" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "awardState" TEXT NOT NULL DEFAULT 'UNPROVEN',
  "contractState" TEXT NOT NULL DEFAULT 'UNPROVEN',
  "cashState" TEXT NOT NULL DEFAULT 'UNPROVEN',
  "ownerId" TEXT,
  "deadlineAt" TIMESTAMP(3),
  "nextAction" TEXT,
  "nextActionDueAt" TIMESTAMP(3),
  "blocker" TEXT,
  "sourceSystem" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "sourceFingerprintSha256" TEXT NOT NULL,
  "sourceObservedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_external_opportunities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_external_opportunities_scope_check"
    CHECK ("operatingScope" = 'KLINIKOS_COMPANY_OS'),
  CONSTRAINT "company_external_opportunities_version_check"
    CHECK ("version" > 0),
  CONSTRAINT "company_external_opportunities_minimized_text_length_check"
    CHECK (
      char_length(btrim("title")) BETWEEN 1 AND 240 AND
      char_length(btrim("targetOrganizationName")) BETWEEN 1 AND 300 AND
      char_length(btrim("purpose")) BETWEEN 1 AND 1200 AND
      ("ask" IS NULL OR char_length(btrim("ask")) BETWEEN 1 AND 1200) AND
      ("nextAction" IS NULL OR char_length(btrim("nextAction")) BETWEEN 1 AND 600) AND
      ("blocker" IS NULL OR char_length(btrim("blocker")) BETWEEN 1 AND 600) AND
      char_length(btrim("sourceSystem")) BETWEEN 1 AND 120
    ),
  CONSTRAINT "company_external_opportunities_single_line_check"
    CHECK (
      "title" !~ E'[\\r\\n]' AND
      "targetOrganizationName" !~ E'[\\r\\n]' AND
      "purpose" !~ E'[\\r\\n]' AND
      ("ask" IS NULL OR "ask" !~ E'[\\r\\n]') AND
      ("nextAction" IS NULL OR "nextAction" !~ E'[\\r\\n]') AND
      ("blocker" IS NULL OR "blocker" !~ E'[\\r\\n]') AND
      "sourceSystem" !~ E'[\\r\\n]'
    ),
  CONSTRAINT "company_external_opportunities_sensitive_synopsis_check"
    CHECK (
      "title" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]' AND
      "targetOrganizationName" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]' AND
      "purpose" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]' AND
      ("ask" IS NULL OR "ask" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]') AND
      ("nextAction" IS NULL OR "nextAction" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]') AND
      ("blocker" IS NULL OR "blocker" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]') AND
      "sourceSystem" !~* '^(from|to|cc|bcc|subject|date|message-id|reply-to):|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|authorization|bearer|password)[[:space:]]*[:=]'
    ),
  CONSTRAINT "company_external_opportunities_lifecycle_check"
    CHECK ("lifecycleStage" IN (
      'DISCOVERED', 'FIT_REVIEW', 'QUALIFIED', 'CONTACT_PREPARATION',
      'CONTACT_IN_PROGRESS', 'AWAITING_RESPONSE', 'RESPONSE_RECEIVED',
      'APPLICATION_PREPARATION', 'APPLICATION_SUBMITTED', 'DILIGENCE',
      'DECISION_PENDING', 'AWARDED', 'CONTRACTING', 'IMPLEMENTATION',
      'NOT_A_FIT', 'DECLINED', 'CLOSED'
    )),
  CONSTRAINT "company_external_opportunities_qualification_check"
    CHECK ("qualificationState" IN ('UNQUALIFIED', 'QUALIFIED', 'STALE', 'DISQUALIFIED')),
  CONSTRAINT "company_external_opportunities_provider_check"
    CHECK ("providerState" IN ('UNPROVEN', 'ACCEPTED', 'REJECTED', 'REVOKED', 'RECONCILIATION_REQUIRED')),
  CONSTRAINT "company_external_opportunities_delivery_check"
    CHECK ("deliveryState" IN ('UNPROVEN', 'DELIVERED', 'FAILED', 'BOUNCED', 'DISPUTED', 'RECONCILIATION_REQUIRED')),
  CONSTRAINT "company_external_opportunities_response_check"
    CHECK ("responseState" IN ('UNPROVEN', 'RECEIVED', 'NO_RESPONSE', 'DISPUTED')),
  CONSTRAINT "company_external_opportunities_submission_check"
    CHECK ("submissionState" IN ('NOT_STARTED', 'PREPARING', 'SUBMITTED', 'REJECTED', 'WITHDRAWN', 'DISPUTED')),
  CONSTRAINT "company_external_opportunities_award_check"
    CHECK ("awardState" IN ('UNPROVEN', 'AWARDED', 'DECLINED', 'WITHDRAWN', 'DISPUTED')),
  CONSTRAINT "company_external_opportunities_contract_check"
    CHECK ("contractState" IN ('UNPROVEN', 'PROPOSED', 'EXECUTED', 'EXPIRED', 'TERMINATED', 'DISPUTED')),
  CONSTRAINT "company_external_opportunities_cash_check"
    CHECK ("cashState" IN ('UNPROVEN', 'PENDING', 'RECEIVED', 'REVERSED', 'DISPUTED', 'RECONCILIATION_REQUIRED')),
  CONSTRAINT "company_external_opportunities_fingerprint_check"
    CHECK ("sourceFingerprintSha256" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "company_external_opportunities_source_type_check"
    CHECK ("sourceType" IN (
      'OUTLOOK_SUMMARY', 'OUTLOOK_MESSAGE', 'ATTACHMENT', 'AUTHORITATIVE_RECORD',
      'EXECUTED_DOCUMENT', 'PORTAL_RECEIPT', 'EMAIL_PROVIDER_RECEIPT',
      'PAYMENT_PROCESSOR', 'BANK_RECORD', 'ACCOUNTING_RECORD', 'OFFICIAL_NOTICE',
      'INTERNAL_OBSERVATION', 'OTHER_REVIEW_REQUIRED'
    ))
  ,CONSTRAINT "company_external_opportunities_source_reference_check"
    CHECK (
      char_length("sourceReference") <= 2048 AND
      "sourceReference" !~ '[[:space:]?&@%]' AND (
        ("sourceType" = 'OUTLOOK_SUMMARY' AND "sourceReference" ~ '^outlook-summary://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'OUTLOOK_MESSAGE' AND "sourceReference" ~ '^outlook-message://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'ATTACHMENT' AND "sourceReference" ~ '^attachment-sha256://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'AUTHORITATIVE_RECORD' AND "sourceReference" ~ '^authoritative-record://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'EXECUTED_DOCUMENT' AND "sourceReference" ~ '^executed-document-sha256://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'PORTAL_RECEIPT' AND "sourceReference" ~ '^portal-receipt://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'EMAIL_PROVIDER_RECEIPT' AND "sourceReference" ~ '^email-provider-receipt://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'PAYMENT_PROCESSOR' AND "sourceReference" ~ '^payment-processor://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'BANK_RECORD' AND "sourceReference" ~ '^bank-record://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'ACCOUNTING_RECORD' AND "sourceReference" ~ '^accounting-record://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'OFFICIAL_NOTICE' AND "sourceReference" ~ '^official-notice://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'INTERNAL_OBSERVATION' AND "sourceReference" ~ '^internal-observation://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'OTHER_REVIEW_REQUIRED' AND "sourceReference" ~ '^review-required://[A-Za-z0-9._~:/#=-]+$')
      )
    )
);

CREATE TABLE "company_opportunity_evidence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "claimKey" TEXT NOT NULL,
  "claimText" TEXT NOT NULL,
  "truthClass" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "sourceThreadId" TEXT,
  "sourceMessageId" TEXT,
  "sourceArtifactId" TEXT,
  "sourceFingerprintSha256" TEXT NOT NULL,
  "sourceLocator" TEXT,
  "sourceSection" TEXT,
  "sourcePage" INTEGER,
  "ingestionKey" TEXT NOT NULL,
  "sourceObservedAt" TIMESTAMP(3) NOT NULL,
  "observedByActorId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByActorId" TEXT,
  "approvalState" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  "approvedAt" TIMESTAMP(3),
  "approvedByActorId" TEXT,
  "disclosureState" TEXT NOT NULL DEFAULT 'INTERNAL_ONLY',
  "reviewAfter" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "supersedesEvidenceId" TEXT,
  "correctionReason" TEXT,
  "agreementReference" TEXT,
  "counterparty" TEXT,
  "agreementEffectiveAt" TIMESTAMP(3),
  "signatureEvidenceReference" TEXT,
  "amountCents" INTEGER,
  "currency" TEXT,
  "payeeEntityReference" TEXT,
  "externalTransactionReference" TEXT,
  "reconciliationState" TEXT,
  "retentionPolicyKey" TEXT NOT NULL DEFAULT 'company_opportunity_evidence',
  "retentionReviewAt" TIMESTAMP(3),
  "legalHoldAt" TIMESTAMP(3),
  "tombstonedAt" TIMESTAMP(3),
  "recordedByActorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_opportunity_evidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_opportunity_evidence_truth_check"
    CHECK ("truthClass" IN ('ACTUAL', 'CONTRACTED', 'PIPELINE', 'ASSUMPTION', 'SCENARIO', 'TARGET')),
  CONSTRAINT "company_opportunity_evidence_type_check"
    CHECK ("evidenceType" IN (
      'OBSERVED_SOURCE', 'QUALIFIED_PIPELINE', 'PROVIDER_ACCEPTANCE',
      'PROVIDER_REJECTION', 'DELIVERY_RECEIPT', 'DELIVERY_FAILURE',
      'RESPONSE_RECEIPT', 'SUBMISSION_RECEIPT', 'SUBMISSION_REJECTION',
      'AWARD_NOTICE', 'DECLINE_NOTICE', 'EXECUTED_AGREEMENT',
      'CONTRACT_TERMINATION', 'PAYMENT_SETTLEMENT', 'PAYMENT_REVERSAL',
      'EVIDENCE_CORRECTION', 'OTHER_REVIEW_REQUIRED'
    )),
  CONSTRAINT "company_opportunity_evidence_source_type_check"
    CHECK ("sourceType" IN (
      'OUTLOOK_SUMMARY', 'OUTLOOK_MESSAGE', 'ATTACHMENT', 'AUTHORITATIVE_RECORD',
      'EXECUTED_DOCUMENT', 'PORTAL_RECEIPT', 'EMAIL_PROVIDER_RECEIPT',
      'PAYMENT_PROCESSOR', 'BANK_RECORD', 'ACCOUNTING_RECORD', 'OFFICIAL_NOTICE',
      'INTERNAL_OBSERVATION', 'OTHER_REVIEW_REQUIRED'
    )),
  CONSTRAINT "company_opportunity_evidence_source_reference_check"
    CHECK (
      "sourceReference" !~ '[[:space:]?&@%]' AND (
        ("sourceType" = 'OUTLOOK_SUMMARY' AND "sourceReference" ~ '^outlook-summary://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'OUTLOOK_MESSAGE' AND "sourceReference" ~ '^outlook-message://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'ATTACHMENT' AND "sourceReference" ~ '^attachment-sha256://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'AUTHORITATIVE_RECORD' AND "sourceReference" ~ '^authoritative-record://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'EXECUTED_DOCUMENT' AND "sourceReference" ~ '^executed-document-sha256://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'PORTAL_RECEIPT' AND "sourceReference" ~ '^portal-receipt://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'EMAIL_PROVIDER_RECEIPT' AND "sourceReference" ~ '^email-provider-receipt://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'PAYMENT_PROCESSOR' AND "sourceReference" ~ '^payment-processor://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'BANK_RECORD' AND "sourceReference" ~ '^bank-record://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'ACCOUNTING_RECORD' AND "sourceReference" ~ '^accounting-record://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'OFFICIAL_NOTICE' AND "sourceReference" ~ '^official-notice://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'INTERNAL_OBSERVATION' AND "sourceReference" ~ '^internal-observation://[A-Za-z0-9._~:/#=-]+$') OR
        ("sourceType" = 'OTHER_REVIEW_REQUIRED' AND "sourceReference" ~ '^review-required://[A-Za-z0-9._~:/#=-]+$')
      )
    ),
  CONSTRAINT "company_opportunity_evidence_minimized_text_check"
    CHECK (
      char_length("claimKey") <= 200 AND "claimKey" !~ E'[\r\n]' AND
      char_length("claimText") <= 600 AND "claimText" !~ E'[\r\n]' AND
      char_length("sourceReference") <= 2048 AND
      ("sourceLocator" IS NULL OR (
        char_length("sourceLocator") <= 1000 AND
        "sourceLocator" !~ E'[\r\n?&@]' AND
        "sourceLocator" !~* '^(https?|ftp|file):'
      ))
    ),
  CONSTRAINT "company_opportunity_evidence_fingerprint_check"
    CHECK ("sourceFingerprintSha256" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "company_opportunity_evidence_verification_pair_check"
    CHECK (("verifiedAt" IS NULL) = ("verifiedByActorId" IS NULL)),
  CONSTRAINT "company_opportunity_evidence_approval_check"
    CHECK (
      ("approvalState" = 'NEEDS_REVIEW' AND "approvedAt" IS NULL AND "approvedByActorId" IS NULL) OR
      ("approvalState" IN ('APPROVED', 'REJECTED', 'REVOKED') AND
       "approvedAt" IS NOT NULL AND "approvedByActorId" IS NOT NULL)
    ),
  CONSTRAINT "company_opportunity_evidence_approved_verification_check"
    CHECK (
      "approvalState" <> 'APPROVED' OR
      ("verifiedAt" IS NOT NULL AND "verifiedByActorId" IS NOT NULL)
    ),
  CONSTRAINT "company_opportunity_evidence_temporal_check"
    CHECK (
      ("verifiedAt" IS NULL OR "verifiedAt" >= "sourceObservedAt") AND
      ("reviewAfter" IS NULL OR "reviewAfter" >= "sourceObservedAt") AND
      ("expiresAt" IS NULL OR "expiresAt" > "sourceObservedAt")
    ),
  CONSTRAINT "company_opportunity_evidence_disclosure_check"
    CHECK ("disclosureState" IN ('INTERNAL_ONLY', 'APPROVED_EXTERNAL', 'RESTRICTED')),
  CONSTRAINT "company_opportunity_evidence_source_page_check"
    CHECK ("sourcePage" IS NULL OR "sourcePage" > 0),
  CONSTRAINT "company_opportunity_evidence_amount_check"
    CHECK ("amountCents" IS NULL OR "amountCents" > 0),
  CONSTRAINT "company_opportunity_evidence_currency_check"
    CHECK ("currency" IS NULL OR "currency" ~ '^[A-Z]{3}$'),
  CONSTRAINT "company_opportunity_evidence_contract_fields_check"
    CHECK (
      (
        "evidenceType" IN ('EXECUTED_AGREEMENT', 'CONTRACT_TERMINATION') AND
        "agreementReference" IS NOT NULL AND btrim("agreementReference") <> '' AND
        "counterparty" IS NOT NULL AND btrim("counterparty") <> '' AND
        "agreementEffectiveAt" IS NOT NULL AND
        "signatureEvidenceReference" IS NOT NULL AND btrim("signatureEvidenceReference") <> ''
      ) OR (
        "evidenceType" NOT IN ('EXECUTED_AGREEMENT', 'CONTRACT_TERMINATION') AND
        "agreementReference" IS NULL AND "counterparty" IS NULL AND
        "agreementEffectiveAt" IS NULL AND "signatureEvidenceReference" IS NULL
      )
    ),
  CONSTRAINT "company_opportunity_evidence_cash_fields_check"
    CHECK (
      (
        "evidenceType" = 'PAYMENT_SETTLEMENT' AND
        "amountCents" IS NOT NULL AND "amountCents" > 0 AND
        "currency" IS NOT NULL AND
        "payeeEntityReference" IS NOT NULL AND btrim("payeeEntityReference") <> '' AND
        "externalTransactionReference" IS NOT NULL AND btrim("externalTransactionReference") <> '' AND
        "reconciliationState" = 'SETTLED'
      ) OR (
        "evidenceType" = 'PAYMENT_REVERSAL' AND
        "amountCents" IS NOT NULL AND "amountCents" > 0 AND
        "currency" IS NOT NULL AND
        "payeeEntityReference" IS NOT NULL AND btrim("payeeEntityReference") <> '' AND
        "externalTransactionReference" IS NOT NULL AND btrim("externalTransactionReference") <> '' AND
        "reconciliationState" = 'REVERSED'
      ) OR (
        "evidenceType" NOT IN ('PAYMENT_SETTLEMENT', 'PAYMENT_REVERSAL') AND
        "amountCents" IS NULL AND "currency" IS NULL AND
        "payeeEntityReference" IS NULL AND "externalTransactionReference" IS NULL AND
        "reconciliationState" IS NULL
      )
    ),
  CONSTRAINT "company_opportunity_evidence_reconciliation_check"
    CHECK ("reconciliationState" IS NULL OR "reconciliationState" IN ('SETTLED', 'REVERSED')),
  CONSTRAINT "company_opportunity_evidence_correction_fields_check"
    CHECK (
      (
        "evidenceType" = 'EVIDENCE_CORRECTION' AND
        "supersedesEvidenceId" IS NOT NULL AND
        "correctionReason" IS NOT NULL AND btrim("correctionReason") <> '' AND
        "verifiedAt" IS NOT NULL AND "verifiedByActorId" IS NOT NULL AND
        "approvalState" = 'APPROVED' AND "expiresAt" IS NULL
      ) OR (
        "evidenceType" <> 'EVIDENCE_CORRECTION' AND
        "supersedesEvidenceId" IS NULL AND "correctionReason" IS NULL
      )
    ),
  CONSTRAINT "company_opportunity_evidence_no_self_supersession_check"
    CHECK ("supersedesEvidenceId" IS NULL OR "supersedesEvidenceId" <> "id")
);

CREATE TABLE "company_opportunity_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "actorId" TEXT,
  "eventType" TEXT NOT NULL,
  "expectedVersion" INTEGER NOT NULL,
  "resultingVersion" INTEGER NOT NULL,
  "fromLifecycleStage" TEXT,
  "toLifecycleStage" TEXT,
  "railType" TEXT,
  "fromRailState" TEXT,
  "toRailState" TEXT,
  "evidenceId" TEXT,
  "reason" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_opportunity_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_opportunity_events_type_check"
    CHECK ("eventType" IN (
      'OPPORTUNITY_CREATED', 'EVIDENCE_APPENDED', 'EVIDENCE_SUPERSEDED',
      'LIFECYCLE_TRANSITIONED', 'RAIL_RECOMPUTED',
      'SYMPHONY_OUTCOME_RECORDED', 'REVIEW_REQUIRED'
    )),
  CONSTRAINT "company_opportunity_events_version_check"
    CHECK ("expectedVersion" >= 0 AND "resultingVersion" = "expectedVersion" + 1),
  CONSTRAINT "company_opportunity_events_rail_check"
    CHECK ("railType" IS NULL OR "railType" IN (
      'qualification', 'provider', 'delivery', 'response',
      'submission', 'award', 'contract', 'cash'
    ))
);

CREATE UNIQUE INDEX "company_external_opportunities_organization_id_key"
  ON "company_external_opportunities"("organizationId", "id");

CREATE UNIQUE INDEX "company_external_opportunities_source_fingerprint_key"
  ON "company_external_opportunities"("organizationId", "sourceSystem", "sourceFingerprintSha256");

CREATE INDEX "company_external_opportunities_stage_deadline_idx"
  ON "company_external_opportunities"("organizationId", "lifecycleStage", "deadlineAt");

CREATE INDEX "company_external_opportunities_qualification_updated_idx"
  ON "company_external_opportunities"("organizationId", "qualificationState", "updatedAt");

CREATE INDEX "company_external_opportunities_owner_stage_idx"
  ON "company_external_opportunities"("ownerId", "lifecycleStage");

CREATE UNIQUE INDEX "company_opportunity_evidence_organization_opportunity_id_key"
  ON "company_opportunity_evidence"("organizationId", "opportunityId", "id");

CREATE UNIQUE INDEX "company_opportunity_evidence_ingestion_key"
  ON "company_opportunity_evidence"("organizationId", "opportunityId", "ingestionKey");

CREATE UNIQUE INDEX "company_opportunity_evidence_single_supersession_key"
  ON "company_opportunity_evidence"("organizationId", "opportunityId", "supersedesEvidenceId");

CREATE INDEX "company_opportunity_evidence_claim_created_idx"
  ON "company_opportunity_evidence"("organizationId", "opportunityId", "claimKey", "createdAt");

CREATE INDEX "company_opportunity_evidence_review_expiry_idx"
  ON "company_opportunity_evidence"("organizationId", "reviewAfter", "expiresAt");

CREATE INDEX "company_opportunity_evidence_supersedes_idx"
  ON "company_opportunity_evidence"("organizationId", "opportunityId", "supersedesEvidenceId");

CREATE INDEX "company_opportunity_evidence_source_message_idx"
  ON "company_opportunity_evidence"("sourceSystem", "sourceThreadId", "sourceMessageId");

CREATE UNIQUE INDEX "company_opportunity_events_idempotency_key"
  ON "company_opportunity_events"("organizationId", "opportunityId", "idempotencyKey");

CREATE INDEX "company_opportunity_events_occurred_idx"
  ON "company_opportunity_events"("organizationId", "opportunityId", "occurredAt");

CREATE INDEX "company_opportunity_events_evidence_idx"
  ON "company_opportunity_events"("organizationId", "opportunityId", "evidenceId");

ALTER TABLE "company_external_opportunities"
  ADD CONSTRAINT "company_external_opportunities_organization_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_external_opportunities"
  ADD CONSTRAINT "company_external_opportunities_owner_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_external_opportunities"
  ADD CONSTRAINT "company_external_opportunities_creator_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_evidence"
  ADD CONSTRAINT "company_opportunity_evidence_opportunity_fkey"
  FOREIGN KEY ("organizationId", "opportunityId")
  REFERENCES "company_external_opportunities"("organizationId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_evidence"
  ADD CONSTRAINT "company_opportunity_evidence_supersedes_fkey"
  FOREIGN KEY ("organizationId", "opportunityId", "supersedesEvidenceId")
  REFERENCES "company_opportunity_evidence"("organizationId", "opportunityId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_evidence"
  ADD CONSTRAINT "company_opportunity_evidence_observer_fkey"
  FOREIGN KEY ("observedByActorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_evidence"
  ADD CONSTRAINT "company_opportunity_evidence_verifier_fkey"
  FOREIGN KEY ("verifiedByActorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_evidence"
  ADD CONSTRAINT "company_opportunity_evidence_approver_fkey"
  FOREIGN KEY ("approvedByActorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_evidence"
  ADD CONSTRAINT "company_opportunity_evidence_recorder_fkey"
  FOREIGN KEY ("recordedByActorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_events"
  ADD CONSTRAINT "company_opportunity_events_opportunity_fkey"
  FOREIGN KEY ("organizationId", "opportunityId")
  REFERENCES "company_external_opportunities"("organizationId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_events"
  ADD CONSTRAINT "company_opportunity_events_evidence_fkey"
  FOREIGN KEY ("organizationId", "opportunityId", "evidenceId")
  REFERENCES "company_opportunity_evidence"("organizationId", "opportunityId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_opportunity_events"
  ADD CONSTRAINT "company_opportunity_events_actor_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
