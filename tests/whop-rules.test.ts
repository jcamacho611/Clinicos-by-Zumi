import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { getAccessTier, purchasableTiers, resolveTierForPlan, tierCapabilities } from "@/lib/commerce/whop-catalog";
import {
  checkoutIntentSchema,
  coerceWhopTimestamp,
  entitlementGrants,
  evaluateEntitlement,
  isActionableWebhookEvent,
  mapMembershipStatus,
  parseWhopSignatureHeader,
  verifyWhopSignature,
  whopSignatureDigest,
  whopWebhookEnvelopeSchema,
} from "@/lib/commerce/whop-rules";

const SECRET = "whop_test_secret_value";
const NOW = new Date("2026-08-10T12:00:00.000Z");

function signedHeader(body: string, at: Date = NOW, secret = SECRET) {
  const timestamp = Math.floor(at.getTime() / 1000);
  return `t=${timestamp},v1=${whopSignatureDigest(`${timestamp}.${body}`, secret)}`;
}

describe("Whop webhook signature verification", () => {
  const body = JSON.stringify({ action: "membership.went_valid", data: { id: "mem_123" } });

  it("accepts a correctly signed, current delivery", () => {
    const result = verifyWhopSignature({ rawBody: body, header: signedHeader(body), secret: SECRET, now: NOW });
    expect(result.ok).toBe(true);
  });

  it("rejects a delivery signed with a different secret", () => {
    const header = signedHeader(body, NOW, "another_secret");
    expect(verifyWhopSignature({ rawBody: body, header, secret: SECRET, now: NOW })).toMatchObject({ ok: false, reason: "mismatch" });
  });

  it("rejects a delivery whose body was altered after signing", () => {
    const header = signedHeader(body);
    const tampered = JSON.stringify({ action: "membership.went_valid", data: { id: "mem_attacker" } });
    expect(verifyWhopSignature({ rawBody: tampered, header, secret: SECRET, now: NOW })).toMatchObject({ ok: false, reason: "mismatch" });
  });

  it("rejects a replayed delivery outside the tolerance window", () => {
    const header = signedHeader(body, new Date(NOW.getTime() - 20 * 60 * 1000));
    expect(verifyWhopSignature({ rawBody: body, header, secret: SECRET, now: NOW })).toMatchObject({ ok: false, reason: "stale" });
  });

  it("fails closed when no secret is configured", () => {
    expect(verifyWhopSignature({ rawBody: body, header: signedHeader(body), secret: "", now: NOW })).toMatchObject({ ok: false, reason: "not_configured" });
    expect(verifyWhopSignature({ rawBody: body, header: signedHeader(body), secret: null, now: NOW })).toMatchObject({ ok: false, reason: "not_configured" });
  });

  it("fails closed when the signature header is missing or malformed", () => {
    expect(verifyWhopSignature({ rawBody: body, header: null, secret: SECRET, now: NOW })).toMatchObject({ ok: false, reason: "missing" });
    expect(verifyWhopSignature({ rawBody: body, header: "t=abc,v1=zz", secret: SECRET, now: NOW })).toMatchObject({ ok: false, reason: "malformed" });
  });

  it("rejects an untimestamped digest unless it is explicitly allowed", () => {
    const bare = whopSignatureDigest(body, SECRET);
    expect(verifyWhopSignature({ rawBody: body, header: bare, secret: SECRET, now: NOW })).toMatchObject({ ok: false, reason: "missing_timestamp" });
    expect(verifyWhopSignature({ rawBody: body, header: bare, secret: SECRET, now: NOW, allowUntimestamped: true })).toMatchObject({ ok: true });
  });

  it("accepts a header carrying several candidate signatures during secret rotation", () => {
    const timestamp = Math.floor(NOW.getTime() / 1000);
    const stale = crypto.randomBytes(32).toString("hex");
    const header = `t=${timestamp},v1=${stale},v1=${whopSignatureDigest(`${timestamp}.${body}`, SECRET)}`;
    expect(verifyWhopSignature({ rawBody: body, header, secret: SECRET, now: NOW })).toMatchObject({ ok: true });
  });

  it("parses both supported header shapes", () => {
    expect(parseWhopSignatureHeader(whopSignatureDigest(body, SECRET))).toMatchObject({ ok: true, timestamp: null });
    expect(parseWhopSignatureHeader(signedHeader(body))).toMatchObject({ ok: true, timestamp: Math.floor(NOW.getTime() / 1000) });
  });
});

describe("Whop membership status mapping", () => {
  it("treats only active and trialing memberships as active access", () => {
    expect(mapMembershipStatus("active")).toBe("active");
    expect(mapMembershipStatus("trialing")).toBe("active");
  });

  it("holds past-due memberships in grace rather than granting access", () => {
    expect(mapMembershipStatus("past_due")).toBe("grace");
  });

  it("revokes finished, cancelled, expired and unresolved memberships", () => {
    for (const status of ["completed", "canceled", "expired", "unresolved", "drafted"]) {
      expect(mapMembershipStatus(status)).toBe("revoked");
    }
  });

  it("reports an unrecognised status as unknown instead of guessing", () => {
    expect(mapMembershipStatus("something_new")).toBe("unknown");
    expect(mapMembershipStatus(null)).toBe("unknown");
  });
});

describe("entitlement evaluation", () => {
  const active = { tierKey: "grid_provider", state: "active", validUntil: new Date("2026-09-10T00:00:00.000Z"), revokedAt: null, lastVerifiedAt: NOW };

  it("grants only the capabilities its tier defines", () => {
    const result = evaluateEntitlement(active, NOW);
    expect(result.active).toBe(true);
    expect(result.capabilities).toEqual([...tierCapabilities("grid_provider")]);
    expect(result.capabilities).not.toContain("clinic_workspace");
  });

  it("denies when there is no entitlement at all", () => {
    expect(evaluateEntitlement(null, NOW)).toMatchObject({ active: false, reason: "no_entitlement" });
  });

  it("expires on its own once validUntil passes, even without a revocation webhook", () => {
    const lapsed = { ...active, validUntil: new Date("2026-08-09T00:00:00.000Z") };
    expect(evaluateEntitlement(lapsed, NOW)).toMatchObject({ active: false, reason: "expired" });
  });

  it("never treats a grace or revoked entitlement as access", () => {
    expect(evaluateEntitlement({ ...active, state: "grace" }, NOW)).toMatchObject({ active: false, reason: "grace" });
    expect(evaluateEntitlement({ ...active, state: "revoked", revokedAt: NOW }, NOW)).toMatchObject({ active: false, reason: "revoked" });
  });

  it("treats a revocation timestamp as authoritative over a stale active state", () => {
    const contradictory = { ...active, revokedAt: new Date("2026-08-10T11:00:00.000Z") };
    expect(evaluateEntitlement(contradictory, NOW)).toMatchObject({ active: false, reason: "revoked" });
  });

  it("checks a single capability without granting neighbouring ones", () => {
    expect(entitlementGrants(active, "grid_publish_listing", NOW)).toBe(true);
    expect(entitlementGrants(active, "grid_send_request", NOW)).toBe(false);
    expect(entitlementGrants(null, "grid_browse", NOW)).toBe(false);
  });

  it("grants nothing for a tier that is not in the catalog", () => {
    const unknownTier = { ...active, tierKey: "invented_tier" };
    expect(evaluateEntitlement(unknownTier, NOW).capabilities).toEqual([]);
  });
});

describe("plan mapping", () => {
  const env = { WHOP_PLAN_GRID_PROVIDER: "plan_grid_123", WHOP_PLAN_EVALUATOR_PASS: "plan_eval_456" };

  it("resolves a configured plan id to its tier", () => {
    expect(resolveTierForPlan("plan_grid_123", env)?.key).toBe("grid_provider");
  });

  it("refuses to resolve an unmapped or empty plan id", () => {
    expect(resolveTierForPlan("plan_unknown", env)).toBeUndefined();
    expect(resolveTierForPlan(null, env)).toBeUndefined();
    expect(resolveTierForPlan("", env)).toBeUndefined();
  });

  it("does not resolve a tier whose plan id is unconfigured", () => {
    expect(resolveTierForPlan("plan_grid_123", {})).toBeUndefined();
    expect(purchasableTiers(env).filter((entry) => entry.purchasable).map((entry) => entry.tier.key)).toEqual(["evaluator_pass", "grid_provider"]);
  });

  it("exposes every catalog tier by key", () => {
    expect(getAccessTier("clinic_operator")?.audience).toBe("clinic");
    expect(getAccessTier("nope")).toBeUndefined();
  });
});

describe("webhook payload handling", () => {
  it("recognises only the events Klinikos acts on", () => {
    expect(isActionableWebhookEvent("membership.went_valid")).toBe(true);
    expect(isActionableWebhookEvent("membership.went_invalid")).toBe(true);
    expect(isActionableWebhookEvent("some.other.event")).toBe(false);
    expect(isActionableWebhookEvent(undefined)).toBe(false);
  });

  it("accepts the envelope shape Whop sends and keeps unknown fields", () => {
    const parsed = whopWebhookEnvelopeSchema.safeParse({
      id: "evt_1",
      action: "membership.went_valid",
      data: { id: "mem_1", status: "active", plan_id: "plan_1", unexpected: "kept" },
    });
    expect(parsed.success).toBe(true);
  });

  it("coerces both epoch seconds and ISO strings to dates", () => {
    expect(coerceWhopTimestamp(1_786_000_000)?.toISOString()).toBe(new Date(1_786_000_000_000).toISOString());
    expect(coerceWhopTimestamp(1_786_000_000_000)?.toISOString()).toBe(new Date(1_786_000_000_000).toISOString());
    expect(coerceWhopTimestamp("2026-09-01T00:00:00.000Z")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(coerceWhopTimestamp(null)).toBeNull();
    expect(coerceWhopTimestamp("not a date")).toBeNull();
  });
});

describe("checkout intent input", () => {
  it("requires a known tier, a valid email, and explicit acceptance", () => {
    expect(checkoutIntentSchema.safeParse({ tierKey: "grid_provider", email: "Buyer@Example.Test", acceptedTerms: true }).success).toBe(true);
    expect(checkoutIntentSchema.safeParse({ tierKey: "grid_provider", email: "buyer@example.test", acceptedTerms: false }).success).toBe(false);
    expect(checkoutIntentSchema.safeParse({ tierKey: "made_up", email: "buyer@example.test", acceptedTerms: true }).success).toBe(false);
    expect(checkoutIntentSchema.safeParse({ tierKey: "grid_provider", email: "not-an-email", acceptedTerms: true }).success).toBe(false);
  });

  it("normalises the email so entitlements bind to one canonical address", () => {
    const parsed = checkoutIntentSchema.parse({ tierKey: "evaluator_pass", email: "  Buyer@Example.Test ", acceptedTerms: true });
    expect(parsed.email).toBe("buyer@example.test");
  });
});
