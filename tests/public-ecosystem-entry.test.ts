import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ecosystem = readFileSync(join(process.cwd(), "src/components/marketing/ecosystem-flywheel.tsx"), "utf8");
const capacityEntry = readFileSync(join(process.cwd(), "src/app/grid/join/location/page.tsx"), "utf8");

describe("public ecosystem entry points", () => {
  it("starts a new care seeker in public provider discovery instead of the existing-patient portal", () => {
    expect(ecosystem).toContain('key: "care"');
    expect(ecosystem).toContain('href: "/grid/browse?intent=provider"');
    expect(ecosystem).toContain('label: "Find providers on Grid"');
    expect(ecosystem).not.toContain('key: "care", label: "I’m looking for care", statement: "Describe the need → find the appropriate entry → continue in a patient-safe experience."');
  });

  it("keeps the public capacity funnel on the current Klinikos rose and ink treatment", () => {
    expect(capacityEntry).toContain("KlinikosWordmark");
    expect(capacityEntry).toContain("#a8474e");
    expect(capacityEntry).toContain("#efaaa1");
    expect(capacityEntry).not.toContain("text-cyan-300");
    expect(capacityEntry).not.toContain("#174ea6");
  });
});
