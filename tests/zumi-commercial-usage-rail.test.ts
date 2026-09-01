import { describe, expect, it } from "vitest";
import {
  executeFundedZumiInvocation,
  microUsdToCommercialCents,
  type ZumiCommercialUsageLedger,
} from "@/features/zumi/commercial-usage";

describe("Zumi commercial usage rail", () => {
  it("converts exact provider micro-USD cost to conservative integer commercial cents", () => {
    expect(microUsdToCommercialCents(0)).toBe(0);
    expect(microUsdToCommercialCents(1)).toBe(1);
    expect(microUsdToCommercialCents(10_000)).toBe(1);
    expect(microUsdToCommercialCents(10_001)).toBe(2);
    expect(() => microUsdToCommercialCents(-1)).toThrow(/non-negative integer/i);
    expect(() => microUsdToCommercialCents(1.5)).toThrow(/non-negative integer/i);
  });

  it("reserves before provider work and settles actual cost afterward", async () => {
    const events: string[] = [];
    const reservationInputs: unknown[] = [];
    const settlements: unknown[] = [];
    const ledger: ZumiCommercialUsageLedger = {
      reserve: async (input) => {
        events.push("reserve");
        reservationInputs.push(input);
        return {
          reservationId: "reservation_1",
          mode: "funded_usage",
          estimatedCostCents: input.estimatedCostCents,
          allocations: [],
          idempotent: false,
        };
      },
      settle: async (...args) => {
        events.push("settle");
        settlements.push(args);
        return { id: "usage_1" };
      },
      release: async () => {
        events.push("release");
        return true;
      },
    };

    const result = await executeFundedZumiInvocation(
      {
        organizationId: "org_1",
        actorId: "user_1",
        capability: "conversation",
        provider: "openai",
        service: "responses",
        invocationKey: "turn_abc123",
        estimatedCostMicroUsd: 14_001,
      },
      async () => {
        events.push("provider");
        return { text: "ok", costMicroUsd: 18_999, providerResponseId: "resp_1" };
      },
      ledger,
    );

    expect(events).toEqual(["reserve", "provider", "settle"]);
    expect(reservationInputs).toEqual([
      expect.objectContaining({
        organizationId: "org_1",
        actorId: "user_1",
        bucket: "ai",
        capability: "zumi.conversation",
        provider: "openai",
        service: "responses",
        idempotencyKey: "zumi:turn_abc123",
        estimatedCostCents: 2,
      }),
    ]);
    expect(settlements).toEqual([
      [
        "org_1",
        "user_1",
        "reservation_1",
        2,
        expect.objectContaining({
          exactActualCostMicroUsd: 18_999,
          providerResponseId: "resp_1",
          zumiInvocationKey: "turn_abc123",
        }),
      ],
    ]);
    expect(result.value.text).toBe("ok");
    expect(result.reservationId).toBe("reservation_1");
  });

  it("releases reserved funds when provider work fails and preserves the provider error", async () => {
    const events: string[] = [];
    const ledger: ZumiCommercialUsageLedger = {
      reserve: async (input) => {
        events.push("reserve");
        return {
          reservationId: "reservation_2",
          mode: "funded_usage",
          estimatedCostCents: input.estimatedCostCents,
          allocations: [],
          idempotent: false,
        };
      },
      settle: async () => {
        events.push("settle");
        return null;
      },
      release: async (organizationId, actorId, reservationId, reason) => {
        events.push(`release:${organizationId}:${actorId}:${reservationId}:${reason}`);
        return true;
      },
    };

    const providerError = new Error("provider failed");
    await expect(executeFundedZumiInvocation(
      {
        organizationId: "org_1",
        actorId: "user_1",
        capability: "research",
        provider: "openai",
        service: "responses",
        invocationKey: "turn_failure",
        estimatedCostMicroUsd: 25_000,
      },
      async () => {
        events.push("provider");
        throw providerError;
      },
      ledger,
    )).rejects.toBe(providerError);

    expect(events).toEqual([
      "reserve",
      "provider",
      "release:org_1:user_1:reservation_2:provider_execution_failed",
    ]);
  });

  it("does not invent settlement for a zero-cost or synthetic reservation", async () => {
    const events: string[] = [];
    const ledger: ZumiCommercialUsageLedger = {
      reserve: async () => {
        events.push("reserve");
        return {
          reservationId: null,
          mode: "synthetic_demo",
          estimatedCostCents: 0,
          allocations: [],
          idempotent: false,
        };
      },
      settle: async () => {
        events.push("settle");
        return null;
      },
      release: async () => {
        events.push("release");
        return true;
      },
    };

    const result = await executeFundedZumiInvocation(
      {
        organizationId: "org_demo",
        actorId: "user_demo",
        capability: "conversation",
        provider: "openai",
        service: "responses",
        invocationKey: "turn_demo",
        estimatedCostMicroUsd: 0,
        allowSyntheticDemo: true,
        syntheticDataOnly: true,
      },
      async () => {
        events.push("provider");
        return { text: "demo", costMicroUsd: 0 };
      },
      ledger,
    );

    expect(events).toEqual(["reserve", "provider"]);
    expect(result.reservationId).toBeNull();
  });
});
