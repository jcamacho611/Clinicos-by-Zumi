-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "careTeamRoomId" TEXT;

-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "careTeamRoomId" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "careTeamRoomId" TEXT;

-- CreateIndex
CREATE INDEX "documents_careTeamRoomId_createdAt_idx" ON "documents"("careTeamRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "message_threads_careTeamRoomId_status_idx" ON "message_threads"("careTeamRoomId", "status");

-- CreateIndex
CREATE INDEX "tasks_careTeamRoomId_status_dueAt_idx" ON "tasks"("careTeamRoomId", "status", "dueAt");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_careTeamRoomId_fkey" FOREIGN KEY ("careTeamRoomId") REFERENCES "care_team_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_careTeamRoomId_fkey" FOREIGN KEY ("careTeamRoomId") REFERENCES "care_team_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_careTeamRoomId_fkey" FOREIGN KEY ("careTeamRoomId") REFERENCES "care_team_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
