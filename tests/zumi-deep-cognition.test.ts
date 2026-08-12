import { describe, expect, it, vi } from "vitest";
import type { ProviderAdapter, ProviderRequest, ProviderResult } from "@/features/zumi/providers";

vi.mock("server-only", () => ({}));

import { runZumiCognition } from "@/features/zumi/cognition-loop";

function fakeAdapter(outputs: Array<Partial<ProviderResult> & { text: string }>) {
  const requests: ProviderRequest[] = [];
  let index = 0;
  const adapter: ProviderAdapter = {
    key: "fake",
    label: "Fake provider",
    modelId: "fake-model",
    requiredEnv: [],
    baaOnFile: false,
    async invoke(request) {
      requests.push(request);
      const output = outputs[Math.min(index, outputs.length - 1)]!;
      index += 1;
      return {
        text: output.text,
        inputTokens: output.inputTokens ?? 10,
        outputTokens: output.outputTokens ?? 5,
        costMicroUsd: output.costMicroUsd ?? 100,
        modelId: output.modelId ?? "fake-model",
        responseId: output.responseId ?? `response-${index}`,
        sources: output.sources ?? [],
        toolsUsed: output.toolsUsed ?? [],
      };
    },
  };
  return { adapter, requests };
}

const base = {
  redactedQuestion: "Verify the latest healthcare security guidance and compare the tradeoffs.",
  system: "Governed system instruction",
  prompt: "Redacted user prompt",
  allowWebSearch: true,
  allowKnowledgeSearch: true,
  allowCodeInterpreter: true,
  maxToolCalls: 10,
  maxOutputTokens: 2000,
  timeoutMs: 20000,
} as const;

describe("Zumi bounded cognition", () => {
  it("keeps direct conversation to one provider pass", async () => {
    const { adapter, requests } = fakeAdapter([{ text: "Direct answer" }]);
    const result = await runZumiCognition({ ...base, adapter, depth: "direct", env: {} });
    expect(requests).toHaveLength(1);
    expect(result.trace.passes).toEqual(["investigate"]);
    expect(result.trace.criticStatus).toBe("not_run");
    expect(result.result.text).toBe("Direct answer");
  });

  it("plans, investigates, and verifies a deep answer without unnecessary repair", async () => {
    const { adapter, requests } = fakeAdapter([
      { text: '{"unknowns":["current guidance"]}', costMicroUsd: 10 },
      { text: "Evidence-backed draft", costMicroUsd: 20, toolsUsed: ["web_search"], sources: [{ url: "https://example.gov/source" }] },
      { text: "VERIFIED\nNo material gaps.", costMicroUsd: 5 },
    ]);
    const result = await runZumiCognition({ ...base, adapter, depth: "deep", env: { ZUMI_DEEP_MAX_PASSES: "4", ZUMI_MAX_TURN_COST_MICRO_USD: "1000" } });
    expect(requests).toHaveLength(3);
    expect(result.trace.passes).toEqual(["plan", "investigate", "critic"]);
    expect(result.trace.criticStatus).toBe("verified");
    expect(result.trace.repairApplied).toBe(false);
    expect(result.result.text).toBe("Evidence-backed draft");
    expect(result.result.costMicroUsd).toBe(35);
    expect(result.result.toolsUsed).toEqual(["web_search"]);
    expect(result.result.sources?.[0]?.url).toBe("https://example.gov/source");
  });

  it("repairs a deep answer when the critic finds unresolved gaps", async () => {
    const { adapter, requests } = fakeAdapter([
      { text: "plan", costMicroUsd: 10 },
      { text: "draft with a gap", costMicroUsd: 20, responseId: "draft-response" },
      { text: "NEEDS_MORE_RESEARCH\nThe current regulator source is missing.", costMicroUsd: 5 },
      { text: "repaired and verified-facing answer", costMicroUsd: 25, toolsUsed: ["web_search"], sources: [{ url: "https://regulator.gov/current" }] },
    ]);
    const result = await runZumiCognition({ ...base, adapter, depth: "deep", env: { ZUMI_DEEP_MAX_PASSES: "4", ZUMI_MAX_TURN_COST_MICRO_USD: "1000" } });
    expect(requests).toHaveLength(4);
    expect(result.trace.passes).toEqual(["plan", "investigate", "critic", "repair"]);
    expect(result.trace.criticStatus).toBe("needs_more_research");
    expect(result.trace.repairApplied).toBe(true);
    expect(result.result.text).toBe("repaired and verified-facing answer");
    expect(result.result.costMicroUsd).toBe(60);
    expect(requests[3]?.previousResponseId).toBe("draft-response");
  });

  it("stops optional verification passes after the configured cost ceiling is reached", async () => {
    const { adapter, requests } = fakeAdapter([
      { text: "plan", costMicroUsd: 100 },
      { text: "draft", costMicroUsd: 100 },
      { text: "VERIFIED", costMicroUsd: 100 },
    ]);
    const result = await runZumiCognition({ ...base, adapter, depth: "deep", env: { ZUMI_DEEP_MAX_PASSES: "4", ZUMI_MAX_TURN_COST_MICRO_USD: "150" } });
    expect(requests).toHaveLength(2);
    expect(result.trace.passes).toEqual(["plan", "investigate"]);
    expect(result.trace.stoppedByBudget).toBe(true);
    expect(result.trace.criticStatus).toBe("not_run");
    expect(result.result.text).toBe("draft");
  });

  it("can disable multi-pass deep cognition without disabling normal answers", async () => {
    const { adapter, requests } = fakeAdapter([{ text: "single deep answer" }]);
    const result = await runZumiCognition({ ...base, adapter, depth: "deep", env: { ZUMI_DEEP_COGNITION_ENABLED: "false" } });
    expect(requests).toHaveLength(1);
    expect(result.trace.passes).toEqual(["investigate"]);
    expect(result.trace.maxPasses).toBe(1);
  });
});
