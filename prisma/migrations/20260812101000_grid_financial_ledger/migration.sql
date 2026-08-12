-- Negotiated location compensation is a transaction term. The Klinikos platform fee is resolved separately from server-owned policy.
ALTER TABLE "GridOfferRecord"
ADD COLUMN "locationPayableCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "GridReservationRecord"
ADD COLUMN "locationPayableCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "GridFeePolicyRecord" (
    "id" TEXT NOT NULL,
    "scopeKind" TEXT NOT NULL,
    "scopeValue" TEXT,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 0,
    "platformFeeFlatCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridFeePolicyRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridFeePolicyRecord_scopeKind_status_idx"
ON "GridFeePolicyRecord"("scopeKind", "status");

CREATE UNIQUE INDEX "GridFeePolicyRecord_one_active_scope_idx"
ON "GridFeePolicyRecord"("scopeKind", COALESCE("scopeValue", ''))
WHERE "status" = 'active';

CREATE TABLE "GridFinancialObligationRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "obligationType" TEXT NOT NULL,
    "beneficiaryType" TEXT NOT NULL,
    "beneficiaryReference" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridFinancialObligationRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridFinancialObligationRecord_reservationId_status_idx"
ON "GridFinancialObligationRecord"("reservationId", "status");

CREATE INDEX "GridFinancialObligationRecord_beneficiary_idx"
ON "GridFinancialObligationRecord"("beneficiaryType", "beneficiaryReference", "status");

CREATE UNIQUE INDEX "GridFinancialObligationRecord_unique_line_idx"
ON "GridFinancialObligationRecord"("reservationId", "obligationType", COALESCE("beneficiaryReference", ''));

ALTER TABLE "GridFinancialObligationRecord"
ADD CONSTRAINT "GridFinancialObligationRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridFinancialObligationRecord"
ADD CONSTRAINT "GridFinancialObligationRecord_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "GridReservationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GridSettlementEventRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "externalReference" TEXT,
    "note" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridSettlementEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridSettlementEventRecord_obligationId_createdAt_idx"
ON "GridSettlementEventRecord"("obligationId", "createdAt");

ALTER TABLE "GridSettlementEventRecord"
ADD CONSTRAINT "GridSettlementEventRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridSettlementEventRecord"
ADD CONSTRAINT "GridSettlementEventRecord_obligationId_fkey"
FOREIGN KEY ("obligationId") REFERENCES "GridFinancialObligationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
