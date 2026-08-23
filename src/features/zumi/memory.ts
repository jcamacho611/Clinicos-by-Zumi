import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { containsLikelyIdentifiers, redactText } from "@/features/zumi/redaction";
import {
  formatZumiGovernedContext,
  rankZumiGovernedContext,
  type ZumiGovernedContextItem,
} from "@/features/zumi/memory-authority";

export const zumiMemoryKinds = ["preference", "working_style", "project_context", "strategy"] as const;
export type ZumiMemoryKind = (typeof zumiMemoryKinds)[number];

export type ZumiMemoryItem = {
  id: string;
  kind: ZumiMemoryKind;
  title: string;
  content: string;
  version: number;
  updatedAt: Date;
  expiresAt: Date | null;
};

const MEMORY_SOURCE = "zumi_user_memory";
const MAX_MEMORY_ITEMS_PER_USER = 80;
const DEFAULT_RETENTION_DAYS = 180;
const FOUNDER_RETENTION_DAYS = 365;

function layerFor(userId: string, kind?: ZumiMemoryKind) {
  return kind ? `zumi_memory:${userId}:${kind}` : `zumi_memory:${userId}:`;
}

function titleFor(kind: ZumiMemoryKind, title: string) {
  return `${kind}:${title.trim().replace(/\s+/g, " ").slice(0, 120)}`;
}

const SECRET_PATTERNS = [
  /\b(?:api[_ -]?key|secret|password|bearer token|access token|private key)\b/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
];

export function validateDurableMemoryContent(content: string) {
  const trimmed = content.trim();
  if (trimmed.length < 2 || trimmed.length > 1_500) {
    return { allowed: false as const, reason: "Memory must be between 2 and 1,500 characters." };
  }
  if (containsLikelyIdentifiers(trimmed) || redactText(trimmed).redactedAny) {
    return { allowed: false as const, reason: "Durable Zumi memory cannot store identifier-shaped personal or patient data." };
  }
  if (SECRET_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { allowed: false as const, reason: "Durable Zumi memory cannot store credentials or secrets." };
  }
  return { allowed: true as const, content: trimmed };
}

export async function listZumiMemories(session: ClinicSession, options: { kind?: ZumiMemoryKind; take?: number } = {}) {
  const take = Math.max(1, Math.min(options.take ?? 20, 50));
  const now = new Date();
  const rows = await db.knowledgeItem.findMany({
    where: {
      organizationId: session.organizationId,
      layer: options.kind ? layerFor(session.userId, options.kind) : { startsWith: layerFor(session.userId) },
      sourceName: MEMORY_SOURCE,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: { id: true, layer: true, title: true, content: true, version: true, updatedAt: true, expiresAt: true },
  });

  return rows.map((row): ZumiMemoryItem => ({
    id: row.id,
    kind: (row.layer.split(":").at(-1) ?? "preference") as ZumiMemoryKind,
    title: row.title.includes(":") ? row.title.slice(row.title.indexOf(":") + 1) : row.title,
    content: row.content,
    version: row.version,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  }));
}

export async function rememberForZumi(input: {
  session: ClinicSession;
  kind: ZumiMemoryKind;
  title: string;
  content: string;
  retentionDays?: number;
}) {
  const validated = validateDurableMemoryContent(input.content);
  if (!validated.allowed) return validated;

  const retentionDays = Math.max(
    1,
    Math.min(
      input.retentionDays ?? (process.env.KLINIKOS_FOUNDER_USER_IDS?.split(",").map((id) => id.trim()).includes(input.session.userId) ? FOUNDER_RETENTION_DAYS : DEFAULT_RETENTION_DAYS),
      730,
    ),
  );
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1_000);
  const layer = layerFor(input.session.userId, input.kind);
  const title = titleFor(input.kind, input.title);

  const existing = await db.knowledgeItem.findFirst({
    where: {
      organizationId: input.session.organizationId,
      layer,
      title,
      sourceName: MEMORY_SOURCE,
      status: "active",
    },
    select: { id: true },
  });

  const row = existing
    ? await db.knowledgeItem.update({
        where: { id: existing.id },
        data: { content: validated.content, expiresAt, effectiveAt: new Date(), version: { increment: 1 } },
        select: { id: true },
      })
    : await db.knowledgeItem.create({
        data: {
          organizationId: input.session.organizationId,
          layer,
          title,
          content: validated.content,
          sourceName: MEMORY_SOURCE,
          sourceDate: new Date(),
          status: "active",
          effectiveAt: new Date(),
          expiresAt,
        },
        select: { id: true },
      });

  const count = await db.knowledgeItem.count({
    where: {
      organizationId: input.session.organizationId,
      layer: { startsWith: layerFor(input.session.userId) },
      sourceName: MEMORY_SOURCE,
      status: "active",
    },
  });

  if (count > MAX_MEMORY_ITEMS_PER_USER) {
    const oldest = await db.knowledgeItem.findMany({
      where: {
        organizationId: input.session.organizationId,
        layer: { startsWith: layerFor(input.session.userId) },
        sourceName: MEMORY_SOURCE,
        status: "active",
      },
      orderBy: { updatedAt: "asc" },
      take: count - MAX_MEMORY_ITEMS_PER_USER,
      select: { id: true },
    });
    if (oldest.length) {
      await db.knowledgeItem.updateMany({
        where: { id: { in: oldest.map((item) => item.id) } },
        data: { status: "expired", expiresAt: new Date() },
      });
    }
  }

  return { allowed: true as const, id: row.id, expiresAt };
}

export async function forgetZumiMemory(session: ClinicSession, memoryId: string) {
  const existing = await db.knowledgeItem.findFirst({
    where: {
      id: memoryId,
      organizationId: session.organizationId,
      layer: { startsWith: layerFor(session.userId) },
      sourceName: MEMORY_SOURCE,
    },
    select: { id: true },
  });
  if (!existing) return false;
  await db.knowledgeItem.update({ where: { id: existing.id }, data: { status: "forgotten", expiresAt: new Date() } });
  return true;
}

function personalMemoryContextItem(memory: ZumiMemoryItem): ZumiGovernedContextItem {
  return {
    id: memory.id,
    scope: "user",
    authority: "human_confirmed_personal",
    title: `[${memory.kind}] ${memory.title}`,
    content: memory.content,
    sourceName: MEMORY_SOURCE,
    sourceDate: memory.updatedAt.toISOString(),
    effectiveAt: memory.updatedAt.toISOString(),
    expiresAt: memory.expiresAt?.toISOString() ?? null,
    version: memory.version,
  };
}

export async function retrieveZumiMemoryContext(session: ClinicSession, question: string, take = 12) {
  const memories = await listZumiMemories(session, { take: Math.max(4, Math.min(take, 20)) });
  if (!memories.length) return { text: "", memoryIds: [] as string[] };

  const ranked = rankZumiGovernedContext(memories.map(personalMemoryContextItem), question, 8);
  return {
    text: formatZumiGovernedContext(ranked),
    memoryIds: ranked.map((memory) => memory.id),
  };
}

export async function retrieveZumiOrganizationKnowledgeContext(session: ClinicSession, question: string, take = 8) {
  const now = new Date();
  const rows = await db.knowledgeItem.findMany({
    where: {
      AND: [
        { OR: [{ organizationId: session.organizationId }, { organizationId: null }] },
        { status: "approved" },
        { NOT: { sourceName: MEMORY_SOURCE } },
        { OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 60,
    select: {
      id: true,
      organizationId: true,
      title: true,
      content: true,
      sourceName: true,
      sourceDate: true,
      effectiveAt: true,
      expiresAt: true,
      version: true,
    },
  });

  const candidates: ZumiGovernedContextItem[] = rows.map((row) => ({
    id: row.id,
    scope: row.organizationId === null ? "global" : "organization",
    authority: row.organizationId === null ? "human_approved_global_reference" : "human_approved_organization",
    title: row.title,
    content: row.content,
    sourceName: row.sourceName,
    sourceDate: row.sourceDate?.toISOString() ?? null,
    effectiveAt: row.effectiveAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    version: row.version,
  }));
  const ranked = rankZumiGovernedContext(candidates, question, take);

  return {
    text: formatZumiGovernedContext(ranked),
    knowledgeIds: ranked.map((item) => item.id),
  };
}
