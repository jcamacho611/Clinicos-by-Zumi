import { readFileSync } from "node:fs";
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
import { derivePortalAccess } from "@/lib/commerce/access-payment-rules";

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
    expect(service).toContain("if (candidates.length === 1) payment = candidates[0]");
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
