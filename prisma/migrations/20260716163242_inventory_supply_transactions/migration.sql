-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "coldChain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "controlledItem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recallStatus" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "vendor" TEXT;

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "direction" TEXT,
    "note" TEXT NOT NULL,
    "patientId" TEXT,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "actorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_transactions_organizationId_inventoryItemId_type__idx" ON "inventory_transactions"("organizationId", "inventoryItemId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_transactions_organizationId_patientId_createdAt_idx" ON "inventory_transactions"("organizationId", "patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
