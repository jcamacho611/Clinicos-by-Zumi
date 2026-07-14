-- AlterTable
ALTER TABLE "access_grants" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "downloadAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "revocationReason" TEXT,
ADD COLUMN     "revokedBy" TEXT;

-- AlterTable
ALTER TABLE "record_requests" ADD COLUMN     "approvedGrantId" TEXT,
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "access_grants_requestId_idx" ON "access_grants"("requestId");
