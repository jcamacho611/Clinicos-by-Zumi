-- CreateTable
CREATE TABLE "network_invitations" (
    "id" TEXT NOT NULL,
    "invitingOrganizationId" TEXT NOT NULL,
    "targetOrganizationId" TEXT,
    "inviteeType" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "inviteeEmail" TEXT,
    "specialty" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "requestedBy" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "network_invitations_invitingOrganizationId_status_createdAt_idx" ON "network_invitations"("invitingOrganizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "network_invitations_targetOrganizationId_status_createdAt_idx" ON "network_invitations"("targetOrganizationId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "network_invitations" ADD CONSTRAINT "network_invitations_invitingOrganizationId_fkey" FOREIGN KEY ("invitingOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_invitations" ADD CONSTRAINT "network_invitations_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
