import "server-only";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { findEntitlementForIdentity } from "@/lib/commerce/whop-entitlements";
import type { EntitlementRecord } from "@/lib/commerce/whop-rules";
import { type GridMarketplaceAction, evaluateGridMarketplaceAccess, summarizeGridMarketplaceAccess } from "@/lib/grid-access";
import { providerReadyForGrid } from "@/lib/grid-rules";

/**
 * Server guard for the GRID marketplace access layer.
 *
 * Every marketplace mutation runs through this before the repository is touched, so
 * the paid-entry gate cannot be bypassed by calling the API directly. Denials are
 * audited against the acting tenant and never disclose whether another tenant's
 * resource exists.
 */

async function resolveProviderReadiness(session: ClinicSession) {
  const provider = await db.provider.findFirst({
    where: { organizationId: session.organizationId, userId: session.userId },
    select: {
      verificationStatus: true,
      malpracticeExpiration: true,
      malpracticeVerificationStatus: true,
      credentials: { select: { verificationStatus: true, expiresAt: true } },
    },
  });
  if (!provider) return { provider: null, ready: false };
  return { provider, ready: providerReadyForGrid(provider) };
}

export type GridAccessContext = {
  entitlement: EntitlementRecord | null;
  tierKey: string | null;
  providerReady: boolean;
  summary: ReturnType<typeof summarizeGridMarketplaceAccess>;
};

/** Read-only access context for rendering a workspace without performing an action. */
export async function gridAccessContext(session: ClinicSession): Promise<GridAccessContext> {
  const [entitlement, readiness] = await Promise.all([
    findEntitlementForIdentity({ email: session.email, organizationId: session.organizationId }),
    resolveProviderReadiness(session),
  ]);

  const record = (entitlement as EntitlementRecord | null) ?? null;
  return {
    entitlement: record,
    tierKey: entitlement?.tierKey ?? null,
    providerReady: readiness.ready,
    summary: summarizeGridMarketplaceAccess({ entitlement: record, providerReady: readiness.ready }),
  };
}

/**
 * Enforce one marketplace action. Returns `null` when the action is allowed, or a
 * ready-to-return response describing what the caller must resolve.
 *
 * Denials that a purchase or renewal would fix return 402 so the interface can route
 * the buyer to checkout; denials waiting on human credential review return 403,
 * because no payment resolves them.
 */
export async function enforceGridMarketplaceAccess(session: ClinicSession, action: GridMarketplaceAction) {
  return enforceGridMarketplaceAccessAny(session, [action]);
}

/**
 * Enforce an action that either side of the marketplace may legitimately perform.
 *
 * A GRID request transition, for example, is driven by the requesting clinic on some
 * steps and by the receiving provider on others, so the caller passes both
 * capabilities and the guard allows the request when any one of them is satisfied.
 * The reported denial is the first one, which is the capability the caller most
 * likely intended to use.
 */
export async function enforceGridMarketplaceAccessAny(session: ClinicSession, actions: readonly [GridMarketplaceAction, ...GridMarketplaceAction[]]) {
  const context = await gridAccessContext(session);
  const decisions = actions.map((action) => evaluateGridMarketplaceAccess({
    action,
    entitlement: context.entitlement,
    providerReady: context.providerReady,
  }));

  if (decisions.some((candidate) => candidate.allowed)) return null;

  const decision = decisions[0] as Extract<ReturnType<typeof evaluateGridMarketplaceAccess>, { allowed: false }>;
  const action = decision.action;

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "authorization.denied",
      resourceType: "grid_marketplace",
      resourceId: action,
      metadata: {
        gate: "grid_marketplace_access",
        reason: decision.reason,
        paymentRequired: decision.paymentRequired,
        tierKey: context.tierKey,
        credentialReviewComplete: context.providerReady,
      },
    },
  }).catch(() => undefined);

  return NextResponse.json(
    {
      error: decision.remediation,
      reason: decision.reason,
      action,
      paymentRequired: decision.paymentRequired,
      entryUrl: decision.paymentRequired ? "/entry" : null,
    },
    { status: decision.paymentRequired ? 402 : 403, headers: { "Cache-Control": "private, no-store" } },
  );
}
