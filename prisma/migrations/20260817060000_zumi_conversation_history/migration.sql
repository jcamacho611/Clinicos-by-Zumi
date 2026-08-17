-- Durable Zumi conversation history is owned by Klinikos, not by an AI provider.
-- Message bodies and conversation titles are encrypted by the application before they
-- reach PostgreSQL. Do not add plaintext transcript/title columns to these tables.

CREATE TABLE "zumi_conversations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "titleEncrypted" BYTEA NOT NULL,
    "titleIv" BYTEA NOT NULL,
    "titleAuthTag" BYTEA NOT NULL,
    "titleChecksumSha256" TEXT,
    "encryptionKeyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "zumi_conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "zumi_conversations_status_check" CHECK ("status" IN ('active', 'archived'))
);

CREATE TABLE "zumi_conversation_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "interactionMode" TEXT NOT NULL DEFAULT 'conversation',
    "encryptedContent" BYTEA NOT NULL,
    "encryptionIv" BYTEA NOT NULL,
    "encryptionAuthTag" BYTEA NOT NULL,
    "checksumSha256" TEXT,
    "encryptionKeyId" TEXT NOT NULL,
    "sequence" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zumi_conversation_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "zumi_conversation_messages_role_check" CHECK ("role" IN ('user', 'assistant')),
    CONSTRAINT "zumi_conversation_messages_mode_check" CHECK ("interactionMode" IN ('conversation', 'command', 'briefing', 'research'))
);

CREATE INDEX "zumi_conversations_owner_status_last_idx"
ON "zumi_conversations"("organizationId", "userId", "status", "lastMessageAt" DESC);

CREATE INDEX "zumi_conversations_owner_expiry_idx"
ON "zumi_conversations"("organizationId", "userId", "expiresAt");

CREATE UNIQUE INDEX "zumi_conversation_messages_conversation_sequence_key"
ON "zumi_conversation_messages"("conversationId", "sequence");

CREATE INDEX "zumi_conversation_messages_owner_conversation_idx"
ON "zumi_conversation_messages"("organizationId", "userId", "conversationId", "sequence");

ALTER TABLE "zumi_conversations"
ADD CONSTRAINT "zumi_conversations_organization_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "zumi_conversations"
ADD CONSTRAINT "zumi_conversations_user_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "zumi_conversation_messages"
ADD CONSTRAINT "zumi_conversation_messages_conversation_fkey"
FOREIGN KEY ("conversationId") REFERENCES "zumi_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "zumi_conversation_messages"
ADD CONSTRAINT "zumi_conversation_messages_organization_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "zumi_conversation_messages"
ADD CONSTRAINT "zumi_conversation_messages_user_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
