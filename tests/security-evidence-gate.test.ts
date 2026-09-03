import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const evidencePath = resolve(root, "docs/governance/KLINIKOS_SECURITY_EVIDENCE.json");
const gatePath = resolve(root, "scripts/security/security-evidence-gate.mjs");

type SecurityControl = {
  controlId: string;
  state: string;
  environments: string[];
  dataClasses: string[];
  owner: string;
  lastVerifiedAt: string | null;
  technicalEvidenceRefs: string[];
  operationalEvidenceRefs: string[];
  externalEvidenceRefs: string[];
  legalEvidenceRefs: string[];
  externalDependency: boolean;
  legalDependency: boolean;
  blocker: string | null;
  customerClaimAllowed: boolean;
  customerClaim: string | null;
};

type SecurityEvidence = {
  version: string;
  states: string[];
  controls: SecurityControl[];
};

function readEvidence(): SecurityEvidence {
  return JSON.parse(readFileSync(evidencePath, "utf8")) as SecurityEvidence;
}

function runGate(path = evidencePath) {
  return execFileSync(process.execPath, [gatePath, path], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function mutated(mutator: (evidence: SecurityEvidence) => void) {
  const evidence = readEvidence();
  mutator(evidence);
  const dir = mkdtempSync(resolve(tmpdir(), "klinikos-security-evidence-"));
  const path = resolve(dir, "evidence.json");
  writeFileSync(path, JSON.stringify(evidence));
  return path;
}

function control(evidence: SecurityEvidence, id: string) {
  const found = evidence.controls.find((item) => item.controlId === id);
  if (!found) throw new Error(`Missing security control ${id}`);
  return found;
}

describe("P16 security evidence release authority", () => {
  it("ships one machine-readable evidence register and validator", () => {
    expect(existsSync(evidencePath)).toBe(true);
    expect(existsSync(gatePath)).toBe(true);
    expect(runGate()).toContain("Klinikos security evidence valid: 2026-09-03.1");
  });

  it("makes security evidence part of the existing release-security chain", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    const quality = readFileSync(resolve(root, ".github/workflows/quality.yml"), "utf8");
    expect(pkg.scripts["security:evidence"]).toBe("node scripts/security/security-evidence-gate.mjs");
    expect(pkg.scripts["security:check"]).toBe(
      "npm run security:client-boundary && npm run security:env-boundary && npm run security:api-disclosure && npm run security:evidence",
    );
    expect(quality).toContain("npm run security:check");
  });

  it("keeps production PHI fail-closed in W1", () => {
    const evidence = readEvidence();
    const phi = control(evidence, "P16-PRODUCTION-PHI");
    expect(phi.state).toBe("BLOCKED");
    expect(phi.dataClasses).toContain("PHI");
    expect(phi.customerClaimAllowed).toBe(false);
    expect(phi.blocker).toMatch(/technical.*operational.*vendor.*recovery.*legal/i);
  });

  it("keeps current GitHub main protection truth manual", () => {
    const evidence = readEvidence();
    const protection = control(evidence, "P16-GITHUB-MAIN-PROTECTION");
    expect(["BLOCKED", "PARTIAL"]).toContain(protection.state);
    expect(protection.customerClaimAllowed).toBe(false);
  });

  it("rejects unsupported production verification without technical evidence", () => {
    const path = mutated((evidence) => {
      const phi = control(evidence, "P16-PRODUCTION-PHI");
      phi.state = "PRODUCTION_VERIFIED";
      phi.blocker = null;
      phi.lastVerifiedAt = new Date().toISOString();
      phi.technicalEvidenceRefs = [];
    });
    expect(() => runGate(path)).toThrow(/technicalEvidenceRefs must not be empty/);
  });

  it("rejects customer claims from incomplete evidence states", () => {
    const path = mutated((evidence) => {
      const spatial = control(evidence, "P16-P01-SPATIAL-PROJECTION");
      spatial.state = "PARTIAL";
      spatial.customerClaimAllowed = true;
      spatial.customerClaim = "Production spatial healthcare data is secure.";
    });
    expect(() => runGate(path)).toThrow(/customerClaimAllowed cannot be true/);
  });

  it("rejects placeholder ownership", () => {
    const path = mutated((evidence) => {
      control(evidence, "P16-P01-SPATIAL-PROJECTION").owner = "TBD";
    });
    expect(() => runGate(path)).toThrow(/owner contains forbidden placeholder value: TBD/);
  });

  it("cannot elevate documented-unprotected main to verified enforcement", () => {
    const path = mutated((evidence) => {
      const protection = control(evidence, "P16-GITHUB-MAIN-PROTECTION");
      protection.state = "PRODUCTION_VERIFIED";
      protection.blocker = null;
      protection.lastVerifiedAt = new Date().toISOString();
      protection.technicalEvidenceRefs = ["docs/governance/GITHUB_MAIN_PROTECTION.md"];
      protection.operationalEvidenceRefs = ["docs/governance/GITHUB_MAIN_PROTECTION.md"];
    });
    expect(() => runGate(path)).toThrow(/branch protection remains manual/i);
  });
});
