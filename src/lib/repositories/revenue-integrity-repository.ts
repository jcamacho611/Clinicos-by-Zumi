import "server-only";

import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { connectorCatalog } from "@/lib/connectors/catalog";
import { connectorStatus } from "@/lib/connectors/status";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import {
  buildRevenueIntegrityPath,
  type RevenueIntegrityPath,
} from "@/lib/revenue/revenue-integrity-path";

/**
 * Reads one claim as the revenue integrity path.
 *
 * The reading itself is pure and lives in `@/lib/revenue/revenue-integrity-path`; this
 * supplies it with authorized, tenant-scoped truth.
 *
 * Whether an external claims rail is connected is derived from the Stedi connector's
 * real runtime readiness rather than a constant, so the day a production rail is
 * approved the path stops hedging on its own — and until then it cannot be talked into
 * claiming a payer confirmed anything.
 */
export async function readRevenueIntegrityPath(
  session: Pick<ClinicSession, "organizationId" | "role">,
  claimId: string,
): Promise<RevenueIntegrityPath | null> {
  if (!can(session.role, "billing", "read")) {
    throw new NetworkAccessError("Billing access is not permitted for this role.", 403);
  }

  const claim = await db.claimDraft.findFirst({
    // Tenant scope is part of the lookup, not a filter applied afterwards: a claim in
    // another organization must be indistinguishable from one that does not exist.
    where: { id: claimId, organizationId: session.organizationId },
    select: { id: true, status: true, totalCents: true, submittedAt: true, encounterId: true, superbillId: true },
  });
  if (!claim) return null;

  const [encounter, superbill, openDenials] = await Promise.all([
    claim.encounterId
      ? db.encounter.findFirst({
          where: { id: claim.encounterId, organizationId: session.organizationId },
          select: { signedAt: true },
        })
      : Promise.resolve(null),
    claim.superbillId
      ? db.superbill.findFirst({
          where: { id: claim.superbillId, organizationId: session.organizationId },
          select: { procedures: true, diagnoses: true, reviewedAt: true },
        })
      : Promise.resolve(null),
    db.denial.findMany({
      where: { claimDraftId: claim.id, organizationId: session.organizationId, status: "open" },
      orderBy: { createdAt: "asc" },
      select: { reason: true, appealDueAt: true },
    }),
  ]);

  return buildRevenueIntegrityPath(
    {
      status: claim.status,
      totalCents: claim.totalCents,
      submittedAt: claim.submittedAt?.toISOString() ?? null,
      encounter: encounter ? { signedAt: encounter.signedAt?.toISOString() ?? null } : null,
      superbill: superbill
        ? {
            procedureCount: countEntries(superbill.procedures),
            diagnosisCount: countEntries(superbill.diagnoses),
            reviewedAt: superbill.reviewedAt?.toISOString() ?? null,
          }
        : null,
      openDenials: openDenials.map((denial) => ({
        reason: denial.reason,
        appealDueAt: denial.appealDueAt?.toISOString() ?? null,
      })),
    },
    { externalRailConnected: claimsRailConnected() },
  );
}

/** Codes are stored as JSON. Anything that is not a populated array counts as none. */
function countEntries(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Whether a production claims rail is live, from connector truth.
 *
 * Sandbox readiness is never production evidence, which is exactly what
 * `productionUsable` already encodes — so this asks that question rather than
 * re-deriving it from environment variables.
 */
export function claimsRailConnected(env: NodeJS.ProcessEnv = process.env): boolean {
  const stedi = connectorCatalog.find((connector) => connector.id === "stedi");
  if (!stedi) return false;
  return connectorStatus(stedi, env).productionUsable;
}
