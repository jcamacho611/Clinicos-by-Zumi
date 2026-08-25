import { describe, expect, it } from "vitest";
import { companyMetricRegistry } from "@/lib/company-operating-canon";
import {
  companyDecisionClassRegistry,
  companyExecutiveBriefContract,
  companyRegisterRegistry,
  companyRevenueEngineRegistry,
  companyStageRegistry,
  zumiCompanyAuthorityRegistry,
} from "@/lib/company-execution-control-plane";

describe("company execution control plane", () => {
  it("defines unique authoritative company registers", () => {
    const ids = companyRegisterRegistry.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const id of [
      "customer-prospect",
      "offer-pricing",
      "contract",
      "vendor-subprocessor",
      "capital-opportunity",
      "lender-readiness",
      "investor-evidence",
      "company-risk",
      "decision",
      "hiring-bottleneck",
      "partnership",
      "build-buy-partner",
      "customer-value-evidence",
      "grid-liquidity",
      "edu-institutional-pipeline",
      "security-assurance",
      "integration-truth",
      "corporate-governance",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("requires every register to preserve ownership, evidence, truth, and next action", () => {
    for (const register of companyRegisterRegistry) {
      expect(register.ownerFunctionId.length).toBeGreaterThan(2);
      expect(register.requiredFields).toEqual(
        expect.arrayContaining([
          "source",
          "sourceDate",
          "owner",
          "truthClass",
          "evidenceLocation",
          "status",
          "nextAction",
          "nextActionOwner",
          "reviewDate",
          "supersessionState",
        ]),
      );
    }
  });

  it("orders company stage gates from truth foundation through platform scale", () => {
    expect(companyStageRegistry.map((item) => item.id)).toEqual([
      "truth-foundation",
      "cash-proof",
      "repeatable-value",
      "network-proof",
      "enterprise-proof",
      "platform-scale",
    ]);

    for (const [index, stage] of companyStageRegistry.entries()) {
      expect(stage.order).toBe(index);
      expect(stage.entryEvidence.length).toBeGreaterThan(0);
      expect(stage.exitEvidence.length).toBeGreaterThan(0);
      expect(stage.allowedClaims.length).toBeGreaterThan(0);
      expect(stage.forbiddenShortcuts.length).toBeGreaterThan(0);
    }
  });

  it("never uses scenario-only metrics as stage-gate proof", () => {
    const metricTruth = new Map(companyMetricRegistry.map((metric) => [metric.id, metric.truthClass]));

    for (const stage of companyStageRegistry) {
      for (const metricId of stage.evidenceMetricIds) {
        expect(metricTruth.has(metricId), `unknown metric ${metricId}`).toBe(true);
        expect(metricTruth.get(metricId), `${stage.id} cannot use ${metricId} as proof`).not.toBe("SCENARIO_ONLY");
      }
    }
  });

  it("defines connected revenue engines with buyer, owner, monetization, and proof", () => {
    const ids = companyRevenueEngineRegistry.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const id of [
      "paid-analysis",
      "implementation",
      "care-subscription",
      "zumi-intelligence",
      "revenue-os",
      "grid",
      "edu",
      "enterprise",
      "integration-api",
      "professional-services",
      "payer-employer",
    ]) {
      expect(ids).toContain(id);
    }

    for (const engine of companyRevenueEngineRegistry) {
      expect(engine.buyerClasses.length).toBeGreaterThan(0);
      expect(engine.ownerFunctionId.length).toBeGreaterThan(2);
      expect(engine.monetizationClasses.length).toBeGreaterThan(0);
      expect(engine.proofRequirements.length).toBeGreaterThan(0);
    }
  });

  it("keeps Zumi company authority explicit and preserves non-delegable boundaries", () => {
    const ids = zumiCompanyAuthorityRegistry.map((item) => item.id);
    expect(ids).toEqual(["L0", "L1", "L2", "L3", "L4", "L5"]);

    const nonDelegable = zumiCompanyAuthorityRegistry.find((item) => item.id === "L5");
    expect(nonDelegable?.examples).toEqual(
      expect.arrayContaining([
        "legal signature authority",
        "ownership authority",
        "banking authority",
        "professional clinical authority",
        "patient consent",
        "regulated credential authority",
        "irreversible third-party commitments outside approved policy",
        "unsupported public claims",
      ]),
    );
  });

  it("classifies consequential company decisions", () => {
    expect(companyDecisionClassRegistry.map((item) => item.id)).toEqual([
      "routine-reversible",
      "material-reversible",
      "material-irreversible",
      "non-delegable",
    ]);

    for (const decisionClass of companyDecisionClassRegistry) {
      expect(decisionClass.approvalRule.length).toBeGreaterThan(10);
      expect(decisionClass.requiredRegisters.length).toBeGreaterThan(0);
    }
  });

  it("defines the executive brief as current truth plus one highest-leverage action", () => {
    expect(companyExecutiveBriefContract.sections).toEqual([
      "currentTruth",
      "customerAndPipeline",
      "productionAndSecurity",
      "capitalAndRunway",
      "activeStage",
      "highestLeverageBottleneck",
      "nextAction",
      "evidenceNeeded",
    ]);
    expect(companyExecutiveBriefContract.maxPrimaryActions).toBe(1);
  });
});