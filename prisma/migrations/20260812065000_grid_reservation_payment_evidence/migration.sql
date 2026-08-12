ALTER TABLE "GridReservationRecord"
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paymentRecordedAt" TIMESTAMP(3),
ADD COLUMN "paymentRecordedBy" TEXT;

CREATE INDEX "GridReservationRecord_paymentStatus_idx"
ON "GridReservationRecord"("paymentStatus");
