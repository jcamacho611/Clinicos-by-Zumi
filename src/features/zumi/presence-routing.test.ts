import { describe, expect, it } from "vitest";

import { zumiSurfaceForPathname } from "@/features/zumi/presence";

describe("Zumi surface routing", () => {
  it("classifies EDU routes as education", () => {
    expect(zumiSurfaceForPathname("/edu/dashboard")).toBe("education");
    expect(zumiSurfaceForPathname("/edu/programs/healthcare")).toBe("education");
  });

  it("preserves existing specialized surfaces", () => {
    expect(zumiSurfaceForPathname("/grid")).toBe("grid");
    expect(zumiSurfaceForPathname("/portal/home")).toBe("patient_portal");
  });
});
