import "server-only";

import { db } from "@/lib/db";
import { entitlementsFromSubscriptions } from "@/features/zumi/entitlement-rules";

/**
 * Resolve an organization's entitlements from the database.
 *
 * Scoped by `organizationId` on the query itself, and that id comes from the signed
 * session — never from the request body.
 *
 * On a read failure this returns no entitlements rather than throwing. The effect is
 * that paid capabilities become unavailable during a database problem, which is the
 * correct direction to fail: a clinic briefly told a feature is unavailable is
 * recoverable, a clinic handed capabilities it does not hold is not.
 */
export async function resolveOrganizationEntitlements(organizationId: string, now = new Date()): Promise<string[]> {
  try {
    const rows = await db.clinicSubscription.findMany({
      where: { organizationId },
      select: { status: true, modules: true, trialEndsAt: true, currentPeriodEndsAt: true },
    });
    return entitlementsFromSubscriptions(rows, now);
  } catch (error) {
    console.error("[zumi] failed to resolve entitlements", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}
