import { describe, expect, it } from "vitest";
import {
  capitalOpportunitySeedRegistry,
  lenderReadinessSeedRegistry,
} from "@/lib/company-capital-register";

describe("company capital register seeds", () => {
  it("seeds the current high-priority external capital opportunities with source and review evidence", () => {
    const ids = capitalOpportunitySeedRegistry.map((item) => item.recordId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "techstars-ai-health-baltimore-2026",
        "techstars-northwestern-healthcare-2026",
        "techstars-nyc-2026",
        "nsf-sbir-sttr-2026",
        "nih-sbir-sttr-2026",
        "ny-ventures-preseed-seed-2026",
      ]),
    );

    for (const item of capitalOpportunitySeedRegistry) {
      expect(item.truthClass).toBe("CURRENT_FACT");
      expect(item.sourceUrl.startsWith("https://")).toBe(true);
      expect(item.sourceDate).toBe("2026-08-25");
      expect(item.reverifyBeforeAction).toBe(true);
      expect(item.status).not.toMatch(/approved|awarded|funded|secured/i);
      expect(item.nextAction.length).toBeGreaterThan(20);
    }
  });

  it("keeps accelerator dilution and non-dilutive capital economically distinct", () => {
    const techstarsNyc = capitalOpportunitySeedRegistry.find(
      (item) => item.recordId === "techstars-nyc-2026",
    );
    const nsf = capitalOpportunitySeedRegistry.find(
      (item) => item.recordId === "nsf-sbir-sttr-2026",
    );

    expect(techstarsNyc?.capitalType).toBe("accelerator_equity");
    expect(techstarsNyc?.dilution).toContain("5% common");
    expect(techstarsNyc?.dilution).toContain("uncapped MFN SAFE");

    expect(nsf?.capitalType).toBe("non_dilutive_rnd");
    expect(nsf?.dilution).toBe("none");
    expect(nsf?.repayment).toBe("none, subject to award compliance and allowed costs");
  });

  it("seeds lender readiness targets without authorizing an application or hard inquiry", () => {
    const ids = lenderReadinessSeedRegistry.map((item) => item.recordId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "pursuit-main-street-capital",
        "renaissance-nyc-elevating",
        "renaissance-community-advantage",
        "accompany-community-advantage",
        "nys-sbrlf2",
        "ny-forward-loan-fund-ii",
      ]),
    );

    for (const item of lenderReadinessSeedRegistry) {
      expect(item.truthClass).toBe("CURRENT_FACT");
      expect(item.applicationState).toBe("not_applied");
      expect(item.hardInquiryAuthorized).toBe(false);
      expect(item.sourceUrl.startsWith("https://")).toBe(true);
      expect(item.reverifyBeforeApplication).toBe(true);
      expect(item.decision).toBe("none");
    }
  });

  it("marks currently mismatched lender programs as do-not-apply rather than deleting them", () => {
    const nyForward = lenderReadinessSeedRegistry.find(
      (item) => item.recordId === "ny-forward-loan-fund-ii",
    );

    expect(nyForward?.priority).toBe("C");
    expect(nyForward?.status).toBe("do_not_apply_yet");
    expect(nyForward?.qualificationGaps.join(" ")).toMatch(/one year|time in business/i);
  });

  it("does not encode intended Klinikos ownership, revenue, customers, or funding as register facts", () => {
    const serialized = JSON.stringify({
      capitalOpportunitySeedRegistry,
      lenderReadinessSeedRegistry,
    });

    expect(serialized).not.toContain("70% / 30%");
    expect(serialized).not.toContain("888 70%");
    expect(serialized).not.toMatch(/customerCount|currentRevenue|capitalSecured/);
  });
});
