CREATE TABLE "access_gate_acceptances" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "source" TEXT NOT NULL DEFAULT 'web-access-gate',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_gate_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_gate_acceptances_email_documentKey_idx" ON "access_gate_acceptances"("email", "documentKey");
CREATE INDEX "access_gate_acceptances_acceptedAt_idx" ON "access_gate_acceptances"("acceptedAt");
