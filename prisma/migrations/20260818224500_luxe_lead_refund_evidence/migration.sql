-- Signed processor refund evidence is separate from gross payment evidence.
-- Stripe charge.refunded events report the cumulative refunded amount on a Charge,
-- so one provider+charge row is updated monotonically rather than counted repeatedly.
CREATE TABLE "luxe_lead_refund_evidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalReference" TEXT NOT NULL,
    "paymentExternalReference" TEXT,
    "amountRefundedCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "evidenceSource" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "processorVerified" BOOLEAN NOT NULL DEFAULT true,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "luxe_lead_refund_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "luxe_lead_refund_evidence_amount_check" CHECK ("amountRefundedCents" > 0),
    CONSTRAINT "luxe_lead_refund_evidence_currency_check" CHECK ("currency" = 'USD'),
    CONSTRAINT "luxe_lead_refund_evidence_verification_check" CHECK (
      "verificationMethod" = 'processor_verification' AND "processorVerified" = true
    )
);

CREATE UNIQUE INDEX "luxe_lead_refund_evidence_org_provider_ref_key"
ON "luxe_lead_refund_evidence"("organizationId", "provider", "externalReference");

CREATE INDEX "luxe_lead_refund_evidence_org_lead_received_idx"
ON "luxe_lead_refund_evidence"("organizationId", "leadId", "receivedAt");

ALTER TABLE "luxe_lead_refund_evidence"
ADD CONSTRAINT "luxe_lead_refund_evidence_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "luxe_lead_refund_evidence"
ADD CONSTRAINT "luxe_lead_refund_evidence_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
