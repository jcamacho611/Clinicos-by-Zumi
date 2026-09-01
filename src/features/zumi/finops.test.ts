import { describe, expect, it } from "vitest";
import {
  evaluateZumiSpendGuard,
  summarizeZumiInvocations,
  type ZumiInvocationMeterRow,
} from "@/features/zumi/finops";

function row(overrides: Partial<ZumiInvocationMeterRow> = {}): ZumiInvocationMeterRow {
  return {
    organizationId: "org_a",
    userId: "user_1",
    capability: "current_visit_summary",
    tier: "PLUS",
    outcome: "admitted",
    reason: null,
    providerKey: "openai",
    modelId: "gpt-test",
    inputTokens: 2_000,
    outputTokens: 500,
    costMicroUsd: 1_000,
    durationMs: 800,
    createdAt: new Date("2026-08-30T12:00:00.000Z"),
    ...overrides,
  };
}

describe("Zumi FinOps", () => {
  it("summarizes tenant-scoped invocation cost and usage without prompt or response content", () => {
    const summary = summarizeZumiInvocations("org_a", [
      row(),
      row({ capability: "grid_match_explanation", modelId: "gpt-cheap", inputTokens: 1_000, outputTokens: 200, costMicroUsd: 300 }),
      row({ outcome: "denied", reason: "entitlement_required", providerKey: null, modelId: null, inputTokens: 0, outputTokens: 0, costMicroUsd: 0 }),
      row({ outcome: "error", reason: "provider_error", inputTokens: 0, outputTokens: 0, costMicroUsd: 0, durationMs: 20_000 }),
    ]);

    expect(summary).toMatchObject({
      organizationId: "org_a",
      invocationCount: 4,
      admittedCount: 2,
      deniedCount: 1,
      errorCount: 1,
      inputTokens: 3_000,
      outputTokens: 700,
      costMicroUsd: 1_300,
    });
    expect(summary.byCapability.current_visit_summary).toMatchObject({ invocationCount: 3, costMicroUsd: 1_000 });
    expect(summary.byCapability.grid_match_explanation).toMatchObject({ invocationCount: 1, costMicroUsd: 300 });
    expect(summary.byModel["gpt-test"]).toMatchObject({ invocationCount: 2, costMicroUsd: 1_000 });
    expect(summary.byModel["gpt-cheap"]).toMatchObject({ invocationCount: 1, costMicroUsd: 300 });
    expect(JSON.stringify(summary)).not.toMatch(/prompt|question|answer|responseText/i);
  });

  it("fails closed if rows from another organization reach the aggregator", () => {
    expect(() => summarizeZumiInvocations("org_a", [row(), row({ organizationId: "org_b" })]))
      .toThrow(/cross-organization/i);
  });

  it("keeps money integer-safe and rejects invalid negative meter values", () => {
    expect(() => summarizeZumiInvocations("org_a", [row({ costMicroUsd: -1 })]))
      .toThrow(/non-negative integer/i);
    expect(() => summarizeZumiInvocations("org_a", [row({ inputTokens: 1.5 })]))
      .toThrow(/non-negative integer/i);
  });

  it("allows, warns, or blocks future AI spend using server-owned integer micro-USD budgets", () => {
    expect(evaluateZumiSpendGuard({
      spentMicroUsd: 2_000,
      estimatedNextCallMicroUsd: 500,
      warningAtMicroUsd: 8_000,
      hardLimitMicroUsd: 10_000,
    })).toEqual({ state: "allow", projectedMicroUsd: 2_500, remainingMicroUsd: 7_500 });

    expect(evaluateZumiSpendGuard({
      spentMicroUsd: 8_000,
      estimatedNextCallMicroUsd: 500,
      warningAtMicroUsd: 8_000,
      hardLimitMicroUsd: 10_000,
    })).toEqual({ state: "warn", projectedMicroUsd: 8_500, remainingMicroUsd: 1_500 });

    expect(evaluateZumiSpendGuard({
      spentMicroUsd: 9_800,
      estimatedNextCallMicroUsd: 500,
      warningAtMicroUsd: 8_000,
      hardLimitMicroUsd: 10_000,
    })).toEqual({ state: "block", projectedMicroUsd: 10_300, remainingMicroUsd: 200 });
  });

  it("fails closed on malformed or contradictory budget configuration", () => {
    expect(() => evaluateZumiSpendGuard({
      spentMicroUsd: 0,
      estimatedNextCallMicroUsd: 1,
      warningAtMicroUsd: 11,
      hardLimitMicroUsd: 10,
    })).toThrow(/warning/i);

    expect(() => evaluateZumiSpendGuard({
      spentMicroUsd: -1,
      estimatedNextCallMicroUsd: 1,
      warningAtMicroUsd: 8,
      hardLimitMicroUsd: 10,
    })).toThrow(/non-negative integer/i);
  });
});
