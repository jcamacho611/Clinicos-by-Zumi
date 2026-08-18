-- Luxe customer payment evidence is intentionally separate from Klinikos SaaS/commercial checkout evidence.
-- The unique provider reference prevents the same external payment from being attributed twice within one organization.
CREATE TABLE "luxe_lead_payment_evidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalReference" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentKind" TEXT NOT NULL,
    "evidenceSource" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "processorVerified" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "actorId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "luxe_lead_payment_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "luxe_lead_payment_evidence_amount_check" CHECK ("amountCents" > 0),
    CONSTRAINT "luxe_lead_payment_evidence_currency_check" CHECK ("currency" = 'USD'),
    CONSTRAINT "luxe_lead_payment_evidence_verification_check" CHECK (
      ("verificationMethod" = 'manual_reconciliation' AND "processorVerified" = false)
      OR ("verificationMethod" = 'processor_verification' AND "processorVerified" = true)
    )
);

CREATE UNIQUE INDEX "luxe_lead_payment_evidence_org_provider_ref_key"
ON "luxe_lead_payment_evidence"("organizationId", "provider", "externalReference");

CREATE INDEX "luxe_lead_payment_evidence_org_lead_received_idx"
ON "luxe_lead_payment_evidence"("organizationId", "leadId", "receivedAt");

CREATE INDEX "luxe_lead_payment_evidence_org_received_idx"
ON "luxe_lead_payment_evidence"("organizationId", "receivedAt");

ALTER TABLE "luxe_lead_payment_evidence"
ADD CONSTRAINT "luxe_lead_payment_evidence_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "luxe_lead_payment_evidence"
ADD CONSTRAINT "luxe_lead_payment_evidence_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "luxe_lead_payment_evidence"
ADD CONSTRAINT "luxe_lead_payment_evidence_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
