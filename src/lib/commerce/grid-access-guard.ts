import "server-only";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { findGrantedAccessPayment } from "@/lib/commerce/access-payment-service";
import { getAccessProduct } from "@/lib/commerce/access-product-catalog";
import { findEntitlementForIdentity } from "@/lib/commerce/whop-entitlements";
import type { EntitlementRecord } from "@/lib/commerce/whop-rules";

/**
 * Map a settled one-time marketplace purchase onto the same entitlement shape the
 * access rules consume, so both the recurring pass and the one-time review fee are
 * evaluated by one set of rules.
 *
 * A one-time review fee has no renewal date, so it carries no `validUntil`; it is
 * revoked by refund or by an administrator rather than by expiry.
 */
const roleTargetTier: Record<string, string> = {
  contractor: "grid_provider",
  location_owner: "grid_location_partner",
  seller: "grid_location_partner",
  clinic: "clinic_operator",
  advisory: "evaluator_pass",
};

function entitlementFromPayment(payment: { productKey: string; roleTarget: string; verifiedAt: Date | null } | null): EntitlementRecord | null {
  if (!payment) return null;
  const tierKey = roleTargetTier[payment.roleTarget];
  if (!tierKey || !getAccessProduct(payment.productKey)) return null;
  return {
    tierKey,
    state: "active",
    validUntil: null,
    revokedAt: null,
    lastVerifiedAt: payment.verifiedAt,
  };
}
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
  const [entitlement, grantedPayment, readiness] = await Promise.all([
    findEntitlementForIdentity({ email: session.email, organizationId: session.organizationId }),
    findGrantedAccessPayment({ email: session.email, organizationId: session.organizationId }),
    resolveProviderReadiness(session),
  ]);

  // Either route into the marketplace counts: a recurring access pass, or a settled
  // one-time review fee whose human review has completed. The pass wins when both
  // exist, since it is the one that can expire and be revalidated.
  const record = (entitlement as EntitlementRecord | null) ?? entitlementFromPayment(grantedPayment);
  return {
    entitlement: record,
    tierKey: record?.tierKey ?? null,
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
