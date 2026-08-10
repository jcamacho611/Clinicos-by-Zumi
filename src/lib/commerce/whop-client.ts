import "server-only";

import { accessTierCatalog, type AccessTier, purchasableTiers, resolveTierForPlan } from "@/lib/commerce/whop-catalog";
import { coerceWhopTimestamp, mapMembershipStatus } from "@/lib/commerce/whop-rules";

/**
 * Whop adapter.
 *
 * Follows the same truthfulness boundary as every other Klinikos external
 * integration: when credentials are absent the adapter reports
 * `pending_connection` and grants nothing. It never fabricates a membership, and a
 * failed verification is reported as a failure rather than degraded into a grant.
 */

const DEFAULT_API_BASE = "https://api.whop.com";
const DEFAULT_CHECKOUT_BASE = "https://whop.com";
const REQUEST_TIMEOUT_MS = 10_000;

export type WhopAdapterStatus = {
  configured: boolean;
  mode: "connected" | "pending_connection";
  webhookConfigured: boolean;
  missing: string[];
  purchasableTierKeys: string[];
};

export function whopAdapterStatus(env: NodeJS.ProcessEnv = process.env): WhopAdapterStatus {
  const missing: string[] = [];
  if (!env.WHOP_API_KEY?.trim()) missing.push("WHOP_API_KEY");
  if (!env.WHOP_WEBHOOK_SECRET?.trim()) missing.push("WHOP_WEBHOOK_SECRET");

  const purchasable = purchasableTiers(env as Record<string, string | undefined>).filter((entry) => entry.purchasable);
  if (!purchasable.length) missing.push("at least one WHOP_PLAN_* plan id");

  const configured = Boolean(env.WHOP_API_KEY?.trim()) && purchasable.length > 0;
  return {
    configured,
    mode: configured ? "connected" : "pending_connection",
    webhookConfigured: Boolean(env.WHOP_WEBHOOK_SECRET?.trim()),
    missing,
    purchasableTierKeys: purchasable.map((entry) => entry.tier.key),
  };
}

export function whopWebhookSecret(env: NodeJS.ProcessEnv = process.env) {
  return env.WHOP_WEBHOOK_SECRET?.trim() || null;
}

export function planIdForTier(tier: AccessTier, env: NodeJS.ProcessEnv = process.env) {
  return env[tier.planEnvVar]?.trim() || null;
}

export function tierForPlanId(planId: string | null | undefined, env: NodeJS.ProcessEnv = process.env) {
  return resolveTierForPlan(planId, env as Record<string, string | undefined>);
}

/**
 * Build the hosted Whop checkout URL for a plan.
 *
 * The opaque `state` is our own correlation value; the return leg looks it up
 * server-side rather than trusting anything the browser sends back.
 */
export function buildWhopCheckoutUrl(planId: string, state: string, env: NodeJS.ProcessEnv = process.env) {
  const base = (env.WHOP_CHECKOUT_BASE?.trim() || DEFAULT_CHECKOUT_BASE).replace(/\/$/, "");
  const url = new URL(`${base}/checkout/${encodeURIComponent(planId)}`);
  url.searchParams.set("state", state);
  const appUrl = (env.NEXT_PUBLIC_APP_URL?.trim() || "").replace(/\/$/, "");
  if (appUrl) url.searchParams.set("redirect_url", `${appUrl}/entry/return?state=${encodeURIComponent(state)}`);
  return url.toString();
}

export type VerifiedWhopMembership = {
  membershipId: string;
  membershipStatus: string;
  entitlementState: ReturnType<typeof mapMembershipStatus>;
  planId: string | null;
  productId: string | null;
  userId: string | null;
  email: string | null;
  validUntil: Date | null;
  tier: AccessTier | undefined;
};

type MembershipVerification =
  | { ok: true; membership: VerifiedWhopMembership }
  | { ok: false; reason: "not_configured" | "not_found" | "unauthorized" | "upstream_error" | "unmapped_plan" };

/**
 * Confirm a membership directly with Whop. This is the authoritative check used on
 * the checkout return leg, where the browser cannot be trusted, and as a periodic
 * revalidation for stored entitlements.
 */
export async function verifyWhopMembership(membershipId: string, env: NodeJS.ProcessEnv = process.env): Promise<MembershipVerification> {
  const apiKey = env.WHOP_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const base = (env.WHOP_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${base}/api/v2/memberships/${encodeURIComponent(membershipId)}`, {
      headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    return { ok: false, reason: "upstream_error" };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) return { ok: false, reason: "unauthorized" };
  if (response.status === 404) return { ok: false, reason: "not_found" };
  if (!response.ok) return { ok: false, reason: "upstream_error" };

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || typeof payload.id !== "string") return { ok: false, reason: "upstream_error" };

  const planId = typeof payload.plan_id === "string" ? payload.plan_id : null;
  const tier = tierForPlanId(planId, env);
  if (!tier) return { ok: false, reason: "unmapped_plan" };

  const status = typeof payload.status === "string" ? payload.status : "unresolved";
  return {
    ok: true,
    membership: {
      membershipId: payload.id,
      membershipStatus: status,
      entitlementState: mapMembershipStatus(status),
      planId,
      productId: typeof payload.product_id === "string" ? payload.product_id : null,
      userId: typeof payload.user_id === "string" ? payload.user_id : null,
      email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null,
      validUntil: coerceWhopTimestamp(payload.renewal_period_end ?? payload.expires_at ?? null),
      tier,
    },
  };
}

/** Catalog view for the paid-entry page, annotated with what is actually orderable. */
export function accessCatalogView(env: NodeJS.ProcessEnv = process.env) {
  const status = whopAdapterStatus(env);
  return {
    adapter: status,
    tiers: accessTierCatalog.map((tier) => ({
      key: tier.key,
      name: tier.name,
      audience: tier.audience,
      summary: tier.summary,
      capabilities: [...tier.capabilities],
      requiredLegalDocuments: [...tier.requiredLegalDocuments],
      postPurchaseReview: tier.postPurchaseReview,
      purchasable: Boolean(planIdForTier(tier, env)),
    })),
  };
}
