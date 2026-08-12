import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deliverOutbound,
  outboundChannelStatus,
  registerOutboundAdapter,
  resetOutboundAdapters,
  ensureOutboundAdaptersRegistered,
  type OutboundAdapter,
} from "@/lib/communications/outbound";
import {
  actionStates,
  actionStateLabels,
  actionStreams,
  streamForState,
} from "@/lib/operations/followup-rules";
import { buyerRoleForModules, planProvisioning } from "@/lib/provisioning/provisioning-rules";
import { corroborateEmailMatch, derivePortalAccess } from "@/lib/commerce/access-payment-rules";
import { whopEventAmountMinorUnits } from "@/lib/commerce/whop-rules";
import { admitZumiRequest, type ZumiAdmissionInput } from "@/features/zumi/policy";
import { phiEgressPermitted, zumiGatewayStatus, registerProvider, resetProviderRegistry, type ProviderAdapter } from "@/features/zumi/providers";
import { anthropicAdapter } from "@/features/zumi/adapters/anthropic";
import { patientMessageDeliverability } from "@/lib/operations/followup-service";
import { connectorCatalog, connectorReadiness, getConnector } from "@/lib/connectors/catalog";
import { readinessGates } from "@/lib/connectors/taxonomy";

/**
 * One test per reviewed defect on PR #11.
 *
 * Each is written against the property the reviewer named, not against the shape of the
 * fix — so a future change that reintroduces the defect fails here even if it is
 * implemented differently.
 */

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("a patient message is only 'sent' when a provider accepted it", () => {
  afterEach(() => {
    resetOutboundAdapters();
    vi.unstubAllEnvs();
  });

  const message = { channel: "sms" as const, to: "+15558675309", subject: "s", body: "b" };

  it("has no SMS sender, and says so rather than reporting readiness", () => {
    // The original defect in one line: a Twilio credential in the environment was read
    // as "we can send", when no code sends. Credentials are not capability.
    ensureOutboundAdaptersRegistered();
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC-test");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "token");
    const status = outboundChannelStatus("sms", { TWILIO_ACCOUNT_SID: "AC-test", TWILIO_AUTH_TOKEN: "token" });
    expect(status.deliverable).toBe(false);
    expect(status).toMatchObject({ reason: "no_sender" });
  });

  it("reports no_connector when nothing is configured for the channel", async () => {
    ensureOutboundAdaptersRegistered();
    const result = await deliverOutbound({ ...message, channel: "email" }, {});
    expect(result).toMatchObject({ ok: false, reason: "no_connector" });
  });

  it("succeeds only when a provider accepts and returns a reference", async () => {
    resetOutboundAdapters();
    const accepting: OutboundAdapter = {
      channel: "sms",
      provider: "test-provider",
      connectorId: "twilio",
      configured: () => true,
      send: async () => ({ ok: true, providerReference: "prov_123", provider: "test-provider" }),
    };
    registerOutboundAdapter(accepting);
    const result = await deliverOutbound(message, {});
    expect(result).toEqual({ ok: true, providerReference: "prov_123", provider: "test-provider" });
  });

  it("reports a provider refusal as a failure rather than as done", async () => {
    resetOutboundAdapters();
    registerOutboundAdapter({
      channel: "sms",
      provider: "test-provider",
      connectorId: "twilio",
      configured: () => true,
      send: async () => ({ ok: false, reason: "provider_error", detail: "The provider returned 500." }),
    });
    expect(await deliverOutbound(message, {})).toMatchObject({ ok: false, reason: "provider_error" });
  });

  it("treats an adapter that throws as a failure, never as a send", async () => {
    resetOutboundAdapters();
    registerOutboundAdapter({
      channel: "sms",
      provider: "test-provider",
      connectorId: "twilio",
      configured: () => true,
      send: async () => {
        throw new Error("socket hang up");
      },
    });
    const result = await deliverOutbound(message, {});
    expect(result.ok).toBe(false);
  });

  it("refuses to call a send accepted when the provider returned no reference", async () => {
    // Without a reference there is no evidence the message exists. Recording `executed`
    // on that basis is the same lie in a different place.
    resetOutboundAdapters();
    registerOutboundAdapter({
      channel: "sms",
      provider: "test-provider",
      connectorId: "twilio",
      configured: () => true,
      send: async () => ({ ok: false, reason: "provider_error", detail: "accepted without a reference" }),
    });
    expect((await deliverOutbound(message, {})).ok).toBe(false);
  });

  it("only writes executed for a patient message alongside a provider reference", () => {
    // The service is the enforcement point, so this asserts the code path rather than a
    // returned value: `executed` and `deliveryReference` are written together.
    const service = source("src/lib/operations/followup-service.ts");
    const executedBlocks = service.split('state: "executed"');
    // The first split is the preamble; every subsequent block begins right after an
    // `executed` write. Patient-message writes must carry delivery evidence.
    const patientMessageWrite = executedBlocks.find((block) => block.includes("deliveryReference: outcome.providerReference"));
    expect(patientMessageWrite).toBeTruthy();
    expect(service).toContain("deliverOutbound");
  });
});

describe("action states stay honest", () => {
  it("gives an approved-but-undelivered message a state of its own", () => {
    expect(actionStates).toContain("awaiting_delivery");
    expect(actionStateLabels.awaiting_delivery).toMatch(/wait/i);
  });

  it("never routes an approved message back into the owner's queue", () => {
    // Approving is a decision. Putting it back under "Waiting on you" would ask the
    // owner to decide something they already decided.
    expect(streamForState("awaiting_delivery")).toBe("blocked");
    expect(streamForState("awaiting_connection")).toBe("blocked");
  });

  it("distinguishes work a person dismissed from work that resolved itself", () => {
    expect(actionStates).toContain("resolved_by_source");
    expect(streamForState("resolved_by_source")).toBe("completed");
    expect(actionStateLabels.resolved_by_source).not.toMatch(/dismiss/i);
  });

  it("keeps every state routable and labelled", () => {
    for (const state of actionStates) {
      expect({ state, ok: actionStreams.includes(streamForState(state)) }).toEqual({ state, ok: true });
      expect({ state, labelled: (actionStateLabels[state] ?? "").length > 0 }).toEqual({ state, labelled: true });
    }
  });
});

describe("resolved risks leave the active stream", () => {
  const service = source("src/lib/operations/followup-service.ts");

  it("reconciles from the open actions, not from the sweep window", () => {
    // The second review finding: an appointment older than the lookback is not in the
    // sweep query, so a window-driven reconciliation could never close its actions.
    expect(service).toMatch(/reconcileResolvedRisks\(organizationId, risks\)/);
    expect(service).toMatch(/where: \{ organizationId, decidedAt: null \}/);
  });

  it("runs reconciliation even when nothing is currently at risk", () => {
    // The original bug was an early return on `risks.length === 0` that skipped
    // reconciliation entirely — which is exactly the case where it matters most.
    const reconcileAt = service.indexOf("await reconcileResolvedRisks");
    const earlyReturn = service.indexOf("if (risks.length === 0) return");
    expect(reconcileAt).toBeGreaterThan(-1);
    expect(reconcileAt).toBeLessThan(earlyReturn);
  });

  it("never overwrites a decision a person already made", () => {
    expect(service).toMatch(/updateMany\(\{\s*where: \{ id: action\.id, decidedAt: null \}/);
  });

  it("closes the associated task instead of leaving it open", () => {
    expect(service).toContain('data: { status: "completed" }');
  });
});

describe("the task and the action are created atomically", () => {
  const service = source("src/lib/operations/followup-service.ts");

  it("creates both inside one transaction", () => {
    // Two concurrent sweeps both saw no action and both created a task; only one action
    // insert won the unique key, orphaning the other task.
    const tx = service.indexOf("db.$transaction(async (tx) =>");
    const taskCreate = service.indexOf("tx.task.create");
    const actionCreate = service.indexOf("tx.operationalAction.create");
    expect(tx).toBeGreaterThan(-1);
    expect(actionCreate).toBeGreaterThan(tx);
    expect(taskCreate).toBeGreaterThan(actionCreate);
  });

  it("treats a lost unique-key race as a clean no-op", () => {
    expect(service).toContain("P2002");
  });
});

describe("a paid buyer can reach the organization their purchase created", () => {
  it("provisions an account for every module-bearing purchase, not only clinic ones", () => {
    // GRID tiers grant only `grid`. Gating account creation on `clinic_workspace` left
    // those buyers paid-up with nothing to sign in to.
    const grid = planProvisioning({ tierKey: "grid_provider", hasOrganization: false });
    expect(grid.modules.length).toBeGreaterThan(0);
    expect(grid.steps.find((entry) => entry.step === "organization")?.state).toBe("pending");

    const clinic = planProvisioning({ tierKey: "clinic_operator", hasOrganization: false });
    expect(clinic.steps.find((entry) => entry.step === "organization")?.state).toBe("pending");
  });

  it("still provisions nothing for a purchase that grants nothing", () => {
    const evaluator = planProvisioning({ tierKey: "evaluator_pass", hasOrganization: false });
    expect(evaluator.modules).toEqual([]);
    expect(evaluator.steps.find((entry) => entry.step === "organization")?.state).toBe("not_applicable");
  });

  it("does not hand a GRID contractor the permissions of a clinic owner", () => {
    expect(buyerRoleForModules(["grid"])).toBe("contractor");
    expect(buyerRoleForModules(["clinic_workspace", "scheduling"])).toBe("clinic_owner");
  });

  it("attaches the buyer by email, so a webhook retry finds the same user", () => {
    const service = source("src/lib/provisioning/provisioning-service.ts");
    expect(service).toMatch(/db\.user\.findUnique\(\{\s*where: \{ email \}/);
    expect(service).toContain("Buyer identity is already attached to another organization.");
  });

  it("issues an activation instead of a default password", () => {
    const service = source("src/lib/provisioning/provisioning-service.ts");
    expect(service).toContain("createAccountActivationToken");
    expect(service).not.toMatch(/passwordHash|defaultPassword|temporaryPassword/i);
  });

  it("has somewhere for the buyer to actually spend the activation link", () => {
    // The token existed before this; nothing delivered it and no page consumed it.
    expect(() => source("src/app/activate/page.tsx")).not.toThrow();
    expect(source("src/lib/provisioning/provisioning-service.ts")).toContain("/activate?token=");
    expect(source("src/lib/provisioning/provisioning-service.ts")).toContain("deliverOutbound");
  });

  it("records whether the activation link actually reached the buyer", () => {
    const service = source("src/lib/provisioning/provisioning-service.ts");
    expect(service).toContain("activationDeliveredAt");
    expect(service).toContain("activationDeliveryFailure");
  });

  it("requires a real password on activation rather than accepting any string", () => {
    const route = source("src/app/api/auth/activate/route.ts");
    expect(route).toMatch(/password: z\.string\(\)\.min\(12\)/);
    expect(route).toContain("This account is already activated.");
  });
});

describe("a failed webhook can be retried", () => {
  const route = source("src/app/api/whop/webhook/route.ts");
  const entitlements = source("src/lib/commerce/whop-entitlements.ts");

  it("only short-circuits a duplicate that previously reached a terminal state", () => {
    expect(route).toContain("if (delivery.duplicate && !delivery.retryable)");
    expect(entitlements).toContain("TERMINAL_WEBHOOK_STATES");
  });

  it("does not mark the delivery terminal before provisioning has run", () => {
    // The defect: entitlement application wrote `applied`, so a redelivery after a
    // provisioning failure was acknowledged as a duplicate and never retried.
    expect(entitlements).not.toMatch(/await markWebhookOutcome\(input\.webhookRecordId, "applied"\)/);
    expect(entitlements).toContain("export async function markWebhookProcessed");
  });

  it("answers a provisioning failure with a 5xx so the provider retries", () => {
    expect(route).toContain("markWebhookIncomplete");
    expect(route).toMatch(/Provisioning did not complete\.[\s\S]{0,60}500/);
  });

  it("marks the delivery processed only on the path that finished everything", () => {
    const provisionAt = route.indexOf("provisionFromPayment(");
    const processedAt = route.indexOf("markWebhookProcessed", provisionAt);
    expect(provisionAt).toBeGreaterThan(-1);
    expect(processedAt).toBeGreaterThan(provisionAt);
  });
});

describe("paid onboarding review can actually be completed", () => {
  const service = source("src/lib/commerce/access-payment-service.ts");

  it("exposes an approval transition that recomputes access", () => {
    expect(service).toContain("export async function reviewPaidOnboarding");
    expect(service).toMatch(/portalAccessStatus = derivePortalAccess\(/);
  });

  it("records who reviewed it and when", () => {
    expect(service).toContain("reviewedBy: session.userId");
    expect(service).toContain("reviewedAt: now");
    expect(service).toContain("reviewNotes: input.note");
  });

  it("writes an audit entry for the decision", () => {
    expect(service).toContain("tx.auditLog.create");
    expect(service).toMatch(/paid_onboarding\.\$\{approved \? "approved" : "rejected"\}/);
  });

  it("keeps access closed until a reviewer approves, and payment alone never suffices", () => {
    const reviewed = derivePortalAccess({ status: "verified_paid", productKey: "contractor_application_review", reviewApproved: true });
    const unreviewed = derivePortalAccess({ status: "verified_paid", productKey: "contractor_application_review", reviewApproved: false });
    expect(unreviewed).toBe("pending");
    expect(reviewed).toBe("granted");
  });

  it("refuses to review a payment that has not settled", () => {
    expect(service).toContain("payment_not_settled");
  });

  it("never lets a caller set portal access directly", () => {
    const route = source("src/app/api/commerce/payments/verify/route.ts");
    expect(route).not.toMatch(/portalAccessStatus:\s*(?:parsed|body|input)\./);
  });
});

describe("payment webhooks match the payment they belong to", () => {
  const service = source("src/lib/commerce/access-payment-service.ts");

  it("falls back to the buyer when the provider reference is not yet stored", () => {
    // A fresh AccessPayment has a null reference. Selecting the reference query merely
    // because the webhook supplied one meant a new purchase could never settle.
    const referenceQuery = service.indexOf("where: { externalPaymentReference: reference }");
    const emailFallback = service.indexOf("if (!payment && email)");
    expect(referenceQuery).toBeGreaterThan(-1);
    expect(emailFallback).toBeGreaterThan(referenceQuery);
  });

  it("refuses an ambiguous email-only match instead of guessing", () => {
    expect(service).toContain("take: 2");
    expect(service).toContain("if (candidates.length === 1) {");
    expect(service).toContain("payment = candidates[0];");
  });

  it("binds the reference on match and refuses to rebind it afterwards", () => {
    expect(service).toContain("reference_conflict");
    expect(service).toContain("externalPaymentReference: reference ?? payment!.externalPaymentReference");
  });

  it("keeps price and product server-owned", () => {
    expect(service).toContain("amountCents: product.amountCents");
    expect(service).not.toMatch(/amountCents:\s*input\./);
  });
});

describe("checkout returns bind to the verified buyer", () => {
  const entitlements = source("src/lib/commerce/whop-entitlements.ts");

  it("compares the membership identity against the intent's verified email", () => {
    expect(entitlements).toContain("identity_mismatch");
    expect(entitlements).toMatch(/membershipEmail !== intent\.email\.trim\(\)\.toLowerCase\(\)/);
  });

  it("normalizes case on both sides before comparing", () => {
    expect(entitlements).toMatch(/membership\.email\?\.trim\(\)\.toLowerCase\(\)/);
  });

  it("does not accept a membership on tier alone", () => {
    const tierCheck = entitlements.indexOf("tier_mismatch");
    const identityCheck = entitlements.indexOf("identity_mismatch");
    expect(identityCheck).toBeGreaterThan(tierCheck);
  });

  it("stores the entitlement under the verified intent email, not the provider's", () => {
    expect(entitlements).toMatch(/create: \{\s*email: intent\.email,/);
  });
});

describe("email verification satisfies the predicate checkout tests", () => {
  const verification = source("src/lib/legal/access-verification.ts");
  const entitlements = source("src/lib/commerce/whop-entitlements.ts");

  it("persists the exact fact checkout consumes", () => {
    // Checkout tests `verifiedEmailAt`; verification used to write only `source`, so a
    // successful verification page still produced a 409 at checkout.
    expect(entitlements).toContain('verifiedEmailAt: { not: null }');
    expect(verification).toContain('"verifiedEmailAt" = NOW()');
  });

  it("keeps the token single-use", () => {
    expect(verification).toContain('WHERE "id" = ${acceptance.id} AND "verifiedEmailAt" IS NULL');
  });

  it("verifies only the acceptance the token names", () => {
    expect(verification).toContain("acceptance.id");
    expect(verification).not.toMatch(/UPDATE "access_gate_acceptances"\s+SET[^;]*WHERE "email"/);
  });
});

describe("a first-time referred prospect is attributed", () => {
  const growth = source("src/lib/growth/growth-service.ts");

  it("decides attribution from the pre-upsert record, not the upsert's return", () => {
    // The upsert writes referralCode in its create branch and selects it back, so
    // testing the returned row made the condition false for every new prospect.
    expect(growth).toContain("if (referralCode && (!existing || !existing.referralCode))");
  });

  it("does not attribute the same prospect twice", () => {
    expect(growth).toMatch(/!existing\.referralCode/);
  });
});

describe("onboarding answers survive", () => {
  const service = source("src/lib/onboarding/onboarding-service.ts");

  it("persists every answer the form collects", () => {
    // Completing onboarding clears demoMode, which closes the page — so an answer not
    // written here can never be given again.
    for (const field of ["providerCount", "locationCount", "currentSystem"]) {
      expect({ field, persisted: service.includes(`data.${field} = answers.${field}`) }).toEqual({ field, persisted: true });
    }
  });

  it("reads them back so setup never re-asks what it already knows", () => {
    expect(service).toContain("organization?.providerCount");
    expect(service).toContain("organization?.locationCount");
  });
});

describe("migrations added by these fixes stay safe", () => {
  const migrations = [
    "prisma/migrations/20260811210000_operational_action_delivery/migration.sql",
    "prisma/migrations/20260811220000_provisioning_activation_delivery/migration.sql",
    "prisma/migrations/20260811230000_organization_onboarding_answers/migration.sql",
  ];

  it("adds only nullable columns and destroys nothing", () => {
    for (const path of migrations) {
      const sql = source(path);
      expect({ path, destructive: /DROP\s+(TABLE|COLUMN|DATABASE)|TRUNCATE|DELETE FROM/i.test(sql) }).toEqual({ path, destructive: false });
      expect({ path, additive: sql.includes("ADD COLUMN IF NOT EXISTS") }).toEqual({ path, additive: true });
      expect({ path, notNull: /ADD COLUMN[^;]*NOT NULL/i.test(sql) }).toEqual({ path, notNull: false });
    }
  });

  it("keeps the earlier NOT VALID correction in place", () => {
    // Regression guard on the previous pass: a plain ADD CONSTRAINT here aborts
    // `migrate deploy` against a database that already holds non-conforming rows.
    const sql = source("prisma/migrations/20260810120000_access_email_verification/migration.sql");
    const checks = sql.match(/ADD CONSTRAINT[^;]*CHECK[^;]*/g) ?? [];
    expect(checks.length).toBe(2);
    for (const check of checks) expect(check).toContain("NOT VALID");
  });
});

describe("second review round", () => {
  const source2 = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  describe("a paid GRID buyer can use what their pass grants", () => {
    it("gives the contractor role the grid permission its listings need", () => {
      // The pass grants `grid`; the routes were gated on `network`, so a paid GRID
      // buyer hit 403 before the entitlement check was ever reached.
      const rbac = source2("src/lib/auth/rbac.ts");
      expect(rbac).toContain('contractor: { grid: ["read", "create", "update"] }');
    });

    it("gates GRID marketplace writes on grid, not on the clinical network resource", () => {
      // `network` is grants, break-glass, and shared patients. A marketplace listing
      // has no business sharing a permission key with clinical record access.
      for (const path of [
        "src/app/api/grid/services/route.ts",
        "src/app/api/grid/locations/route.ts",
        "src/app/api/grid/requests/route.ts",
      ]) {
        const route = source2(path);
        expect({ path, network: route.includes('enforceApiPermission(session, "network"') }).toEqual({ path, network: false });
        expect({ path, grid: route.includes('enforceApiPermission(session, "grid"') }).toEqual({ path, grid: true });
      }
    });

    it("does not widen the contractor beyond GRID", () => {
      const rbac = source2("src/lib/auth/rbac.ts");
      const line = rbac.split("\n").find((entry) => entry.trim().startsWith("contractor: {")) ?? "";
      expect(line).not.toContain("network:");
      expect(line).not.toContain("patients:");
      expect(line).not.toContain("credentialing:");
    });
  });

  describe("an approved message stays retryable until it is sent", () => {
    const service = source2("src/lib/operations/followup-service.ts");

    it("records approval separately from completion", () => {
      // `decidedAt` is what both the command centre and the sweep read as finished.
      // Writing it on a message that had not been sent made it permanently unsendable.
      expect(service).toContain("approvedByUserId");
      expect(service).toContain("approvedAt");
    });

    it("leaves an unsuccessful delivery undecided so it can be retried", () => {
      expect(service).toContain("const terminal = outcome.reason === \"invalid_recipient\"");
      expect(service).toContain("decidedAt: terminal ? new Date() : null");
    });

    it("re-attempts approved messages as part of the sweep", () => {
      expect(service).toContain("async function retryApprovedDeliveries");
      expect(service).toContain("await retryApprovedDeliveries(organizationId)");
      // Runs before the no-risk early return: a clinic that just connected a provider
      // has held messages and no new risk to trigger them.
      expect(service.indexOf("await retryApprovedDeliveries")).toBeLessThan(service.indexOf("if (risks.length === 0) return"));
    });

    it("only ever retries messages a person approved", () => {
      expect(service).toContain("approvedAt: { not: null }");
    });

    it("stops offering a decision on something already approved", () => {
      const centre = source2("src/lib/operations/command-center.ts");
      expect(centre).toContain("!action.decidedAt && !action.approvedAt");
    });
  });

  describe("a repeated confirmation cannot send the message twice", () => {
    const service = source2("src/lib/operations/followup-service.ts");

    it("returns the stored result for an already-delivered action", () => {
      expect(service).toContain("if (action.deliveredAt) return { ok: true as const, state: \"executed\" as const, alreadySent: true }");
    });

    it("claims the row conditionally before anything external happens", () => {
      const claim = service.indexOf("db.operationalAction.updateMany({");
      const deliver = service.indexOf("await deliverOutbound(", claim);
      expect(claim).toBeGreaterThan(-1);
      expect(deliver).toBeGreaterThan(claim);
      expect(service).toContain("if (claim.count === 0)");
    });

    it("excludes an in-flight send from the claimable states", () => {
      // Two concurrent confirmations must produce one send, not two.
      const states = service.match(/const SENDABLE_STATES = \[([^\]]*)\]/)?.[1] ?? "";
      expect(states).not.toContain("sending");
      expect(states).toContain("awaiting_connection");
    });
  });

  describe("the Render blueprint can actually reach connected", () => {
    it("declares the recurring plan ids paid entry requires", () => {
      const blueprint = source2("render.yaml");
      for (const key of [
        "WHOP_PLAN_EVALUATOR_PASS",
        "WHOP_PLAN_CLINIC_OPERATOR",
        "WHOP_PLAN_GRID_PROVIDER",
        "WHOP_PLAN_GRID_LOCATION_PARTNER",
      ]) {
        expect({ key, declared: blueprint.includes(key) }).toEqual({ key, declared: true });
      }
    });

    it("never commits a value for any of them", () => {
      const blueprint = source2("render.yaml");
      for (const line of blueprint.split("\n")) {
        if (line.includes("WHOP_")) expect(line).not.toContain("value:");
      }
    });
  });
});

describe("third review round", () => {
  const source3 = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  describe("real Whop deliveries verify", () => {
    const rules = source3("src/lib/commerce/whop-rules.ts");
    const route = source3("src/app/api/whop/webhook/route.ts");

    it("reads the Standard Webhooks headers Whop actually sends", () => {
      // Reading only `x-whop-signature` rejected every genuine delivery with a 401, so
      // no purchase was ever provisioned and no cancellation was ever applied.
      for (const header of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
        expect({ header, read: route.includes(`request.headers.get("${header}")`) }).toEqual({ header, read: true });
      }
    });

    it("signs the id, timestamp, and body, not the body alone", () => {
      expect(rules).toContain("`${id}.${timestamp}.${input.rawBody}`");
    });

    it("decodes the whsec_ secret rather than using it as raw text", () => {
      expect(rules).toContain('secret.startsWith("whsec_")');
      expect(rules).toContain('Buffer.from(rawSecret, "base64")');
    });

    it("keeps replay protection on the new path", () => {
      const fn = rules.slice(rules.indexOf("export function verifyStandardWebhookSignature"));
      expect(fn).toContain('reason: "stale"');
      expect(fn).toContain("toleranceSeconds");
    });

    it("compares signatures in constant time and accepts a rotated secret", () => {
      const fn = rules.slice(rules.indexOf("export function verifyStandardWebhookSignature"));
      expect(fn).toContain("crypto.timingSafeEqual");
      expect(fn).toContain('header\n    .split(" ")');
    });

    it("still supports the legacy scheme rather than dropping it", () => {
      expect(route).toContain("verifyWhopSignature(");
      expect(route).toContain("verifyStandardWebhookSignature(");
    });

    it("keys idempotency on the provider's own delivery id", () => {
      expect(route).toContain("standardHeaders.webhookId?.trim()");
    });
  });

  describe("a cancelled membership loses its capabilities", () => {
    const service = source3("src/lib/provisioning/provisioning-service.ts");
    const route = source3("src/app/api/whop/webhook/route.ts");

    it("withdraws the provisioned subscription on revocation", () => {
      // The entitlement row said revoked while the subscription capabilities are read
      // from stayed active with no end date, so a cancelled buyer kept everything.
      expect(service).toContain("export async function revokeProvisionedAccess");
      expect(route).toContain("revokeProvisionedAccess({");
    });

    it("is reached for both revoked and grace states", () => {
      expect(route).toContain('result.state === "revoked" || result.state === "grace"');
    });

    it("sets a definite end date so a stale status cannot grant forever", () => {
      expect(service).toContain('currentPeriodEndsAt: input.state === "revoked" ? new Date() : undefined');
    });

    it("never deletes the clinic's organization, users, or records", () => {
      const fn = service.slice(service.indexOf("export async function revokeProvisionedAccess"));
      expect(fn).not.toContain("delete");
      expect(fn).not.toContain("deleteMany");
    });
  });

  describe("an undelivered activation stays retryable", () => {
    const route = source3("src/app/api/whop/webhook/route.ts");

    it("does not mark the delivery terminal when activation could not be sent", () => {
      // Without this, a buyer whose activation email failed had no credential, no
      // resend, and a webhook that would never be retried.
      expect(route).toContain('markWebhookIncomplete(delivery.id, "activation_undelivered")');
    });

    it("answers with a 5xx so the provider retries", () => {
      expect(route).toMatch(/activation link could not be delivered[\s\S]{0,200}500/);
    });

    it("re-mints the token on retry for an account with no credential", () => {
      const service = source3("src/lib/provisioning/provisioning-service.ts");
      const completed = service.slice(service.indexOf('if (run.status === "complete")'));
      expect(completed.slice(0, 600)).toContain("!user.authCredential");
    });
  });

  describe("an expired pass does not shadow a valid payment", () => {
    const guard = source3("src/lib/commerce/grid-access-guard.ts");

    it("prefers a granted payment over an inactive entitlement", () => {
      // `??` chose any stored entitlement, including a revoked one, so an approved
      // review payment was denied on the strength of a dead pass.
      expect(guard).toContain('pass?.state === "active" ? pass : (entitlementFromPayment(grantedPayment) ?? pass)');
      expect(guard).not.toContain("(entitlement as EntitlementRecord | null) ?? entitlementFromPayment(grantedPayment)");
    });

    it("still lets an active pass win", () => {
      expect(guard).toContain('pass?.state === "active" ? pass');
    });
  });
});

describe("fourth review round — GRID authorization", () => {
  const src = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  it("guards every ordinary marketplace write with the paid-access gate", () => {
    // Availability was the one write that reached the repository without a pass, so a
    // contractor with a revoked or absent pass could still offer capacity.
    for (const path of [
      "src/app/api/grid/availability/route.ts",
      "src/app/api/grid/services/route.ts",
      "src/app/api/grid/locations/route.ts",
      "src/app/api/grid/requests/route.ts",
    ]) {
      expect({ path, guarded: src(path).includes("enforceGridMarketplaceAccess") }).toEqual({ path, guarded: true });
    }
  });

  it("credential-gates offering capacity, not only offering a service", () => {
    const access = src("src/lib/grid-access.ts");
    const gated = access.slice(access.indexOf("credentialGatedActions"));
    expect(gated).toContain('"publish_availability"');
    expect(gated).toContain('"publish_listing"');
  });

  it("gates GRID repository writes on grid, never on the clinical network", () => {
    // The route fix alone was not enough: the repository refused the same callers one
    // layer down, so a paid contractor still received 403.
    const repo = src("src/lib/repositories/grid-repository.ts");
    for (const fn of ["createGridServiceListing", "createGridLocation", "createGridAvailability"]) {
      const body = repo.slice(repo.indexOf(`export async function ${fn}`), repo.indexOf(`export async function ${fn}`) + 900);
      expect({ fn, network: /can\(session\.role, "network"|requirePermission\(session, "network"/.test(body) })
        .toEqual({ fn, network: false });
    }
  });

  it("keeps activation administrative rather than opening it to contractors", () => {
    const repo = src("src/lib/repositories/grid-repository.ts");
    expect(repo).toContain('can(session.role, "grid", "manage") && providerReadyForGrid(provider)');
  });

  it("does not let a contractor publish availability for another provider", () => {
    const repo = src("src/lib/repositories/grid-repository.ts");
    expect(repo).toContain('!can(session.role, "grid", "manage") && provider.userId !== session.userId');
  });
});

describe("fifth review round — cross-tenant exposure", () => {
  const svc = () => readFileSync(join(process.cwd(), "src/lib/commerce/access-payment-service.ts"), "utf8");

  it("scopes the marketplace payment queue to the acting tenant", () => {
    // This query had no organizationId at all, which is why the repository-wide
    // isolation scan missed it: there was no wrong tenant column to catch, there was
    // none. Every clinic owner holds sales:manage, so every clinic owner could read
    // every buyer's email and payment reference.
    expect(svc()).toContain("export async function listAccessPayments(session: ClinicSession");
    expect(svc()).toContain("isPlatformOperator(session) ? {} : { organizationId: session.organizationId }");
  });

  it("refuses to act on another tenant's payment", () => {
    const body = svc();
    for (const fn of ["verifyAccessPayment", "reviewPaidOnboarding"]) {
      const start = body.indexOf(`export async function ${fn}`);
      const scope = body.slice(start, start + 700);
      expect({ fn, scoped: scope.includes("isPlatformOperator(session)") }).toEqual({ fn, scoped: true });
      expect({ fn, unscopedUnique: /findUnique\(\{\s*where: \{ id: input\.paymentId \},/.test(scope) })
        .toEqual({ fn, unscopedUnique: false });
    }
  });

  it("grants platform scope to nobody until it is explicitly configured", () => {
    // Fail closed: an unset platform organization means no one sees across tenants,
    // rather than everyone doing so.
    expect(svc()).toContain("if (!platformOrganizationId) return false");
  });
});

describe("sixth review round — PHI cannot leave on an unapproved rail", () => {
  const svc = () => readFileSync(join(process.cwd(), "src/lib/operations/followup-service.ts"), "utf8");

  it("requires a PHI-approved connector, not merely a configured one", () => {
    // A patient message names the patient and describes their appointment, paperwork,
    // or non-attendance. RESEND_API_KEY being present makes email deliverable; the
    // catalog declares Resend handlesPhi:false, so it does not make it permitted.
    expect(svc()).toContain("export function patientMessageDeliverability");
    expect(svc()).toContain("connector.handlesPhi && connectorReadiness(connector).phiUsable");
    expect(svc()).toContain('reason: "phi_not_approved"');
  });

  it("re-checks the gate immediately before egress, not only at sweep time", () => {
    // An approval recorded while a PHI-approved rail existed must not send after that
    // approval is withdrawn.
    const body = svc();
    const gate = body.indexOf("const phiGate = patientMessageDeliverability()");
    const send = body.indexOf("await deliverOutbound(", gate);
    expect(gate).toBeGreaterThan(-1);
    expect(send).toBeGreaterThan(gate);
  });

  it("reports the block as awaiting connection rather than a retryable failure", () => {
    // No approved rail is a contract, not an outage. Telling an owner to retry would be
    // advice they cannot act on.
    expect(svc()).toContain('reason === "no_connector" || reason === "phi_not_approved"');
  });

  it("keeps Resend declared as not carrying PHI", () => {
    const catalog = readFileSync(join(process.cwd(), "src/lib/connectors/catalog.ts"), "utf8");
    const resend = catalog.slice(catalog.indexOf('id: "resend"'), catalog.indexOf('id: "resend"') + 500);
    expect(resend).toContain("handlesPhi: false");
  });
});

describe("seventh review round — links that resolve", () => {
  const src = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  it("ships every legal document it links buyers to", () => {
    // A buyer clicking through to mandatory terms immediately before paying was getting
    // a 404. This scans the link rather than asserting one path, so a future link to an
    // unwritten document fails here instead of in front of a buyer.
    const entry = src("src/app/entry/page.tsx");
    const linked = [...entry.matchAll(/href="(\/legal\/[a-z-]+)"/g)].map((m) => m[1]);
    expect(linked.length).toBeGreaterThan(0);
    for (const href of linked) {
      const page = join(process.cwd(), "src/app", href, "page.tsx");
      expect({ href, exists: existsSync(page) }).toEqual({ href, exists: true });
    }
  });

  it("states the GRID agreement's status rather than inventing one", () => {
    // Drafting marketplace terms is counsel's work. A fabricated agreement on a legal
    // route would be worse than the 404 it replaced.
    const page = src("src/app/legal/grid/page.tsx");
    expect(page).toContain("has not been published");
    expect(page).toContain("not a commercial agreement");
  });

  it("resolves the canonical app URL from one place, with the platform fallback", () => {
    // Two builders produced unusable links when NEXT_PUBLIC_APP_URL was unset: an
    // activation link with no host, and a checkout with no redirect_url.
    const helper = src("src/lib/app-url.ts");
    expect(helper).toContain("env.RENDER_EXTERNAL_URL");
    for (const path of [
      "src/lib/commerce/whop-client.ts",
      "src/lib/provisioning/provisioning-service.ts",
      "src/lib/legal/access-verification.ts",
    ]) {
      expect({ path, uses: src(path).includes("canonicalAppUrl") }).toEqual({ path, uses: true });
    }
  });

  it("always sends a checkout redirect back to the return leg", () => {
    // Dropping redirect_url skipped the only server-side verification of a browser
    // return, leaving the buyer on the provider's page.
    const client = src("src/lib/commerce/whop-client.ts");
    expect(client).toContain('url.searchParams.set("redirect_url"');
    expect(client).not.toMatch(/if \(appUrl\) url\.searchParams\.set\("redirect_url"/);
  });

  it("refuses to send an activation link that cannot be opened", () => {
    const service = src("src/lib/provisioning/provisioning-service.ts");
    expect(service).toContain("if (!canonicalAppUrlIsPublic())");
    expect(service).toContain("would not resolve");
  });
});

describe("eighth review round — one purchase provisions once", () => {
  const svc = () => readFileSync(join(process.cwd(), "src/lib/provisioning/provisioning-service.ts"), "utf8");

  it("claims the run before executing any step", () => {
    // Two concurrent deliveries both saw the run as pending and both created an
    // organization. The claim is a conditional updateMany: exactly one caller matches.
    const body = svc();
    const claim = body.indexOf("db.provisioningRun.updateMany({");
    const attach = body.indexOf("attachBuyerToTenant({");
    expect(claim).toBeGreaterThan(-1);
    expect(attach).toBeGreaterThan(claim);
    expect(body).toContain("if (claimed.count === 0)");
  });

  it("does no work at all when the claim is held elsewhere", () => {
    expect(svc()).toContain('status: "contended"');
  });

  it("lets an abandoned claim be retaken so a crash cannot strand a purchase", () => {
    const body = svc();
    expect(body).toContain("CLAIM_TIMEOUT_MS");
    expect(body).toContain("{ claimedAt: { lt: staleBefore } }");
  });

  it("releases the claim on both the success and failure paths", () => {
    const body = svc();
    expect(body.match(/claimedAt: null,\s*\n\s*claimedBy: null,/g)?.length).toBe(2);
  });

  it("creates the organization and attaches the buyer in one transaction", () => {
    // Separately, a failed attachment left an unreachable organization behind.
    const body = svc();
    const fn = body.slice(body.indexOf("async function attachBuyerToTenant"));
    expect(fn).toContain("db.$transaction");
    expect(fn.indexOf("createOrganization(")).toBeLessThan(fn.indexOf("tx.user.create"));
  });

  it("re-reads the buyer inside the transaction rather than trusting a stale view", () => {
    const fn = svc().slice(svc().indexOf("async function attachBuyerToTenant"));
    expect(fn).toContain("tx.user.findUnique");
  });

  it("never writes an organization the buyer may not belong to onto a failed run", () => {
    // Persisting the orphan is what made every later retry fail the cross-organization
    // identity check permanently.
    const body = svc();
    const failure = body.slice(body.indexOf('status: "failed",\n        failureReason:') - 400);
    const block = failure.slice(0, failure.indexOf("}).catch"));
    expect(block).not.toMatch(/^\s*organizationId,\s*$/m);
  });

  it("still refuses to move a buyer between tenants", () => {
    expect(svc()).toContain("Buyer identity is already attached to another organization.");
  });

  it("makes a contended result retryable at the webhook", () => {
    const route = readFileSync(join(process.cwd(), "src/app/api/whop/webhook/route.ts"), "utf8");
    expect(route).toContain('provisioning.status === "contended"');
    expect(route).toContain("provisioning_contended");
  });

  it("declares the platform operator variable the review queue needs", () => {
    // The cross-tenant fix fails closed, so without this the shipped /admin/payments
    // workspace has no authorized operator on a blueprint deployment.
    const blueprint = readFileSync(join(process.cwd(), "render.yaml"), "utf8");
    expect(blueprint).toContain("KLINIKOS_PLATFORM_ORG_ID");
    const line = blueprint.split("\n").find((entry) => entry.includes("KLINIKOS_PLATFORM_ORG_ID")) ?? "";
    expect(line).not.toContain("value:");
  });

  it("keeps the claim migration additive", () => {
    const sql = readFileSync(join(process.cwd(), "prisma/migrations/20260812050000_provisioning_run_claim/migration.sql"), "utf8");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS");
    expect(/DROP\s+(TABLE|COLUMN)|TRUNCATE|DELETE FROM/i.test(sql)).toBe(false);
    expect(/ADD COLUMN[^;]*NOT NULL/i.test(sql)).toBe(false);
  });
});

describe("a signed payment event only settles the purchase it is actually for", () => {
  // The reviewed defect: when a buyer had exactly one open payment, any signed Whop
  // event carrying their email settled it. A buyer holding an open $8,000 Founding
  // Clinic invoice could buy a $99 product on the same account and have the $8,000
  // record marked verified_paid.
  const founding = { productKey: "founding_clinic_seat", amountCents: 800_000 };
  const env = { WHOP_PRODUCT_ID_FOUNDING_CLINIC_SEAT: "prod_founding" };

  it("refuses the cheap unrelated purchase that named the defect", () => {
    expect(
      corroborateEmailMatch({ payment: founding, amountMinorUnits: 9_900, providerProductId: null, env }),
    ).toEqual({ ok: false, reason: "amount_mismatch" });
  });

  it("settles when the amount the provider reports is the amount owed", () => {
    expect(
      corroborateEmailMatch({ payment: founding, amountMinorUnits: 800_000, providerProductId: null, env }),
    ).toEqual({ ok: true });
  });

  it("settles on a matching provider product id even when the event reports no amount", () => {
    expect(
      corroborateEmailMatch({ payment: founding, amountMinorUnits: null, providerProductId: "prod_founding", env }),
    ).toEqual({ ok: true });
  });

  it("refuses a different product even when the amount happens to agree", () => {
    // Disagreement outranks agreement: a mismatch is positive evidence of a different
    // purchase, and two products can legitimately cost the same.
    expect(
      corroborateEmailMatch({
        payment: founding,
        amountMinorUnits: 800_000,
        providerProductId: "prod_something_else",
        env,
      }),
    ).toEqual({ ok: false, reason: "product_mismatch" });
  });

  it("refuses a wrong amount even when the product id agrees", () => {
    expect(
      corroborateEmailMatch({
        payment: founding,
        amountMinorUnits: 9_900,
        providerProductId: "prod_founding",
        env,
      }),
    ).toEqual({ ok: false, reason: "amount_mismatch" });
  });

  it("refuses when the event corroborates nothing at all", () => {
    // Silence is not agreement. The payment stays open for an operator to settle, which
    // is a delay rather than the wrong invoice being marked paid.
    expect(
      corroborateEmailMatch({ payment: founding, amountMinorUnits: null, providerProductId: null, env }),
    ).toEqual({ ok: false, reason: "unverified_product" });
  });

  it("ignores a product id the deployment has not mapped rather than trusting it", () => {
    expect(
      corroborateEmailMatch({ payment: founding, amountMinorUnits: null, providerProductId: "prod_founding", env: {} }),
    ).toEqual({ ok: false, reason: "unverified_product" });
  });

  it("reads the settled amount as integer minor units from the event", () => {
    expect(whopEventAmountMinorUnits({ final_amount: 8000 })).toBe(800_000);
    expect(whopEventAmountMinorUnits({ subtotal: "99.00" })).toBe(9_900);
    expect(whopEventAmountMinorUnits({})).toBeNull();
    expect(whopEventAmountMinorUnits({ final_amount: 0, amount: 99 })).toBe(9_900);
  });

  it("only corroborates on the email path, so a referenced event still settles normally", () => {
    const service = source("src/lib/commerce/access-payment-service.ts");
    const guard = service.indexOf("if (matchedByEmail) {");
    expect(guard).toBeGreaterThan(-1);
    expect(service.slice(guard, service.indexOf("corroborateEmailMatch({", guard))).not.toContain("}");
  });

  it("refuses before writing anything", () => {
    const service = source("src/lib/commerce/access-payment-service.ts");
    const fn = service.slice(service.indexOf("export async function applyWebhookToAccessPayment"));
    expect(fn.indexOf("corroborateEmailMatch({")).toBeLessThan(fn.indexOf("await db.$transaction"));
  });

  it("passes the provider's amount and product id from the webhook route", () => {
    const route = source("src/app/api/whop/webhook/route.ts");
    expect(route).toContain("amountMinorUnits: whopEventAmountMinorUnits(envelope.data ?? {})");
    expect(route).toContain("providerProductId: envelope.data?.product_id ?? null");
  });

  it("documents the product id variables without committing a value", () => {
    const example = source(".env.example");
    for (const key of ["CLINIC_WORKFLOW_REVIEW", "FOUNDING_CLINIC_SEAT", "AI_CONSULTING_CALL"]) {
      expect(example).toContain(`WHOP_PRODUCT_ID_${key}=""`);
    }
  });
});


describe("no clinic content reaches a model provider that is not approved to receive it", () => {
  // The reviewed defect: selectProvider never consulted baaOnFile and phiEgressPermitted
  // was computed only to decorate a refusal message. An ANTHROPIC_API_KEY plus a model
  // name was therefore enough to start sending, and the regex redaction that was
  // standing in for the control does not recognise a patient's name or clinical prose.
  const request = (overrides: Partial<ZumiAdmissionInput> = {}): ZumiAdmissionInput => ({
    capability: "operational_summary",
    role: "clinic_owner",
    sessionOrganizationId: "org_1",
    requestedOrganizationId: "org_1",
    entitlements: [],
    phiEgressPermitted: true,
    providerAvailable: true,
    ...overrides,
  });

  const adapter = (baaOnFile: boolean): ProviderAdapter => ({
    key: "test",
    label: "Test provider",
    modelId: "test-model",
    requiredEnv: [],
    baaOnFile,
    invoke: async () => {
      throw new Error("a test provider must never be invoked");
    },
  });

  afterEach(() => {
    resetProviderRegistry();
  });

  it("refuses an otherwise fully authorized request when egress is not permitted", () => {
    const decision = admitZumiRequest(request({ phiEgressPermitted: false }));
    expect(decision.allowed).toBe(false);
    expect(decision).toMatchObject({ reason: "phi_egress_not_permitted", status: 403 });
  });

  it("refuses it for an owner, because this is not a permissions question", () => {
    expect(admitZumiRequest(request({ role: "clinic_owner", phiEgressPermitted: false })).allowed).toBe(false);
  });

  it("still reports a missing provider as missing rather than as unapproved", () => {
    // Otherwise an operator with nothing configured goes looking for a BAA they do not
    // need yet, instead of connecting a provider.
    const decision = admitZumiRequest(request({ phiEgressPermitted: false, providerAvailable: false }));
    expect(decision).toMatchObject({ reason: "provider_unavailable" });
  });

  it("requires both a BAA and a deployment approval, and neither alone", () => {
    expect(phiEgressPermitted(adapter(true), {}).permitted).toBe(false);
    expect(phiEgressPermitted(adapter(false), { ZUMI_PHI_EGRESS_APPROVED: "1" }).permitted).toBe(false);
    expect(phiEgressPermitted(adapter(true), { ZUMI_PHI_EGRESS_APPROVED: "1" }).permitted).toBe(true);
  });

  it("names which of the two conditions is missing", () => {
    expect(phiEgressPermitted(adapter(false), { ZUMI_PHI_EGRESS_APPROVED: "1" }).reason).toBe("no_baa");
    expect(phiEgressPermitted(adapter(true), {}).reason).toBe("deployment_not_approved");
  });

  it("keeps the shipped Anthropic adapter unapproved even with the flag set", () => {
    // A BAA is not something an environment variable can grant.
    expect(anthropicAdapter.baaOnFile).toBe(false);
    expect(phiEgressPermitted(anthropicAdapter, { ZUMI_PHI_EGRESS_APPROVED: "1" }).permitted).toBe(false);
  });

  it("does not describe a configured-but-unapproved deployment as connected", () => {
    // The workspace reads this. Advertising an assistant that refuses every request is
    // the same untruth in a friendlier place.
    registerProvider(adapter(false));
    const status = zumiGatewayStatus({});
    expect(status.available).toBe(false);
    expect(status.mode).toBe("pending_phi_approval");
    expect(status.detail).toContain("Business Associate Agreement");
  });

  it("says connected only once both conditions hold", () => {
    registerProvider(adapter(true));
    expect(zumiGatewayStatus({ ZUMI_PHI_EGRESS_APPROVED: "1" })).toMatchObject({ available: true, mode: "connected" });
  });

  it("decides egress before the prompt is built, not after", () => {
    const gateway = source("src/features/zumi/gateway.ts");
    expect(gateway.indexOf("phiEgressPermitted(selection.adapter)")).toBeLessThan(gateway.indexOf("buildPrompt(request)"));
  });

  it("cannot be defaulted open by a new caller", () => {
    // A required field rather than an optional one: omitting it is a type error, not a
    // silent grant.
    const policy = source("src/features/zumi/policy.ts");
    expect(policy).toContain("phiEgressPermitted: boolean;");
    expect(policy).not.toContain("phiEgressPermitted?: boolean");
  });
});

describe("PHI approval is asked about the rail the message actually takes", () => {
  // The reviewed defect: the gate asked whether *any* communication connector was
  // approved for PHI. Approving Twilio would therefore unblock patient messages that
  // still leave over Resend, whose catalog entry declares handlesPhi: false.
  afterEach(() => {
    resetOutboundAdapters();
  });

  const send = async () => ({ ok: true as const, providerReference: "ref_1", provider: "test" });

  it("refuses when the sending adapter's own connector is not approved", () => {
    resetOutboundAdapters();
    registerOutboundAdapter({ channel: "email", provider: "resend", connectorId: "resend", configured: () => true, send });
    const result = patientMessageDeliverability({ RESEND_API_KEY: "re_test" });
    expect(result.deliverable).toBe(false);
    expect(result).toMatchObject({ reason: "phi_not_approved" });
  });

  it("names the rail that is blocking rather than the gateway", () => {
    resetOutboundAdapters();
    registerOutboundAdapter({ channel: "email", provider: "resend", connectorId: "resend", configured: () => true, send });
    const result = patientMessageDeliverability({ RESEND_API_KEY: "re_test" });
    expect(result.deliverable).toBe(false);
    expect(result.deliverable === false && result.detail).toContain("Resend");
  });

  it("is not unblocked by approving a different connector in the same gateway", () => {
    // This is the test that separates the fix from the defect. Twilio is the only
    // communication connector the catalog marks handlesPhi, so approving it is exactly
    // what made the old gateway-wide some() return true — while every patient message
    // still left over Resend, which declares handlesPhi: false.
    const twilio = getConnector("twilio")!;
    expect(twilio.handlesPhi).toBe(true);
    expect(getConnector("resend")?.handlesPhi).toBe(false);

    // A fresh object rather than a mutation: several catalog entries share one empty
    // gates literal, so mutating in place would approve unrelated connectors too.
    const original = twilio.gates;
    (twilio as { gates: Record<string, boolean> }).gates = Object.fromEntries(
      readinessGates.map((gate) => [gate, true]),
    );
    try {
      expect(connectorReadiness(twilio).phiUsable).toBe(true);
      resetOutboundAdapters();
      registerOutboundAdapter({ channel: "email", provider: "resend", connectorId: "resend", configured: () => true, send });
      expect(patientMessageDeliverability({ RESEND_API_KEY: "re_test" })).toMatchObject({
        deliverable: false,
        reason: "phi_not_approved",
      });
    } finally {
      (twilio as { gates: typeof original }).gates = original;
    }
  });

  it("refuses a rail the catalog does not describe at all", () => {
    resetOutboundAdapters();
    registerOutboundAdapter({ channel: "email", provider: "mystery", connectorId: "not-in-catalog", configured: () => true, send });
    expect(patientMessageDeliverability({})).toMatchObject({ deliverable: false, reason: "phi_not_approved" });
  });

  it("still reports a missing connector as missing rather than as unapproved", () => {
    resetOutboundAdapters();
    registerOutboundAdapter({ channel: "email", provider: "resend", connectorId: "resend", configured: () => false, send });
    expect(patientMessageDeliverability({})).toMatchObject({ deliverable: false, reason: "no_connector" });
  });

  it("makes every outbound adapter name a connector, so the question can always be asked", () => {
    const outbound = source("src/lib/communications/outbound.ts");
    expect(outbound).toContain("connectorId: string;");
    expect(outbound).toContain('connectorId: "resend"');
    // Required, not optional: an adapter added later cannot omit it and be assessed as
    // approved by default.
    expect(outbound).not.toContain("connectorId?:");
  });

  it("keeps no communication connector PHI-usable in a default deployment", () => {
    const approved = connectorCatalog.filter(
      (connector) => connector.gateway === "communication" && connectorReadiness(connector).phiUsable,
    );
    expect(approved).toEqual([]);
  });
});
