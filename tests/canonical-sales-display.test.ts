import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalizeSalesDisplayText } from "@/lib/sales/canonical-display";

const customerSurfaces = [
  "src/app/sales/page.tsx",
  "src/app/founding-clinic/page.tsx",
  "src/components/command/founding-offer-cards.tsx",
  "src/app/(platform)/owner/founding-program/page.tsx",
  "src/lib/sales-demo-rules.ts",
] as const;

const legacyLabels = [
  "Private Workflow Demo & Cost Review",
  "Private Workflow Review",
  "Founding Clinic Evaluation",
  "Founding Clinic Program",
] as const;

describe("canonical sales display", () => {
  it("normalizes historical deterministic copy without mutating stored keys", () => {
    expect(canonicalizeSalesDisplayText("Request a Private Workflow Review")).toBe("Request a Clinic Operating Analysis");
    expect(canonicalizeSalesDisplayText("Proceed to Founding Clinic Evaluation")).toBe("Proceed to Implementation Blueprint");
    expect(canonicalizeSalesDisplayText("Founding Clinic Program after review")).toBe("Founding Clinic Implementation after review");
  });

  it("keeps legacy commercial labels out of customer and owner display sources", () => {
    for (const source of customerSurfaces) {
      const text = readFileSync(join(process.cwd(), source), "utf8");
      for (const label of legacyLabels) {
        expect({ source, label, present: text.includes(label) }).toEqual({ source, label, present: false });
      }
    }
  });

  it("keeps compatibility keys intact while labels move forward", () => {
    const rules = readFileSync(join(process.cwd(), "src/lib/sales-demo-rules.ts"), "utf8");
    expect(rules).toContain('"private_workflow_demo"');
    expect(rules).toContain('"founding_clinic_evaluation"');
    expect(rules).toContain('"founding_clinic_program"');
    expect(rules).toContain('name: "Clinic Operating Analysis"');
    expect(rules).toContain('name: "Implementation Blueprint"');
    expect(rules).toContain('name: "Founding Clinic Implementation"');
  });
});
