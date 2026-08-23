import { describe, expect, it } from "vitest";

import { getZumiCapability } from "@/features/zumi/schemas";

describe("Zumi EDU capabilities", () => {
  it("declares guided workforce practice as low-risk coaching", () => {
    const capability = getZumiCapability("edu_guided_practice");
    expect(capability).toMatchObject({
      tier: "LOW",
      requiresEntitlement: null,
      requiresPermission: null,
    });
  });

  it("requires human review for instructor assistance", () => {
    const capability = getZumiCapability("edu_instructor_assist");
    expect(capability?.tier).toBe("MEDIUM");
  });

  it("declares AI-output critique as practice rather than autonomous authority", () => {
    const capability = getZumiCapability("edu_output_critique");
    expect(capability).toMatchObject({ tier: "LOW", requiresEntitlement: null });
  });
});
