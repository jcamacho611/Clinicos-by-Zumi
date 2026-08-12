import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import {
  evaluateGridResourcePolicy,
  gridResourceCreateSchema,
  gridResourceOwnerTransitionSchema,
  gridResourceReviewSchema,
  type GridResourceCreateInput,
} from "@/lib/grid/resource-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ResourceRow = {
  id: string;
  organizationId: string;
  createdBy: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  visibility: string;
  status: string;
  city: string | null;
  state: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  requiresHumanReview: boolean;
  reviewStatus: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

type AvailabilityRow = {
  id: string;
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  status: string;
};

function requireGridPermission(session: ClinicSession, action: "read" | "create" | "update") {
  if (!can(session.role, "grid", action) && !can(session.role, "network", action)) {
    throw new NetworkAccessError("Grid resource access is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { status: true, demoMode: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Universal Grid resources require production review before live regulated use.", 409);
}

async function requirePlatformReviewAuthority(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) throw new NetworkAccessError("Grid resource review requires owner-level platform permission.", 403);
  const organization = await db.organization.findUnique({ where: { id: session.organizationId }, select: { slug: true, status: true } });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  const platformSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG ?? process.env.CLINICOS_SALES_ORGANIZATION_SLUG ?? "clinicos-by-zumi";
  if (organization.slug !== platformSlug) throw new NetworkAccessError("Grid resource review is restricted to the Klinikos platform organization.", 403);
}

function serializeResource(row: ResourceRow, availability: AvailabilityRow[] = []) {
  return {
    ...row,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    availability: availability.map((slot) => ({
      ...slot,
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
    })),
  };
}

async function insertAvailability(client: Prisma.TransactionClient, resourceId: string, availability: GridResourceCreateInput["availability"]) {
  for (const slot of availability) {
    await client.$executeRaw(Prisma.sql`
      INSERT INTO "GridResourceAvailabilityRecord" (
        "id", "resourceId", "startsAt", "endsAt", "capacity", "status", "createdAt", "updatedAt"
      ) VALUES (
        ${randomUUID()}, ${resourceId}, ${new Date(slot.startsAt)}, ${new Date(slot.endsAt)}, ${slot.capacity}, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);
  }
}

async function appendReviewEvent(client: Prisma.TransactionClient, input: {
  organizationId: string;
  resourceId: string;
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note: string;
  metadata?: Record<string, unknown>;
}) {
  await client.$executeRaw(Prisma.sql`
    INSERT INTO "GridResourceReviewEventRecord" (
      "id", "organizationId", "resourceId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
    ) VALUES (
      ${randomUUID()}, ${input.organizationId}, ${input.resourceId}, ${input.actorId}, ${input.action},
      ${input.fromStatus ?? null}, ${input.toStatus ?? null}, ${input.note},
      CAST(${JSON.stringify(input.metadata ?? {})} AS JSONB), CURRENT_TIMESTAMP
    )
  `);
}

export async function createGridResource(session: ClinicSession, rawInput: unknown) {
  requireGridPermission(session, "create");
  await requireSyntheticOrganization(session.organizationId);
  const input = gridResourceCreateSchema.parse(rawInput);
  const id = randomUUID();
  const metadata = JSON.stringify({
    credentialRequirements: input.credentialRequirements,
    insuranceRequirements: input.insuranceRequirements,
    operatorRequirements: input.operatorRequirements,
    usageRestrictions: input.usageRestrictions,
  });

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ResourceRow[]>(Prisma.sql`
      INSERT INTO "GridResourceRecord" (
        "id", "organizationId", "createdBy", "resourceType", "subtype", "title", "description", "policyClass",
        "visibility", "status", "city", "state", "timezone", "latitude", "longitude", "pricingModel", "priceCents",
        "capacity", "requiresHumanReview", "reviewStatus", "metadata", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${session.organizationId}, ${session.userId}, ${input.resourceType}, ${input.subtype ?? null}, ${input.title}, ${input.description},
        ${input.policyClass}, ${input.visibility}, 'draft', ${input.city ?? null}, ${input.state ?? null}, ${input.timezone},
        ${input.latitude ?? null}, ${input.longitude ?? null}, ${input.pricingModel}, ${input.priceCents ?? null}, ${input.capacity},
        true, 'not_submitted', CAST(${metadata} AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const created = rows[0];
    if (!created) throw new NetworkAccessError("Grid resource could not be created.", 500);
    await insertAvailability(tx, id, input.availability);
    await Promise.all([
      appendReviewEvent(tx, {
        organizationId: session.organizationId,
        resourceId: id,
        actorId: session.userId,
        action: "grid.resource.created",
        toStatus: "draft",
        note: "Grid resource draft created.",
        metadata: { resourceType: input.resourceType, policyClass: input.policyClass, syntheticDemo: true },
      }),
      tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "grid.resource_created",
          resourceType: "grid_resource",
          resourceId: id,
          metadata: { resourceType: input.resourceType, policyClass: input.policyClass, visibility: input.visibility, syntheticDemo: true },
        },
      }),
    ]);
    const slots = await tx.$queryRaw<AvailabilityRow[]>(Prisma.sql`SELECT * FROM "GridResourceAvailabilityRecord" WHERE "resourceId" = ${id} ORDER BY "startsAt"`);
    return serializeResource(created, slots);
  });
}

export async function listOwnGridResources(session: ClinicSession) {
  requireGridPermission(session, "read");
  const rows = await db.$queryRaw<ResourceRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceRecord"
    WHERE "organizationId" = ${session.organizationId}
    ORDER BY "updatedAt" DESC
    LIMIT 250
  `);
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const slots = await db.$queryRaw<AvailabilityRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceAvailabilityRecord"
    WHERE "resourceId" IN (${Prisma.join(ids)}) AND "status" = 'active'
    ORDER BY "startsAt"
  `);
  const slotsByResource = new Map<string, AvailabilityRow[]>();
  for (const slot of slots) slotsByResource.set(slot.resourceId, [...(slotsByResource.get(slot.resourceId) ?? []), slot]);
  return rows.map((row) => serializeResource(row, slotsByResource.get(row.id) ?? []));
}

export async function listPublicGridResources() {
  const rows = await db.$queryRaw<ResourceRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceRecord"
    WHERE "status" = 'active' AND "reviewStatus" = 'approved' AND "visibility" = 'public'
    ORDER BY "updatedAt" DESC
    LIMIT 500
  `);
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const slots = await db.$queryRaw<AvailabilityRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceAvailabilityRecord"
    WHERE "resourceId" IN (${Prisma.join(ids)}) AND "status" = 'active' AND "endsAt" > CURRENT_TIMESTAMP
    ORDER BY "startsAt"
  `);
  const slotsByResource = new Map<string, AvailabilityRow[]>();
  for (const slot of slots) slotsByResource.set(slot.resourceId, [...(slotsByResource.get(slot.resourceId) ?? []), slot]);
  return rows.map((row) => {
    const metadata = (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)) ? row.metadata as Record<string, unknown> : {};
    return {
      id: row.id,
      organizationId: row.organizationId,
      resourceType: row.resourceType,
      subtype: row.subtype,
      title: row.title,
      description: row.description,
      policyClass: row.policyClass,
      city: row.city,
      state: row.state,
      timezone: row.timezone,
      latitude: row.latitude,
      longitude: row.longitude,
      pricingModel: row.pricingModel,
      priceCents: row.priceCents,
      capacity: row.capacity,
      credentialRequirements: Array.isArray(metadata.credentialRequirements) ? metadata.credentialRequirements : [],
      insuranceRequirements: Array.isArray(metadata.insuranceRequirements) ? metadata.insuranceRequirements : [],
      operatorRequirements: Array.isArray(metadata.operatorRequirements) ? metadata.operatorRequirements : [],
      usageRestrictions: Array.isArray(metadata.usageRestrictions) ? metadata.usageRestrictions : [],
      availability: (slotsByResource.get(row.id) ?? []).map((slot) => ({ startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), capacity: slot.capacity })),
    };
  });
}

export async function transitionOwnGridResource(session: ClinicSession, resourceId: string, rawInput: unknown) {
  requireGridPermission(session, "update");
  await requireSyntheticOrganization(session.organizationId);
  const input = gridResourceOwnerTransitionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ResourceRow[]>(Prisma.sql`
      SELECT * FROM "GridResourceRecord"
      WHERE "id" = ${resourceId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const resource = rows[0];
    if (!resource) throw new NetworkAccessError("Grid resource not found.", 404);

    const allowed = input.targetStatus === "pending_review"
      ? ["draft", "paused"].includes(resource.status)
      : input.targetStatus === "paused" && resource.status === "active";
    if (!allowed) throw new NetworkAccessError(`Grid resource cannot move from ${resource.status} to ${input.targetStatus}.`, 409);

    const reviewStatus = input.targetStatus === "pending_review" ? "in_review" : resource.reviewStatus;
    const updatedRows = await tx.$queryRaw<ResourceRow[]>(Prisma.sql`
      UPDATE "GridResourceRecord"
      SET "status" = ${input.targetStatus}, "reviewStatus" = ${reviewStatus}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${resource.id}
      RETURNING *
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid resource transition failed.", 500);
    await appendReviewEvent(tx, {
      organizationId: resource.organizationId,
      resourceId: resource.id,
      actorId: session.userId,
      action: `grid.resource.${input.targetStatus}`,
      fromStatus: resource.status,
      toStatus: input.targetStatus,
      note: input.note,
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.resource_${input.targetStatus}`,
        resourceType: "grid_resource",
        resourceId: resource.id,
        metadata: { fromStatus: resource.status, toStatus: input.targetStatus, reviewStatus },
      },
    });
    return serializeResource(updated);
  });
}

export async function reviewGridResource(session: ClinicSession, resourceId: string, rawInput: unknown) {
  await requirePlatformReviewAuthority(session);
  const input = gridResourceReviewSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ResourceRow[]>(Prisma.sql`SELECT * FROM "GridResourceRecord" WHERE "id" = ${resourceId} FOR UPDATE`);
    const resource = rows[0];
    if (!resource) throw new NetworkAccessError("Grid resource not found.", 404);
    if (resource.status !== "pending_review" && input.decision !== "suspended") {
      throw new NetworkAccessError("Only a pending-review Grid resource can be approved or rejected.", 409);
    }

    const slots = await tx.$queryRaw<AvailabilityRow[]>(Prisma.sql`
      SELECT * FROM "GridResourceAvailabilityRecord"
      WHERE "resourceId" = ${resource.id} AND "status" = 'active' AND "endsAt" > CURRENT_TIMESTAMP
    `);
    const policy = evaluateGridResourcePolicy({
      policyClass: resource.policyClass as Parameters<typeof evaluateGridResourcePolicy>[0]["policyClass"],
      status: input.decision === "approved" ? "active" : resource.status,
      reviewStatus: input.decision,
      visibility: resource.visibility,
      availabilityCount: slots.length,
    });
    if (input.decision === "approved" && !policy.eligibleForTransaction) {
      throw new NetworkAccessError(`Grid resource cannot be approved: ${policy.reasons.join(" ")}`, 409);
    }

    const status = input.decision === "approved" ? "active" : input.decision === "suspended" ? "suspended" : "draft";
    const updatedRows = await tx.$queryRaw<ResourceRow[]>(Prisma.sql`
      UPDATE "GridResourceRecord"
      SET "status" = ${status}, "reviewStatus" = ${input.decision}, "reviewedAt" = CURRENT_TIMESTAMP,
          "reviewedBy" = ${session.userId}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${resource.id}
      RETURNING *
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid resource review failed.", 500);
    await appendReviewEvent(tx, {
      organizationId: resource.organizationId,
      resourceId: resource.id,
      actorId: session.userId,
      action: `grid.resource.review_${input.decision}`,
      fromStatus: resource.status,
      toStatus: status,
      note: input.note,
      metadata: { reviewStatus: input.decision, policyReasons: policy.reasons },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.resource_review_${input.decision}`,
        resourceType: "grid_resource",
        resourceId: resource.id,
        metadata: { ownerOrganizationId: resource.organizationId, fromStatus: resource.status, toStatus: status, policyClass: resource.policyClass, policyReasons: policy.reasons },
      },
    });
    return serializeResource(updated, slots);
  });
}

export async function getEligibleGridResourceForTransaction(client: Prisma.TransactionClient, input: {
  resourceId: string;
  resourceType: string;
  recipientOrganizationId?: string | null;
  startsAt: Date;
  endsAt: Date;
}) {
  const rows = await client.$queryRaw<ResourceRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceRecord" WHERE "id" = ${input.resourceId} FOR SHARE
  `);
  const resource = rows[0];
  if (!resource) throw new NetworkAccessError("Selected Grid resource does not exist.", 404);
  if (resource.resourceType !== input.resourceType) throw new NetworkAccessError("Selected Grid resource type does not match the offer.", 409);
  if (input.recipientOrganizationId && resource.organizationId !== input.recipientOrganizationId) {
    throw new NetworkAccessError("Selected Grid recipient does not own this resource.", 409);
  }

  const slots = await client.$queryRaw<AvailabilityRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceAvailabilityRecord"
    WHERE "resourceId" = ${resource.id} AND "status" = 'active' AND "startsAt" <= ${input.startsAt} AND "endsAt" >= ${input.endsAt}
    ORDER BY "capacity" DESC
  `);
  const policy = evaluateGridResourcePolicy({
    policyClass: resource.policyClass as Parameters<typeof evaluateGridResourcePolicy>[0]["policyClass"],
    status: resource.status,
    reviewStatus: resource.reviewStatus,
    visibility: resource.visibility,
    availabilityCount: slots.length,
  });
  if (!policy.eligibleForTransaction) throw new NetworkAccessError(`Selected Grid resource is not eligible: ${policy.reasons.join(" ")}`, 409);

  return {
    id: resource.id,
    organizationId: resource.organizationId,
    resourceType: resource.resourceType,
    policyClass: resource.policyClass,
    capacity: resource.capacity,
    matchingAvailability: slots,
  };
}
