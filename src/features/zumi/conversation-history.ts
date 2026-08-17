import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { decryptSensitiveContent, encryptSensitiveContent } from "@/lib/encrypted-content";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export type ZumiConversationMode = "conversation" | "command" | "briefing" | "research";
export type ZumiHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  interactionMode: ZumiConversationMode;
  createdAt: Date;
};
export type ZumiConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
};

type ConversationRow = {
  id: string;
  titleEncrypted: Uint8Array;
  titleIv: Uint8Array;
  titleAuthTag: Uint8Array;
  titleChecksumSha256: string | null;
  createdAt: Date;
  lastMessageAt: Date;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  interactionMode: ZumiConversationMode;
  encryptedContent: Uint8Array;
  encryptionIv: Uint8Array;
  encryptionAuthTag: Uint8Array;
  checksumSha256: string | null;
  createdAt: Date;
};

const DEFAULT_RETENTION_DAYS = 90;
const MAX_RETENTION_DAYS = 365;
const MAX_CONVERSATIONS_PER_USER = 100;
const MAX_MESSAGES_PER_CONTEXT = 12;

function retentionDays() {
  const parsed = Number.parseInt(process.env.ZUMI_CONVERSATION_RETENTION_DAYS ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_RETENTION_DAYS;
  return Math.min(parsed, MAX_RETENTION_DAYS);
}

function expiryFromNow() {
  return new Date(Date.now() + retentionDays() * 24 * 60 * 60 * 1_000);
}

function titleFromQuestion(question: string) {
  const compact = question.trim().replace(/\s+/g, " ");
  return compact.length <= 80 ? compact : `${compact.slice(0, 77)}…`;
}

function decryptUtf8(input: {
  encryptedContent: Uint8Array;
  encryptionIv: Uint8Array;
  encryptionAuthTag: Uint8Array;
  checksumSha256: string | null;
}) {
  return decryptSensitiveContent(input).toString("utf8");
}

function titleFromRow(row: ConversationRow) {
  return decryptUtf8({
    encryptedContent: row.titleEncrypted,
    encryptionIv: row.titleIv,
    encryptionAuthTag: row.titleAuthTag,
    checksumSha256: row.titleChecksumSha256,
  });
}

async function pruneExpired(session: ClinicSession) {
  await db.$executeRaw(Prisma.sql`
    DELETE FROM "zumi_conversations"
    WHERE "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" <= CURRENT_TIMESTAMP
  `);
}

async function enforceConversationCap(session: ClinicSession) {
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "zumi_conversations"
    WHERE "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
      AND "status" = 'active'
    ORDER BY "lastMessageAt" DESC
    OFFSET ${MAX_CONVERSATIONS_PER_USER}
  `);
  if (!rows.length) return;
  const ids = rows.map((row) => row.id);
  await db.$executeRaw(Prisma.sql`
    DELETE FROM "zumi_conversations"
    WHERE "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
      AND "id" IN (${Prisma.join(ids)})
  `);
}

export async function listZumiConversations(session: ClinicSession, take = 30): Promise<ZumiConversationSummary[]> {
  await pruneExpired(session);
  const boundedTake = Math.max(1, Math.min(take, 50));
  const rows = await db.$queryRaw<ConversationRow[]>(Prisma.sql`
    SELECT "id", "titleEncrypted", "titleIv", "titleAuthTag", "titleChecksumSha256", "createdAt", "lastMessageAt"
    FROM "zumi_conversations"
    WHERE "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
      AND "status" = 'active'
      AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
    ORDER BY "lastMessageAt" DESC
    LIMIT ${boundedTake}
  `);
  return rows.map((row) => ({ id: row.id, title: titleFromRow(row), createdAt: row.createdAt, lastMessageAt: row.lastMessageAt }));
}

export async function z​umiConversationOwnedBy(session: ClinicSession, conversationId: string) {
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "zumi_conversations"
    WHERE "id" = ${conversationId}
      AND "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
      AND "status" = 'active'
      AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
    LIMIT 1
  `);
  return Boolean(rows[0]);
}

export async function getZumiConversation(session: ClinicSession, conversationId: string) {
  const conversations = await db.$queryRaw<ConversationRow[]>(Prisma.sql`
    SELECT "id", "titleEncrypted", "titleIv", "titleAuthTag", "titleChecksumSha256", "createdAt", "lastMessageAt"
    FROM "zumi_conversations"
    WHERE "id" = ${conversationId}
      AND "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
      AND "status" = 'active'
      AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
    LIMIT 1
  `);
  const conversation = conversations[0];
  if (!conversation) return null;

  const rows = await db.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT "id", "role", "interactionMode", "encryptedContent", "encryptionIv", "encryptionAuthTag", "checksumSha256", "createdAt"
    FROM "zumi_conversation_messages"
    WHERE "conversationId" = ${conversationId}
      AND "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
    ORDER BY "sequence" ASC
    LIMIT 500
  `);

  const messages: ZumiHistoryMessage[] = rows.map((row) => ({
    id: row.id,
    role: row.role,
    interactionMode: row.interactionMode,
    text: decryptUtf8({
      encryptedContent: row.encryptedContent,
      encryptionIv: row.encryptionIv,
      encryptionAuthTag: row.encryptionAuthTag,
      checksumSha256: row.checksumSha256,
    }),
    createdAt: row.createdAt,
  }));

  return {
    id: conversation.id,
    title: titleFromRow(conversation),
    createdAt: conversation.createdAt,
    lastMessageAt: conversation.lastMessageAt,
    messages,
  };
}

export async function getRecentZumiConversationContext(session: ClinicSession, conversationId: string, take = MAX_MESSAGES_PER_CONTEXT) {
  const boundedTake = Math.max(2, Math.min(take, MAX_MESSAGES_PER_CONTEXT));
  if (!(await z​umiConversationOwnedBy(session, conversationId))) return null;
  const rows = await db.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT "id", "role", "interactionMode", "encryptedContent", "encryptionIv", "encryptionAuthTag", "checksumSha256", "createdAt"
    FROM "zumi_conversation_messages"
    WHERE "conversationId" = ${conversationId}
      AND "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
    ORDER BY "sequence" DESC
    LIMIT ${boundedTake}
  `);
  return rows.reverse().map((row) => ({
    role: row.role,
    text: decryptUtf8({
      encryptedContent: row.encryptedContent,
      encryptionIv: row.encryptionIv,
      encryptionAuthTag: row.encryptionAuthTag,
      checksumSha256: row.checksumSha256,
    }).slice(0, 4_000),
  }));
}

export async function appendZumiConversationTurn(input: {
  session: ClinicSession;
  conversationId?: string | null;
  question: string;
  answer: string;
  interactionMode: ZumiConversationMode;
}) {
  const conversationId = input.conversationId?.trim() || randomUUID();
  const existing = input.conversationId ? await z​umiConversationOwnedBy(input.session, conversationId) : false;
  if (input.conversationId && !existing) throw new NetworkAccessError("Zumi conversation not found.", 404);

  const questionEncrypted = encryptSensitiveContent(Buffer.from(input.question, "utf8"));
  const answerEncrypted = encryptSensitiveContent(Buffer.from(input.answer, "utf8"));
  const now = new Date();
  const expiresAt = expiryFromNow();

  await db.$transaction(async (tx) => {
    if (!existing) {
      const titleEncrypted = encryptSensitiveContent(Buffer.from(titleFromQuestion(input.question), "utf8"));
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "zumi_conversations" (
          "id", "organizationId", "userId", "status", "titleEncrypted", "titleIv", "titleAuthTag",
          "titleChecksumSha256", "encryptionKeyId", "createdAt", "updatedAt", "lastMessageAt", "expiresAt"
        ) VALUES (
          ${conversationId}, ${input.session.organizationId}, ${input.session.userId}, 'active',
          ${titleEncrypted.encryptedContent}, ${titleEncrypted.encryptionIv}, ${titleEncrypted.encryptionAuthTag},
          ${titleEncrypted.checksumSha256}, ${titleEncrypted.encryptionKeyId}, ${now}, ${now}, ${now}, ${expiresAt}
        )
      `);
    }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "zumi_conversation_messages" (
        "id", "conversationId", "organizationId", "userId", "role", "interactionMode",
        "encryptedContent", "encryptionIv", "encryptionAuthTag", "checksumSha256", "encryptionKeyId", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${conversationId}, ${input.session.organizationId}, ${input.session.userId}, 'user', ${input.interactionMode},
        ${questionEncrypted.encryptedContent}, ${questionEncrypted.encryptionIv}, ${questionEncrypted.encryptionAuthTag},
        ${questionEncrypted.checksumSha256}, ${questionEncrypted.encryptionKeyId}, ${now}
      )
    `);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "zumi_conversation_messages" (
        "id", "conversationId", "organizationId", "userId", "role", "interactionMode",
        "encryptedContent", "encryptionIv", "encryptionAuthTag", "checksumSha256", "encryptionKeyId", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${conversationId}, ${input.session.organizationId}, ${input.session.userId}, 'assistant', ${input.interactionMode},
        ${answerEncrypted.encryptedContent}, ${answerEncrypted.encryptionIv}, ${answerEncrypted.encryptionAuthTag},
        ${answerEncrypted.checksumSha256}, ${answerEncrypted.encryptionKeyId}, ${now}
      )
    `);
    await tx.$executeRaw(Prisma.sql`
      UPDATE "zumi_conversations"
      SET "updatedAt" = ${now}, "lastMessageAt" = ${now}, "expiresAt" = ${expiresAt}
      WHERE "id" = ${conversationId}
        AND "organizationId" = ${input.session.organizationId}
        AND "userId" = ${input.session.userId}
    `);
  });

  await enforceConversationCap(input.session);
  return { conversationId, expiresAt };
}

export async function deleteZumiConversation(session: ClinicSession, conversationId: string) {
  const affected = await db.$executeRaw(Prisma.sql`
    DELETE FROM "zumi_conversations"
    WHERE "id" = ${conversationId}
      AND "organizationId" = ${session.organizationId}
      AND "userId" = ${session.userId}
  `);
  return affected > 0;
}
