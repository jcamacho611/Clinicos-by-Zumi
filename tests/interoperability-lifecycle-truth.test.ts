import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  INTEROPERABILITY_LIFECYCLE,
  resolveInteroperabilityLifecycle,
} from "@/lib/integrations/interoperability-lifecycle";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("interoperability lifecycle truth", () => {
  it("defines the canonical external integration lifecycle", () => {
    expect(INTEROPERABILITY_LIFECYCLE).toEqual([
      "PLANNED",
      "CONTRACT_PENDING",
      "CREDENTIALS_PENDING",
      "SANDBOX",
      "CONNECTED",
      "UAT",
      "CONTROLLED_PRODUCTION",
      "PRODUCTION_VERIFIED",
      "DEGRADED",
      "DISABLED",
    ]);
  });

  it("never upgrades legacy connected or active state into production verification", () => {
    expect(resolveInteroperabilityLifecycle({ status: "connected", phase: null })).toMatchObject({
      lifecycle: "CONNECTED",
      productionVerified: false,
      productionClaimAllowed: false,
    });
    expect(resolveInteroperabilityLifecycle({ status: "active", phase: null })).toMatchObject({
      lifecycle: "CONNECTED",
      productionVerified: false,
      productionClaimAllowed: false,
    });
  });

  it("requires explicit production-verification evidence to permit a production-verified claim", () => {
    expect(resolveInteroperabilityLifecycle({ status: "connected", phase: "production_verified", productionEvidenceRef: null }).lifecycle).toBe("CONTROLLED_PRODUCTION");

    expect(resolveInteroperabilityLifecycle({
      status: "connected",
      phase: "production_verified",
      productionEvidenceRef: "evidence/integration/quest-labs/2026-08-22",
    })).toMatchObject({
      lifecycle: "PRODUCTION_VERIFIED",
      productionVerified: true,
      productionClaimAllowed: true,
    });
  });

  it("normalizes current and legacy phase vocabulary without inventing readiness", () => {
    expect(resolveInteroperabilityLifecycle({ status: "pending", phase: "contracting" }).lifecycle).toBe("CONTRACT_PENDING");
    expect(resolveInteroperabilityLifecycle({ status: "pending", phase: "credentials" }).lifecycle).toBe("CREDENTIALS_PENDING");
    expect(resolveInteroperabilityLifecycle({ status: "configured", phase: "sandbox" }).lifecycle).toBe("SANDBOX");
    expect(resolveInteroperabilityLifecycle({ status: "connected", phase: "uat" }).lifecycle).toBe("UAT");
    expect(resolveInteroperabilityLifecycle({ status: "active", phase: "controlled_production" }).lifecycle).toBe("CONTROLLED_PRODUCTION");
  });

  it("lets degraded and disabled truth override optimistic phase labels", () => {
    expect(resolveInteroperabilityLifecycle({ status: "degraded", phase: "production_verified", productionEvidenceRef: "evidence/ref" }).lifecycle).toBe("DEGRADED");
    expect(resolveInteroperabilityLifecycle({ status: "disabled", phase: "production_verified", productionEvidenceRef: "evidence/ref" }).lifecycle).toBe("DISABLED");
  });

  it("fails closed for unknown state vocabulary", () => {
    const result = resolveInteroperabilityLifecycle({ status: "mystery", phase: "future-phase" });
    expect(result.lifecycle).toBe("PLANNED");
    expect(result.productionVerified).toBe(false);
    expect(result.productionClaimAllowed).toBe(false);
    expect(result.reason).toContain("not recognized");
  });

  it("projects canonical lifecycle into System Health instead of treating raw vendor state as production truth", () => {
    const repository = read("src/lib/repositories/system-health-repository.ts");
    const workspace = read("src/components/clinic/system-health-workspace.tsx");

    expect(repository).toContain("resolveInteroperabilityLifecycle");
    expect(repository).toContain("lifecycle");
    expect(repository).toContain("productionVerified");
    expect(repository).toContain("productionClaimAllowed");
    expect(workspace).toContain("Connection lifecycle");
    expect(workspace).toContain("Production verified");
    expect(workspace).toContain("Not production verified");
    expect(workspace).not.toMatch(/status === ["']connected["'].*Production verified/);
  });
});