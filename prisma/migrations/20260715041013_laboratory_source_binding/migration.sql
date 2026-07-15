-- AlterTable
ALTER TABLE "lab_results" ADD COLUMN     "integrationId" TEXT,
ADD COLUMN     "sourceDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "lab_results_integrationId_sourceType_idx" ON "lab_results"("integrationId", "sourceType");

-- CreateIndex
CREATE INDEX "lab_results_sourceDocumentId_idx" ON "lab_results"("sourceDocumentId");
