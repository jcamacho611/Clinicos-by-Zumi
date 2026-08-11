-- Klinikos Growth Engine: prospects, first-party intent, follow-up sequences, referrals.
-- Describes prospective buyers of software. No field is intended to hold PHI.

CREATE TABLE "growth_prospects" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "clinicType" TEXT NOT NULL,
    "locationCount" TEXT NOT NULL,
    "providerCount" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "band" TEXT NOT NULL DEFAULT 'cold',
    "interest" TEXT NOT NULL DEFAULT 'overview',
    "referralCode" TEXT,
    "organizationId" TEXT,
    "internalNote" TEXT,
    "unsubscribedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_prospects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_prospects_email_key" ON "growth_prospects"("email");
CREATE INDEX "growth_prospects_status_score_idx" ON "growth_prospects"("status", "score");
CREATE INDEX "growth_prospects_band_lastActivityAt_idx" ON "growth_prospects"("band", "lastActivityAt");
CREATE INDEX "growth_prospects_referralCode_idx" ON "growth_prospects"("referralCode");

CREATE TABLE "growth_intent_events" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT,
    "visitorId" TEXT,
    "eventType" TEXT NOT NULL,
    "path" TEXT,
    "subject" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_intent_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_intent_events_prospectId_occurredAt_idx" ON "growth_intent_events"("prospectId", "occurredAt");
CREATE INDEX "growth_intent_events_visitorId_occurredAt_idx" ON "growth_intent_events"("visitorId", "occurredAt");
CREATE INDEX "growth_intent_events_eventType_occurredAt_idx" ON "growth_intent_events"("eventType", "occurredAt");

CREATE TABLE "growth_sequence_enrollments" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "sequenceKey" TEXT NOT NULL,
    "nextStepIndex" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_sequence_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_sequence_enrollments_prospectId_sequenceKey_key" ON "growth_sequence_enrollments"("prospectId", "sequenceKey");
CREATE INDEX "growth_sequence_enrollments_sequenceKey_nextStepIndex_idx" ON "growth_sequence_enrollments"("sequenceKey", "nextStepIndex");

CREATE TABLE "growth_referral_partners" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationName" TEXT,
    "email" TEXT NOT NULL,
    "rateBasisPoints" INTEGER NOT NULL DEFAULT 1500,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_referral_partners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_referral_partners_code_key" ON "growth_referral_partners"("code");
CREATE INDEX "growth_referral_partners_status_idx" ON "growth_referral_partners"("status");

CREATE TABLE "growth_referral_attributions" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "prospectId" TEXT,
    "visitorId" TEXT,
    "firstTouchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "saleAmountCents" INTEGER,
    "commissionCents" INTEGER,
    "commissionStatus" TEXT NOT NULL DEFAULT 'pending',
    "saleSettled" BOOLEAN NOT NULL DEFAULT false,
    "refundWindowClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_referral_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_referral_attributions_partnerId_prospectId_key" ON "growth_referral_attributions"("partnerId", "prospectId");
CREATE INDEX "growth_referral_attributions_partnerId_commissionStatus_idx" ON "growth_referral_attributions"("partnerId", "commissionStatus");

ALTER TABLE "growth_intent_events" ADD CONSTRAINT "growth_intent_events_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_sequence_enrollments" ADD CONSTRAINT "growth_sequence_enrollments_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_referral_attributions" ADD CONSTRAINT "growth_referral_attributions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "growth_referral_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
