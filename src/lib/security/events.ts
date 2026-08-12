import "server-only";

import { db } from "@/lib/db";
import type { SecurityRiskLevel } from "@/lib/security/risk-engine";

export type SecurityEventInput = {
  organizationId: string;
  actorId?: string | null;
  action: string;
  risk: SecurityRiskLevel;
  resourceType?: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Security events share the immutable audit trail instead of inventing a parallel log.
 * A dedicated SIEM/export adapter can consume these records later by the `security.*`
 * action namespace.
 */
export async function recordSecurityEvent(input: SecurityEventInput) {
  try {
    const event = await db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId ?? null,
        actorType: input.actorId ? "user" : "system",
        action: input.action.startsWith("security.") ? input.action : `security.${input.action}`,
        resourceType: input.resourceType ?? "security",
        resourceId: input.resourceId ?? input.action,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
        metadata: { risk: input.risk, ...(input.metadata ?? {}) },
      },
    });
    return event.id;
  } catch (error) {
    console.error("[security] failed to record security event", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
