import { describe, expect, it } from "vitest";
import {
  admitZumiRequest,
  requiresHumanReviewForTier,
  type ZumiAdmissionInput,
} from "@/features/zumi/policy";
import {
  getZumiCapability,
  isProhibitedZumiCapability,
  orbStateForStage,
  validateRecommendation,
  ZUMI_BASELINE_PERMISSION,
  ZUMI_PROHIBITED,
  zumiCapabilities,
  zumiOrbStates,
  zumiRecommendationSchema,
  type ZumiRecommendation,
} from "@/features/zumi/schemas";
import {
  containsLikelyIdentifiers,
  redactPayload,
  redactText,
  REDACTION_PLACEHOLDER,
} from "@/features/zumi/redaction";
import {
  listProviderStatus,
  phiEgressPermitted,
  providerIsUsable,
  registerProvider,
  resetProviderRegistry,
  selectProvider,
  zumiGatewayStatus,
  type ProviderAdapter,
} from "@/features/zumi/providers";

/**
 * These tests exist because every claim Klinikos makes about Zumi is a claim about
 * what the code refuses to do. A prohibition nobody tests is a paragraph.
 */

const baseRequest = (overrides: Partial<ZumiAdmissionInput> = {}): ZumiAdmissionInput => ({
  capability: "operational_summary",
  role: "clinic_owner",
  sessionOrganizationId: "org_1",
  requestedOrganizationId: "org_1",
  entitlements: [],
  providerAvailable: true,
  ...overrides,
});

describe("the capability catalog", () => {
  it("declares no capability that is also prohibited", () => {
    const overlap = zumiCapabilities.filter((capability) => isProhibitedZumiCapability(capability.key));
    expect(overlap.map((capability) => capability.key)).toEqual([]);
  });

  it("keeps every HIGH-risk capability a proposal", () => {
    // The naming is the contract: Zumi prepares these, a person performs them.
    for (const capability of zumiCapabilities.filter((entry) => entry.tier === "HIGH")) {
      expect({ key: capability.key, proposes: capability.key.startsWith("propose_") }).toEqual({
        key: capability.key,
        proposes: true,
      });
    }
  });

  it("gives every HIGH-risk capability a permission requirement", () => {
    for (const capability of zumiCapabilities.filter((entry) => entry.tier === "HIGH")) {
      expect({ key: capability.key, requires: capability.requiresPermission !== null }).toEqual({
        key: capability.key,
        requires: true,
      });
    }
  });

  it("declares each capability exactly once", () => {
    const keys = zumiCapabilities.map((capability) => capability.key);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it("holds anything above LOW risk for a person", () => {
    expect(requiresHumanReviewForTier("LOW")).toBe(false);
    expect(requiresHumanReviewForTier("MEDIUM")).toBe(true);
    expect(requiresHumanReviewForTier("HIGH")).toBe(true);
  });
});

describe("admission policy", () => {
  it("refuses every prohibited capability, even for an owner in a configured deployment", () => {
    for (const capability of ZUMI_PROHIBITED) {
      expect(admitZumiRequest(baseRequest({ capability }))).toMatchObject({
        allowed: false,
        reason: "prohibited",
        status: 403,
      });
    }
  });

  it("refuses a prohibited capability before it reports the provider is down", () => {
    // Order matters: "not connected" would read as a temporary outage and invite a
    // retry once configuration lands. This is not a configuration question.
    const decision = admitZumiRequest(baseRequest({ capability: "prescribe", providerAvailable: false }));
    expect(decision).toMatchObject({ allowed: false, reason: "prohibited" });
  });

  it("refuses a capability nobody declared", () => {
    expect(admitZumiRequest(baseRequest({ capability: "summarize_everything" }))).toMatchObject({
      allowed: false,
      reason: "unknown_capability",
      status: 400,
    });
  });

  it("refuses a request that names a different organization than the session", () => {
    expect(admitZumiRequest(baseRequest({ requestedOrganizationId: "org_2" }))).toMatchObject({
      allowed: false,
      reason: "tenant_mismatch",
      status: 403,
    });
  });

  it("refuses a role with no AI access at all", () => {
    // `contractor` holds GRID permissions only.
    expect(admitZumiRequest(baseRequest({ role: "contractor" }))).toMatchObject({
      allowed: false,
      reason: "permission_denied",
    });
  });

  it("never lets Zumi widen what a role can already do", () => {
    // A viewer holds `ai:read`, so they clear the baseline — and holds documents:read
    // only, so they cannot have Zumi write draft metadata onto a document for them.
    // The AI layer is not a way around RBAC.
    const decision = admitZumiRequest(baseRequest({ capability: "document_extraction", role: "viewer" }));
    expect(decision).toMatchObject({ allowed: false, reason: "permission_denied", status: 403 });

    const capability = getZumiCapability("document_extraction");
    expect(capability?.requiresPermission).toEqual({ resource: "documents", action: "update" });
  });

  it("charges an entitlement-gated capability as payment-resolvable, not forbidden", () => {
    const denied = admitZumiRequest(baseRequest({ capability: "owner_brief" }));
    expect(denied).toMatchObject({ allowed: false, reason: "entitlement_required", status: 402 });

    const granted = admitZumiRequest(baseRequest({ capability: "owner_brief", entitlements: ["advanced_reports"] }));
    expect(granted).toMatchObject({ allowed: true, tier: "MEDIUM", requiresHumanReview: true });
  });

  it("reports an unconfigured provider last, so a denial states the real reason", () => {
    const decision = admitZumiRequest(baseRequest({ providerAvailable: false, providerDetail: "Pending connection." }));
    expect(decision).toMatchObject({ allowed: false, reason: "provider_unavailable", status: 503, message: "Pending connection." });
  });

  it("derives human review from the tier rather than from the caller", () => {
    const low = admitZumiRequest(baseRequest({ capability: "morning_briefing" }));
    expect(low).toMatchObject({ allowed: true, requiresHumanReview: false });

    const high = admitZumiRequest(
      baseRequest({ capability: "propose_record_release", role: "clinic_owner" }),
    );
    expect(high).toMatchObject({ allowed: true, tier: "HIGH", requiresHumanReview: true });
  });

  it("requires the baseline AI permission in the product's own RBAC vocabulary", () => {
    expect(ZUMI_BASELINE_PERMISSION).toEqual({ resource: "ai", action: "read" });
  });
});

describe("the governed recommendation", () => {
  const recommendation = (overrides: Partial<ZumiRecommendation> = {}): ZumiRecommendation =>
    zumiRecommendationSchema.parse({
      capability: "suggest_task",
      summary: "Three lab results have no assigned reviewer.",
      reason: "No user is assigned and the results are older than the clinic's review window.",
      evidence: [
        { source: "SYSTEM", entityType: "lab_result", entityId: "lab_1", fact: "Unassigned for 4 days." },
      ],
      requiresHumanReview: true,
      ...overrides,
    });

  it("rejects a recommendation with no evidence", () => {
    // Zod enforces the floor; the parse itself is the assertion.
    expect(() => recommendation({ evidence: [] })).toThrow();
  });

  it("rejects a MEDIUM or HIGH capability that does not require human review", () => {
    expect(validateRecommendation(recommendation({ requiresHumanReview: false }))).toContain(
      "A MEDIUM-risk capability produces a suggestion and must require human review.",
    );
    expect(
      validateRecommendation(recommendation({ capability: "propose_claim_action", requiresHumanReview: false })),
    ).toContain("A HIGH-risk capability must require human review.");
  });

  it("rejects a recommendation for a capability that does not exist", () => {
    expect(validateRecommendation(recommendation({ capability: "invent_something" }))).toEqual([
      'Unknown capability "invent_something".',
    ]);
  });

  it("requires an urgent signal to say what to do", () => {
    expect(validateRecommendation(recommendation({ severity: "URGENT" }))).toContain(
      "An urgent signal must state a suggested next action.",
    );
    expect(
      validateRecommendation(recommendation({ severity: "URGENT", suggestedAction: "Assign a reviewer today." })),
    ).toEqual([]);
  });

  it("never accepts a bare confidence number", () => {
    expect(() => recommendation({ confidence: 0.92 as never })).toThrow();
    expect(
      recommendation({ confidence: { level: "moderate", basis: "Three matching records, one incomplete." } }).confidence,
    ).toEqual({ level: "moderate", basis: "Three matching records, one incomplete." });
  });

  it("maps every work stage to a real orb state", () => {
    for (const stage of ["idle", "gathering", "correlating", "reasoning", "flagged", "closed"] as const) {
      expect(zumiOrbStates).toContain(orbStateForStage(stage));
    }
    expect(orbStateForStage("idle")).toBe("dormant");
    expect(orbStateForStage("closed")).toBe("resolved");
  });
});

describe("egress redaction", () => {
  it("removes identifier shapes from free text", () => {
    const result = redactText("Reach Dana at dana@example.com or 555-867-5309, SSN 123-45-6789, DOB 04/11/1978.");
    expect(result.text).not.toContain("dana@example.com");
    expect(result.text).not.toContain("123-45-6789");
    expect(result.text).not.toContain("04/11/1978");
    expect(result.redactedAny).toBe(true);
    expect(result.text).toContain(REDACTION_PLACEHOLDER);
  });

  it("drops keys that announce sensitive content instead of trying to scrub them", () => {
    // A free-text note cannot be reliably pattern-matched, so it does not leave.
    const { value, droppedKeys, redactedAny } = redactPayload({
      appointmentId: "appt_1",
      status: "checked_in",
      note: "Patient reports chest pain radiating to the left arm.",
      diagnosis: "Angina",
    });
    expect(value).toEqual({ appointmentId: "appt_1", status: "checked_in" });
    expect(droppedKeys.sort()).toEqual(["diagnosis", "note"]);
    expect(redactedAny).toBe(true);
  });

  it("drops sensitive keys nested inside arrays and objects", () => {
    const { value, droppedKeys } = redactPayload({
      encounters: [{ id: "e1", patientEmail: "a@b.com", chart: { mrn: "MRN-88214", room: "3" } }],
    });
    expect(droppedKeys.sort()).toEqual(["mrn", "patientEmail"]);
    expect(value).toEqual({ encounters: [{ id: "e1", chart: { room: "3" } }] });
  });

  it("keeps object keys, because keys are schema and values are content", () => {
    const { value } = redactPayload({ openTaskCount: 12, oldestTaskDays: 9 });
    expect(value).toEqual({ openTaskCount: 12, oldestTaskDays: 9 });
  });

  it("stops at a depth cap rather than recursing forever", () => {
    let nested: Record<string, unknown> = { leaf: "value" };
    for (let index = 0; index < 40; index += 1) nested = { nested };
    expect(() => redactPayload(nested)).not.toThrow();
  });

  it("answers the pre-egress question the same way on repeat calls", () => {
    // The rules carry the global flag; a stale lastIndex would make this alternate.
    const text = "Contact 555-867-5309.";
    expect(containsLikelyIdentifiers(text)).toBe(true);
    expect(containsLikelyIdentifiers(text)).toBe(true);
    expect(containsLikelyIdentifiers("Twelve open tasks, oldest nine days.")).toBe(false);
    expect(containsLikelyIdentifiers("Twelve open tasks, oldest nine days.")).toBe(false);
  });

  it("finds nothing left to redact after redacting", () => {
    const raw = "Dana Reyes, dana@example.com, 555-867-5309, SSN 123-45-6789, MRN: 88214-A.";
    expect(containsLikelyIdentifiers(redactText(raw).text)).toBe(false);
  });
});

describe("provider registry", () => {
  const adapter = (overrides: Partial<ProviderAdapter> = {}): ProviderAdapter => ({
    key: "test",
    label: "Test provider",
    modelId: "test-model",
    requiredEnv: ["TEST_AI_KEY"],
    baaOnFile: false,
    invoke: async () => ({ text: "{}", inputTokens: 0, outputTokens: 0, costMicroUsd: 0, modelId: "test-model" }),
    ...overrides,
  });

  it("reports pending connection when nothing is registered", () => {
    resetProviderRegistry();
    const status = zumiGatewayStatus({});
    expect(status).toMatchObject({ available: false, mode: "pending_connection", provider: null });
  });

  it("reports NOT_CONFIGURED, naming the missing variables but never their values", () => {
    resetProviderRegistry();
    registerProvider(adapter());
    const [status] = listProviderStatus({});
    expect(status).toMatchObject({ state: "NOT_CONFIGURED", missingEnv: ["TEST_AI_KEY"] });
    expect(status.detail).toContain("TEST_AI_KEY");
  });

  it("treats a blank credential as absent", () => {
    resetProviderRegistry();
    registerProvider(adapter());
    expect(listProviderStatus({ TEST_AI_KEY: "   " })[0].state).toBe("NOT_CONFIGURED");
  });

  it("becomes usable once its credentials are present", () => {
    resetProviderRegistry();
    registerProvider(adapter());
    const selection = selectProvider({ TEST_AI_KEY: "sk-test" });
    expect(selection.ok).toBe(true);
    expect(providerIsUsable("CONFIGURED")).toBe(true);
    expect(providerIsUsable("NOT_CONFIGURED")).toBe(false);
    expect(providerIsUsable("ERROR")).toBe(false);
  });

  it("honours the deployment kill switch over present credentials", () => {
    resetProviderRegistry();
    registerProvider(adapter());
    const selection = selectProvider({ TEST_AI_KEY: "sk-test", ZUMI_DISABLED: "1" });
    expect(selection).toMatchObject({ ok: false, reason: "disabled" });
  });

  it("errors on a named provider that is not registered rather than substituting one", () => {
    resetProviderRegistry();
    registerProvider(adapter());
    const selection = selectProvider({ TEST_AI_KEY: "sk-test", ZUMI_PROVIDER: "somebody-else" });
    expect(selection).toMatchObject({ ok: false, reason: "unknown_provider" });
  });

  it("refuses PHI egress unless both a BAA and a deployment approval exist", () => {
    const withoutBaa = adapter({ baaOnFile: false });
    const withBaa = adapter({ baaOnFile: true });

    expect(phiEgressPermitted(withBaa, {}).permitted).toBe(false);
    expect(phiEgressPermitted(withoutBaa, { ZUMI_PHI_EGRESS_APPROVED: "1" }).permitted).toBe(false);
    expect(phiEgressPermitted(withBaa, { ZUMI_PHI_EGRESS_APPROVED: "1" }).permitted).toBe(true);
  });

  it("says redaction is not a substitute for a BAA", () => {
    expect(phiEgressPermitted(adapter(), {}).notice).toContain("Business Associate Agreement");
  });
});
