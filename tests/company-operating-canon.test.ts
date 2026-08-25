import { describe, expect, it } from "vitest";
import {
  capitalTrackRegistry,
  companyCadenceRegistry,
  companyFunctionRegistry,
  companyMetricRegistry,
  companyValueLoop,
} from "@/lib/company-operating-canon";

describe("company operating canon", () => {
  it("covers the required company functions without duplicate ids", () => {
    const ids = companyFunctionRegistry.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const id of [
      "executive-strategy",
      "product",
      "engineering-platform",
      "clinical-informatics",
      "revenue-cycle-payer",
      "security-privacy-trust",
      "growth-marketing",
      "sales-commercial",
      "implementation-customer-success",
      "finance-treasury",
      "legal-corporate-governance",
      "partnerships-corporate-development",
      "grid-marketplace-operations",
      "edu-workforce",
      "enterprise-procurement",
      "data-analytics",
      "public-sector-government",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("requires every company function to define an operating question, outcomes, and metrics", () => {
    for (const item of companyFunctionRegistry) {
      expect(item.operatingQuestion.length).toBeGreaterThan(15);
      expect(item.outcomes.length).toBeGreaterThan(0);
      expect(item.metricIds.length).toBeGreaterThan(0);
    }
  });

  it("defines daily, weekly, monthly, and quarterly operating cadences", () => {
    const cadenceIds = companyCadenceRegistry.map((item) => item.id);
    expect(cadenceIds).toEqual(expect.arrayContaining(["daily", "weekly", "monthly", "quarterly"]));

    for (const cadence of companyCadenceRegistry) {
      expect(cadence.reviewItems.length).toBeGreaterThan(0);
    }
  });

  it("keeps capital sources distinct by economic purpose", () => {
    const ids = capitalTrackRegistry.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "customer-capital",
        "non-dilutive",
        "venture-equity",
        "debt",
        "strategic-capital",
      ]),
    );

    for (const item of capitalTrackRegistry) {
      expect(item.bestUse.length).toBeGreaterThan(10);
      expect(item.primaryRisk.length).toBeGreaterThan(10);
    }
  });

  it("preserves the full company value loop from discovery through compounding", () => {
    expect(companyValueLoop).toEqual([
      "DISCOVER",
      "SELL",
      "CONTRACT",
      "COLLECT",
      "IMPLEMENT",
      "ACTIVATE",
      "FIRST_VALUE",
      "REPEATED_VALUE",
      "RETAIN",
      "EXPAND",
      "GRID_NETWORK",
      "COMPOUND",
    ]);
  });

  it("tracks the company metrics needed to run a real business, not code volume", () => {
    const ids = companyMetricRegistry.map((item) => item.id);

    for (const id of [
      "cash-received",
      "mrr",
      "arr",
      "gross-margin",
      "qualified-pipeline",
      "activation-rate",
      "time-to-first-value",
      "customer-retention",
      "expansion-revenue",
      "grid-fulfillment",
      "security-incidents",
      "uptime",
      "runway",
    ]) {
      expect(ids).toContain(id);
    }
  });
});
