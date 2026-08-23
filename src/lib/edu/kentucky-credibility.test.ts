import { describe, expect, it } from "vitest";

import { kentuckyCredibility } from "./kentucky-credibility";

describe("Kentucky credibility narrative", () => {
  it("positions Klinikos as founder-led and practitioner-informed without unsupported awards or approvals", () => {
    expect(kentuckyCredibility.positioning).toContain("founder-led");
    expect(kentuckyCredibility.positioning).toContain("healthcare professionals");
    expect(kentuckyCredibility.positioning).not.toMatch(/SCWDB-approved|accredited|certified provider/i);
  });

  it("frames the founder as an active student-builder and technical operator", () => {
    expect(kentuckyCredibility.founder.headline).toMatch(/student-builder/i);
    expect(kentuckyCredibility.founder.proofPoints.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps practitioner input distinct from clinical authority", () => {
    expect(kentuckyCredibility.practitionerBoundary).toMatch(/does not confer clinical authority/i);
  });
});
