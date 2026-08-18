-- Luxe booking evidence is intentionally separate from lead assertions, payment evidence,
-- treatment state, and appointment fulfillment. A unique provider reference prevents the
-- same authoritative booking from being attached to multiple leads inside one organization.
CREATE TABLE "luxe_lead_booking_evidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalReference" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "evidenceSource" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "sourceVerified" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "actorId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "luxe_lead_booking_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "luxe_lead_booking_evidence_verification_check" CHECK (
      ("verificationMethod" = 'manual_reconciliation' AND "sourceVerified" = true)
      OR ("verificationMethod" = 'processor_verification' AND "sourceVerified" = true)
    )
);

CREATE UNIQUE INDEX "luxe_lead_booking_evidence_org_provider_ref_key"
ON "luxe_lead_booking_evidence"("organizationId", "provider", "externalReference");

CREATE INDEX "luxe_lead_booking_evidence_org_lead_scheduled_idx"
ON "luxe_lead_booking_evidence"("organizationId", "leadId", "scheduledAt");

ALTER TABLE "luxe_lead_booking_evidence"
ADD CONSTRAINT "luxe_lead_booking_evidence_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "luxe_lead_booking_evidence"
ADD CONSTRAINT "luxe_lead_booking_evidence_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "luxe_lead_booking_evidence"
ADD CONSTRAINT "luxe_lead_booking_evidence_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
