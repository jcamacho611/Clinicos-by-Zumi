CREATE TABLE "KlinikosPathInstance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "pathId" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "currentNodeId" TEXT,
  "completedNodeIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "blockedNodeIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "blockers" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "context" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KlinikosPathInstance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KlinikosPathInstance_status_check" CHECK ("status" IN ('active','blocked','completed','cancelled','paused'))
);

CREATE INDEX "KlinikosPathInstance_actor_org_status_idx"
  ON "KlinikosPathInstance"("actorId", "organizationId", "status");
CREATE INDEX "KlinikosPathInstance_path_actor_idx"
  ON "KlinikosPathInstance"("pathId", "actorId");
CREATE INDEX "KlinikosPathInstance_activity_idx"
  ON "KlinikosPathInstance"("lastActivityAt" DESC);

CREATE TABLE "KlinikosPathEvent" (
  "id" TEXT NOT NULL,
  "instanceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "nodeId" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KlinikosPathEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KlinikosPathEvent_instance_fkey" FOREIGN KEY ("instanceId") REFERENCES "KlinikosPathInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "KlinikosPathEvent_instance_time_idx"
  ON "KlinikosPathEvent"("instanceId", "occurredAt" DESC);
CREATE INDEX "KlinikosPathEvent_actor_time_idx"
  ON "KlinikosPathEvent"("actorId", "occurredAt" DESC);
