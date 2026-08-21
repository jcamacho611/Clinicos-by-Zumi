import { afterEach, describe, expect, it } from "vitest";
import { resolvePublicZumiTurn } from "@/features/zumi/public-intelligence";
import {
  registerProvider,
  resetProviderRegistry,
  type ProviderAdapter,
  type ProviderRequest,
} from "@/features/zumi/providers";

const originalProvider = process.env.ZUMI_PROVIDER;
const originalDisabled = process.env.ZUMI_DISABLED;

afterEach(() => {
  resetProviderRegistry();
  if (originalProvider === undefined) delete process.env.ZUMI_PROVIDER;
  else process.env.ZUMI_PROVIDER = originalProvider;
  if (originalDisabled === undefined) delete process.env.ZUMI_DISABLED;
  else process.env.ZUMI_DISABLED = originalDisabled;
});

function fakeProvider(requests: ProviderRequest[]): ProviderAdapter {
  return {
    key: "public_test",
    label: "Public test provider",
    modelId: "public-test-model",
    requiredEnv: [],
    baaOnFile: false,
    async invoke(request) {
      requests.push(request);
      return {
        text: "Fix the follow-up loop\nKlinikos can keep callback work visible, owned, and moving to a next action instead of letting it disappear between handoffs.",
        inputTokens: 80,
        outputTokens: 34,
        costMicroUsd: 125,
        modelId: "public-test-model",
        responseId: "resp_public_test",
        sources: [],
        toolsUsed: [],
      };
    },
  };
}

describe("public Zumi provider execution", () => {
  it("uses the provider for free-form product conversation with every optional tool disabled", async () => {
    delete process.env.ZUMI_PROVIDER;
    delete process.env.ZUMI_DISABLED;
    resetProviderRegistry();
    const requests: ProviderRequest[] = [];
    registerProvider(fakeProvider(requests));

    const result = await resolvePublicZumiTurn({
      question: "I run a med spa and my staff keeps forgetting callbacks",
      history: [
        { role: "user", content: "I am trying to make the front desk more reliable" },
        { role: "assistant", content: "Tell me what is falling through." },
      ],
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      allowWebSearch: false,
      allowKnowledgeSearch: false,
      allowCodeInterpreter: false,
      maxToolCalls: 0,
    });
    expect(requests[0].prompt).toContain("front desk more reliable");
    expect(requests[0].prompt).toContain("staff keeps forgetting callbacks");
    expect(result.modelGenerated).toBe(true);
    expect(result.intelligenceAvailable).toBe(true);
    expect(result.degradedReason).toBeNull();
    expect(result.resolution.title).toBe("Fix the follow-up loop");
    expect(result.resolution.body).toContain("callback work visible");
    // The verified deterministic path now recognizes callbacks + forgetting as a
    // follow-up continuity problem. The model can improve the prose without throwing
    // away that safe, high-confidence route or falling back to the weaker "staff" token.
    expect(result.resolution.destination).toMatchObject({ key: "referrals", href: "/referrals" });
  });

  it("does not invoke a provider for patient-specific content", async () => {
    delete process.env.ZUMI_PROVIDER;
    delete process.env.ZUMI_DISABLED;
    resetProviderRegistry();
    const requests: ProviderRequest[] = [];
    registerProvider(fakeProvider(requests));

    const result = await resolvePublicZumiTurn({ question: "Mrs Smith missed her appointment and has diabetes" });

    expect(requests).toHaveLength(0);
    expect(result.modelGenerated).toBe(false);
    expect(result.degradedReason).toBe("privacy_boundary");
    expect(result.resolution.destination).toMatchObject({ href: "/dashboard" });
  });

  it("truthfully degrades to deterministic guidance when inference is disabled", async () => {
    delete process.env.ZUMI_PROVIDER;
    process.env.ZUMI_DISABLED = "1";
    resetProviderRegistry();
    const requests: ProviderRequest[] = [];
    registerProvider(fakeProvider(requests));

    const result = await resolvePublicZumiTurn({ question: "I need a nurse Friday" });

    expect(requests).toHaveLength(0);
    expect(result.modelGenerated).toBe(false);
    expect(result.intelligenceAvailable).toBe(false);
    expect(result.degradedReason).toBe("provider_unavailable");
    expect(result.resolution.destination).toMatchObject({ key: "staffing", href: "/grid" });
  });
});