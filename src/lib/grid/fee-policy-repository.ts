import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { gridFeePolicySchema } from "@/lib/grid/financial-rules";
import { evaluateGridFeePolicyScope } from "@/lib/commercial/monetization-policy";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type FeePolicyRow = {
  id: string;
  scopeKind: "default" | "demand_kind" | "resource_kind";
  scopeValue: string | null;
  platformFeeBps: number;
  platformFeeFlatCents: number;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

async function requirePlatformAdmin(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) {
    throw new NetworkAccessError("Platform fee policy management requires owner-level settings permission.", 403);
  }
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { slug: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  const platformSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG
    ?? process.env.CLINICOS_SALES_ORGANIZATION_SLUG
    ?? "clinicos-by-zumi";
  if (organization.slug !== platformSlug) {
    throw new NetworkAccessError("Grid platform fee policies can only be changed from the Klinikos platform organization.", 403);
  }
}

function serialize(row: FeePolicyRow) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listGridFeePolicies(session: ClinicSession) {
  await requirePlatformAdmin(session);
  const rows = await db.$queryRaw<FeePolicyRow[]>(Prisma.sql`
    SELECT * FROM "GridFeePolicyRecord"
    ORDER BY CASE WHEN "status" = 'active' THEN 0 ELSE 1 END, "scopeKind", "scopeValue", "updatedAt" DESC
  `);
  return rows.map(serialize);
}

export async function createGridFeePolicy(session: ClinicSession, rawInput: unknown) {
  await requirePlatformAdmin(session);
  const input = gridFeePolicySchema.parse(rawInput);

  // A persisted policy row is what the allocator actually reads, so the declared
  // monetization gate has to be applied here rather than only in the declaration
  // module. Refusing at write time keeps a prohibited fee out of the table entirely.
  const monetization = evaluateGridFeePolicyScope({
    scopeKind: input.scopeKind,
    scopeValue: input.scopeValue ?? null,
    platformFeeBps: input.platformFeeBps,
    platformFeeFlatCents: input.platformFeeFlatCents,
  });
  if (!monetization.permitted) {
    throw new NetworkAccessError(monetization.reason, 409);
  }

  const id = randomUUID();

  return db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "GridFeePolicyRecord"
      SET "status" = 'inactive', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "status" = 'active'
        AND "scopeKind" = ${input.scopeKind}
        AND COALESCE("scopeValue", '') = ${input.scopeValue ?? ""}
    `);

    const rows = await tx.$queryRaw<FeePolicyRow[]>(Prisma.sql`
      INSERT INTO "GridFeePolicyRecord" (
        "id", "scopeKind", "scopeValue", "platformFeeBps", "platformFeeFlatCents", "status", "createdBy", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${input.scopeKind}, ${input.scopeValue ?? null}, ${input.platformFeeBps}, ${input.platformFeeFlatCents},
        'active', ${session.userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const created = rows[0];
    if (!created) throw new NetworkAccessError("Grid fee policy could not be created.", 500);

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.fee_policy_created",
        resourceType: "grid_fee_policy",
        resourceId: id,
        metadata: {
          scopeKind: input.scopeKind,
          scopeValue: input.scopeValue ?? null,
          platformFeeBps: input.platformFeeBps,
          platformFeeFlatCents: input.platformFeeFlatCents,
          status: "active",
          monetizationOutcome: monetization.outcome,
          monetizationFeeClass: monetization.feeClass,
        },
      },
    });
    return serialize(created);
  });
}
