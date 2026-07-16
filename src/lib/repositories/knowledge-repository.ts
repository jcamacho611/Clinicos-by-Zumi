import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { correctKnowledgeItemSchema, createKnowledgeItemSchema, reviewKnowledgeItemSchema } from "@/lib/knowledge-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function dateOrNull(value?: string | null) {
  return value ? new Date(value) : null;
}

function normalizedTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function visibleToOrganization(organizationId: string) {
  return { OR: [{ organizationId }, { organizationId: null }] };
}

export async function listKnowledgeWorkspace(session: Pick<ClinicSession, "organizationId" | "userId" | "role">, query = "") {
  if (!can(session.role, "knowledge", "read")) throw new NetworkAccessError("Knowledge access is not permitted for this role.", 403);
  const items = await db.knowledgeItem.findMany({
    where: visibleToOrganization(session.organizationId),
    include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? items.filter((item) => [item.title, item.content, item.sourceName, item.layer].some((value) => value.toLowerCase().includes(needle)))
    : items;
  const now = new Date();
  const active = filtered.filter((item) => ["approved", "approved_demo"].includes(item.status) && (!item.expiresAt || item.expiresAt > now));
  const grouped = new Map<string, typeof active>();
  for (const item of active) {
    const key = normalizedTitle(item.title);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  const conflicts = [...grouped.entries()]
    .filter(([, candidates]) => new Set(candidates.map((candidate) => candidate.content)).size > 1)
    .map(([title, candidates]) => ({ title, layers: candidates.map((candidate) => candidate.layer), itemIds: candidates.map((candidate) => candidate.id) }));
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "knowledge.accessed",
      resourceType: "knowledge_workspace",
      resourceId: session.organizationId,
      metadata: { query: query.trim(), resultCount: filtered.length, activeCount: active.length, conflictCount: conflicts.length },
    },
  });
  return {
    query: query.trim(),
    items: filtered.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      layer: item.layer,
      title: item.title,
      content: item.content,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceDate: item.sourceDate?.toISOString() ?? null,
      version: item.version,
      status: item.status,
      effectiveAt: item.effectiveAt?.toISOString() ?? null,
      expiresAt: item.expiresAt?.toISOString() ?? null,
      supersedesId: item.supersedesId,
      updatedAt: item.updatedAt.toISOString(),
      latestReview: item.reviews[0] ? { decision: item.reviews[0].decision, notes: item.reviews[0].notes, reviewedAt: item.reviews[0].reviewedAt.toISOString() } : null,
    })),
    activeCount: active.length,
    conflicts,
  };
}

export type KnowledgeWorkspace = Awaited<ReturnType<typeof listKnowledgeWorkspace>>;
export type KnowledgeItemView = KnowledgeWorkspace["items"][number];

export async function createKnowledgeItem(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "knowledge", "create")) throw new NetworkAccessError("Knowledge creation is not permitted for this role.", 403);
  const input = createKnowledgeItemSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const item = await tx.knowledgeItem.create({
      data: {
        organizationId: session.organizationId,
        layer: input.layer,
        title: input.title,
        content: input.content,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl ?? null,
        sourceDate: dateOrNull(input.sourceDate),
        effectiveAt: dateOrNull(input.effectiveAt),
        expiresAt: dateOrNull(input.expiresAt),
        status: "draft",
      },
    });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "knowledge.created", resourceType: "knowledge_item", resourceId: item.id, metadata: { layer: item.layer, status: item.status, humanReviewRequired: true } } });
    return item;
  });
}

async function findKnowledgeItem(session: ClinicSession, knowledgeId: string) {
  const item = await db.knowledgeItem.findFirst({ where: { id: knowledgeId, ...visibleToOrganization(session.organizationId) } });
  if (!item) throw new NetworkAccessError("Knowledge item not found for this organization.", 404);
  return item;
}

export async function reviewKnowledgeItem(session: ClinicSession, knowledgeId: string, rawInput: unknown) {
  if (!can(session.role, "knowledge", "manage")) throw new NetworkAccessError("Knowledge review is restricted to authorized reviewers.", 403);
  const input = reviewKnowledgeItemSchema.parse(rawInput);
  const item = await findKnowledgeItem(session, knowledgeId);
  if (input.action === "rollback" && !item.supersedesId) throw new NetworkAccessError("Only a corrected knowledge version can be rolled back.", 409);
  return db.$transaction(async (tx) => {
    const status = input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "rolled_back";
    const updated = await tx.knowledgeItem.update({ where: { id: item.id }, data: { status } });
    if (input.action === "rollback" && item.supersedesId) {
      await tx.knowledgeItem.updateMany({ where: { id: item.supersedesId, organizationId: session.organizationId }, data: { status: "approved" } });
    }
    await tx.knowledgeReview.create({ data: { knowledgeItemId: item.id, reviewerId: session.userId, decision: input.action, notes: input.notes } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `knowledge.${input.action}`, resourceType: "knowledge_item", resourceId: item.id, changes: { status: { from: item.status, to: status } }, metadata: { notes: input.notes, supersedesId: item.supersedesId, humanReview: true } } });
    return updated;
  });
}

export async function correctKnowledgeItem(session: ClinicSession, knowledgeId: string, rawInput: unknown) {
  if (!can(session.role, "knowledge", "update")) throw new NetworkAccessError("Knowledge correction is not permitted for this role.", 403);
  const input = correctKnowledgeItemSchema.parse(rawInput);
  const item = await findKnowledgeItem(session, knowledgeId);
  if (item.organizationId !== session.organizationId) throw new NetworkAccessError("Global reference items cannot be changed from a clinic workspace.", 403);
  return db.$transaction(async (tx) => {
    const replacement = await tx.knowledgeItem.create({
      data: {
        organizationId: session.organizationId,
        layer: item.layer,
        title: input.title,
        content: input.content,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl ?? null,
        sourceDate: dateOrNull(input.sourceDate),
        effectiveAt: dateOrNull(input.effectiveAt),
        expiresAt: dateOrNull(input.expiresAt),
        version: item.version + 1,
        status: "draft",
        supersedesId: item.id,
      },
    });
    await tx.knowledgeItem.update({ where: { id: item.id }, data: { status: "superseded" } });
    await tx.knowledgeReview.create({ data: { knowledgeItemId: replacement.id, reviewerId: session.userId, decision: "correction_submitted", notes: input.notes } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "knowledge.correction_submitted", resourceType: "knowledge_item", resourceId: replacement.id, changes: { supersedesId: item.id, version: { from: item.version, to: replacement.version } }, metadata: { notes: input.notes, requiresReview: true } } });
    return replacement;
  });
}
