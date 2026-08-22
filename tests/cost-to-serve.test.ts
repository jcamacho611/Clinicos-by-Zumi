import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
vi.mock("@/lib/db", () => ({ db: { $queryRaw: (...a: unknown[]) => queryRaw(...a) } }));

const { COST_LINES, costToServeFor, declaredCostLines, measuredIntelligenceCost, unpricedCostLines } =
  await import("@/lib/commercial/cost-to-serve");
const { calculateClinicEconomics } = await import("@/lib/commercial/clinic-economics");

beforeEach(() => { queryRaw.mockReset().mockResolvedValue([{ micro: BigInt(0) }]); });

describe("cost to serve", () => {
  it("measures intelligence spend from recorded turns rather than estimating it", async () => {
    // 2,500,000 micro-USD = $2.50 = 250 cents.
    queryRaw.mockResolvedValue([{ micro: BigInt(2_500_000) }]);
    const item = await measuredIntelligenceCost("org-1", new Date("2026-08-01"));
    expect(item.cost.monthlyCents).toBe(250);
    expect(item.cost.evidence).toBe("known");
    expect(item.cost.source).toBe("zumi_invocations.costMicroUsd");
  });

  it("reports zero recorded spend as a measured zero, not as unknown", async () => {
    // An organization that has genuinely not used Zumi did cost nothing to serve on
    // that line, and that is a different statement from "nobody knows".
    const item = await measuredIntelligenceCost("org-1", new Date("2026-08-01"));
    expect(item.cost.monthlyCents).toBe(0);
    expect(item.cost.evidence).toBe("known");
  });

  it("never invents a vendor rate", () => {
    // Every line without a real invoice behind it must stay unknown. A cost model that
    // fills its own gaps produces a margin nobody can defend.
    for (const line of COST_LINES) {
      if (line.monthlyCentsPerClinic === null) continue;
      expect(line.source, `${line.key} carries a rate with no source`).toBeTruthy();
      expect(line.asOf, `${line.key} carries a rate with no date`).toBeTruthy();
    }
    for (const item of declaredCostLines()) {
      if (item.cost.monthlyCents === null) expect(item.cost.evidence).toBe("unknown");
    }
  });

  it("names every line still missing a rate", () => {
    // The gap list is the work. Hiding it behind a total is how a zero becomes an answer.
    const unpriced = unpricedCostLines();
    expect(unpriced.length).toBeGreaterThan(0);
    expect(unpriced.map((line) => line.key)).toContain("hosting");
    for (const line of unpriced) {
      expect(line.driver.length, `${line.key} has no driver`).toBeGreaterThan(0);
      expect(line.billingUnit.length, `${line.key} has no billing unit`).toBeGreaterThan(0);
    }
  });

  it("refuses to state a margin while cost lines are unknown", async () => {
    // The whole point. The usage ledger has no callers, so most cost is unmeasured, and
    // the honest answer to "what is our gross margin" today is that we cannot say.
    const result = calculateClinicEconomics({
      stack: [{ key: "texting", label: "Texting", category: "communications", replaceability: "replaceable",
        cost: { monthlyCents: 19_900, evidence: "self_reported" } }],
      costToServe: await costToServeFor("org-1", new Date("2026-08-01")),
      proposedMonthlyPriceCents: 99_500,
      implementationPriceCents: 800_000,
    });
    expect(result.claimSafety).toBe("insufficient");
    expect(result.grossMarginBps, "a margin must not be produced from unknown cost").toBeNull();
    expect(result.unresolved.length).toBeGreaterThan(0);
  });

  it("does produce a margin once every cost line is known", () => {
    // Proves the null above is a verdict on the evidence rather than a permanent
    // no-answer: the same calculator states a margin the moment cost is real.
    const result = calculateClinicEconomics({
      stack: [{ key: "texting", label: "Texting", category: "communications", replaceability: "replaceable",
        cost: { monthlyCents: 19_900, evidence: "known" } }],
      costToServe: [
        { key: "intelligence", label: "Zumi intelligence", category: "intelligence",
          cost: { monthlyCents: 250, evidence: "known" } },
        { key: "hosting", label: "Hosting", category: "infrastructure",
          cost: { monthlyCents: 4_000, evidence: "known" } },
      ],
      proposedMonthlyPriceCents: 99_500,
      implementationPriceCents: 800_000,
    });
    expect(result.claimSafety).not.toBe("insufficient");
    expect(result.grossProfitCents).toBe(99_500 - 4_250);
    expect(result.grossMarginBps).not.toBeNull();
  });

  it("scopes measured cost to one organization and one window", async () => {
    await measuredIntelligenceCost("org-1", new Date("2026-08-01"));
    const sql = queryRaw.mock.calls[0][0];
    const text = JSON.stringify(sql);
    // The mapped table name. Naming the Prisma model here would pass every static
    // check and throw 42P01 the first time this ran.
    expect(text).toContain("zumi_invocations");
    expect(text).toContain("organizationId");
  });
});
