import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildCompletionPlan,
  canonicalCapabilityCount,
  canonicalCapabilityId,
  clinicOsDayOneRegistry,
  completionGateKeys,
} from "../src/lib/feature-registry-canon";

const EXPECTED_SECTION_COUNT = 62;
const EXPECTED_CAPABILITY_COUNT = 2143;
const EXPECTED_CANON_SHA256 = "1cc1fa56e75621ac4e0de79070320c3388ba759b30381490437172fca4e84c03";

describe("ClinicOS Priority Zero canon", () => {
  it("keeps every numbered domain present and ordered", () => {
    expect(clinicOsDayOneRegistry.map((section) => section.number)).toEqual(
      Array.from({ length: EXPECTED_SECTION_COUNT }, (_, index) => index + 1),
    );
  });

  it("keeps every capability addressable without collisions", () => {
    const ids = clinicOsDayOneRegistry.flatMap((section) => section.features.map((feature) => canonicalCapabilityId(section.number, feature)));
    expect(ids).toHaveLength(EXPECTED_CAPABILITY_COUNT);
    expect(new Set(ids).size).toBe(ids.length);
    expect(canonicalCapabilityCount).toBe(EXPECTED_CAPABILITY_COUNT);
  });

  it("requires all 14 completion gates for every capability", () => {
    for (const section of clinicOsDayOneRegistry) {
      expect(section.features.length).toBeGreaterThan(0);
      expect(section.interfaceRoute.startsWith("/")).toBe(true);
      for (const feature of section.features) {
        const plan = buildCompletionPlan(section, feature);
        expect(Object.keys(plan)).toEqual([...completionGateKeys]);
        expect(Object.values(plan).every((value) => value.trim().length > 0)).toBe(true);
      }
    }
  });

  it("includes the combined connected-care, design, and voice non-negotiables", () => {
    const featureNames = new Set(clinicOsDayOneRegistry.flatMap((section) => section.features));
    [
      "Care Constellation network graph",
      "Diagnostic capacity search",
      "Injury Episode Room",
      "Claim readiness score",
      "Health Passport",
      "Consent Wallet",
      "Universal Intake Passport",
      "Trusted-reference knowledge layer",
      "Approved-feedback learning",
      "Push-to-talk input",
      "Partial transcript",
      "Confirm before sending",
      "No ambient recording by default",
      "Medical Mode",
      "Luxe Mode",
      "Network Mode",
      "ClinicOS Flow View",
    ].forEach((feature) => expect(featureNames.has(feature), `${feature} must remain in the canon`).toBe(true));
  });

  it("detects any silent canon removal or rewrite", () => {
    const payload = clinicOsDayOneRegistry.flatMap((section) => section.features.map((feature) => `${section.number}:${feature}`)).join("\n");
    expect(createHash("sha256").update(payload).digest("hex")).toBe(EXPECTED_CANON_SHA256);
  });
});
