import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const protocol = readFileSync(
  "docs/governance/KLINIKOS_SPECIALIST_COUNCIL_AND_CAPABILITY_ROUTING_PROTOCOL.md",
  "utf8",
);
const control = readFileSync("docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md", "utf8");

describe("founder orchestration and no-blocker protocol", () => {
  it("is discoverable from the mandatory multi-agent control plane", () => {
    expect(control).toContain(
      "docs/governance/KLINIKOS_SPECIALIST_COUNCIL_AND_CAPABILITY_ROUTING_PROTOCOL.md",
    );
  });

  it("keeps councils as evaluation lenses rather than parallel authorities", () => {
    expect(protocol).toContain("evaluation lenses");
    expect(protocol).toContain("not separate software modules or authorities");
    expect(protocol.toLowerCase()).toContain("one klinikos");
  });

  it("requires provider-neutral blocker routing and truthful fallbacks", () => {
    expect(protocol).toContain(
      "PRIMARY PATH → FALLBACK A → FALLBACK B → OPEN STANDARD / EXISTING PROVIDER → NATIVE IMPLEMENTATION → MANUAL-BUT-TRUTHFUL WORKFLOW",
    );
    expect(protocol).toContain("BLOCKER → ROUTE AROUND → VERIFY → CONTINUE");
    expect(protocol).toContain("Never fabricate a connection");
    expect(protocol).toContain("Never mark payment complete without evidence");
  });

  it("preserves founder authority gates on consequential fallbacks", () => {
    for (const phrase of [
      "spend or commit company funds",
      "send external communications",
      "weaken security/privacy controls",
      "expose PHI/PII",
      "materially alter approved product architecture",
      "fabricate evidence",
    ]) {
      expect(protocol).toContain(phrase);
    }
  });

  it("locks source recovery and anti-compression into repository process", () => {
    expect(protocol).toContain("Source recovery and anti-compression");
    expect(protocol).toContain("Compression is allowed; erasure is not");
    expect(protocol).toContain("never create a second Master Canon");
  });

  it("preserves the current commercial and Living Reality constitutional laws", () => {
    expect(protocol).toContain("Person identity is free");
    expect(protocol).toContain("Organization operational activation is commercial");
    expect(protocol).toContain("Exactly five canonical planes remain constitutional");
    expect(protocol).toContain("3D projects truth and attention");
  });
});
