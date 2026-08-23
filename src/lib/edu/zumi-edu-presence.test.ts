import { describe, expect, it } from "vitest";

import { zumiPresenceSchema } from "@/features/zumi/presence";

describe("Zumi EDU presence", () => {
  it("accepts the education surface for Klinikos EDU", () => {
    const parsed = zumiPresenceSchema.parse({ surface: "education", pathname: "/edu/programs/healthcare" });
    expect(parsed.surface).toBe("education");
  });
});
