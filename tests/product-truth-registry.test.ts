import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type TruthState =
  | "PRODUCTION_VERIFIED"
  | "DEPLOYED_UNVERIFIED"
  | "MERGED_NOT_DEPLOYED"
  | "IMPLEMENTED_UNVERIFIED"
  | "IN_ACTIVE_DEVELOPMENT"
  | "APPROVED_DESIGN"
  | "PLANNED"
  | "BLOCKED"
  | "DEPRECATED";

type RegistryRecord = {
  key: string;
  name: string;
  domainOwner: string;
  truthState: TruthState;
  evidencePaths: string[];
  externalDependencyState: string;
  publicClaimPolicy: string;
  authoritativeSource: string;
};

type ProductTruthRegistry = {
  schemaVersion: number;
  auditedMainSha: string;
  auditedAt: string;
  records: RegistryRecord[];
};

const allowedStates = new Set<TruthState>([
  "PRODUCTION_VERIFIED",
  "DEPLOYED_UNVERIFIED",
  "MERGED_NOT_DEPLOYED",
  "IMPLEMENTED_UNVERIFIED",
  "IN_ACTIVE_DEVELOPMENT",
  "APPROVED_DESIGN",
  "PLANNED",
  "BLOCKED",
  "DEPRECATED",
]);

function loadRegistry() {
  const raw = fs.readFileSync(path.join(process.cwd(), "governance/product-truth-registry.json"), "utf8");
  return JSON.parse(raw) as ProductTruthRegistry;
}

describe("Klinikos product truth registry", () => {
  it("uses only explicit supported truth states with unique capability keys", () => {
    const registry = loadRegistry();
    expect(registry.schemaVersion).toBe(1);
    expect(registry.auditedMainSha).toMatch(/^[0-9a-f]{40}$/);
    expect(Number.isNaN(Date.parse(registry.auditedAt))).toBe(false);

    const keys = registry.records.map((record) => record.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const record of registry.records) {
      expect(allowedStates.has(record.truthState)).toBe(true);
      expect(record.evidencePaths.length).toBeGreaterThan(0);
      expect(record.authoritativeSource.length).toBeGreaterThan(0);
      for (const evidencePath of record.evidencePaths) {
        expect(fs.existsSync(path.join(process.cwd(), evidencePath)), `${record.key} evidence missing: ${evidencePath}`).toBe(true);
      }
      expect(fs.existsSync(path.join(process.cwd(), record.authoritativeSource)), `${record.key} source missing: ${record.authoritativeSource}`).toBe(true);
    }
  });

  it("contains the first cross-company capabilities needed for external claim discipline", () => {
    const registry = loadRegistry();
    const keys = new Set(registry.records.map((record) => record.key));
    for (const key of [
      "public.living-home",
      "grid.core",
      "zumi.public",
      "care.current-visit",
      "edu.core",
      "financial.payment-evidence",
      "operating-network.architecture",
    ]) {
      expect(keys.has(key), `${key} is missing`).toBe(true);
    }
  });

  it("does not allow an unqualified live claim below production-verified evidence", () => {
    const registry = loadRegistry();
    for (const record of registry.records) {
      if (record.publicClaimPolicy === "claim-live-unqualified") {
        expect(record.truthState, `${record.key} cannot claim live unqualified`).toBe("PRODUCTION_VERIFIED");
      }
    }
  });

  it("keeps external-rail status explicit instead of inferring it from internal code", () => {
    const registry = loadRegistry();
    for (const record of registry.records) {
      expect(record.externalDependencyState.length).toBeGreaterThan(0);
    }
    expect(registry.records.find((record) => record.key === "care.current-visit")?.publicClaimPolicy)
      .not.toBe("claim-certified-ehr");
    expect(registry.records.find((record) => record.key === "financial.payment-evidence")?.publicClaimPolicy)
      .not.toBe("claim-live-unqualified");
  });
});
