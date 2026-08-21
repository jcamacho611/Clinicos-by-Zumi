import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

describe("public Living Home degraded conversation fallback", () => {
  it("does not repeat the production hi -> what's going on -> what can i do failure loop", () => {
    const greeting = resolvePublicLivingIntent("hi");
    const context = resolvePublicLivingIntent("whats going", greeting);
    const capability = resolvePublicLivingIntent("what can i do", context);

    expect(greeting.title).toBe("Hey.");
    expect(context.title).toBe("You’re in Klinikos.");
    expect(context.body).toContain("public front door");
    expect(capability.title).toBe("Start with what you need.");
    expect(capability.body).toContain("Grid");
    expect(capability.title).not.toBe("Tell me a little more.");
  });

  it("uses a different clarification when a second ambiguous turn follows the generic fallback", () => {
    const first = resolvePublicLivingIntent("make things better somehow");
    const second = resolvePublicLivingIntent("yeah that", first);

    expect(first.title).toBe("Tell me a little more.");
    expect(second.title).toBe("What outcome are you after?");
    expect(second.title).not.toBe(first.title);
    expect(second.body).toContain("fill a shift");
  });

  it("keeps clear governed routes ahead of conversational fallback", () => {
    expect(resolvePublicLivingIntent("I need a nurse Friday").destination).toMatchObject({ key: "staffing", href: "/grid" });
    expect(resolvePublicLivingIntent("I am a nursing student looking for opportunities").destination).toMatchObject({ key: "edu", href: "/edu" });
  });
});
