import { describe, expect, it } from "vitest";
import { memberHomeToRealityProjection } from "@/lib/living-reality/member-reality-adapter";
import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";

const fixture: MemberHomeProjection = {
  person: { displayName: "Jordan Lee" },
  activeLens: "lifecycle",
  lenses: [],
  object: {
    id: "person-profile",
    title: "Your Klinikos identity",
    kind: "Person profile",
    state: "Account active",
    summary: "Person-owned context.",
    claimStatus: "unverified",
  },
  timeline: { before: "Joined", now: "Active", next: "Continue" },
  inspector: {
    eyebrow: "Evidence",
    title: "What is true",
    body: "Bounded",
    evidence: [],
    authority: [],
  },
  actions: [{ id: "grid", label: "Explore Grid", href: "/grid" }],
};

describe("RealityProjection", () => {
  it("projects only presentation-safe fields", () => {
    const projection = memberHomeToRealityProjection(fixture);
    const serialized = JSON.stringify(projection);
    expect(projection.activeObject?.id).toBe("person-profile");
    expect(projection.precisionActions[0]?.href).toBe("/grid");
    expect(projection.edges).toEqual([]);

    for (const forbidden of [
      "password",
      "secret",
      "hiddenPrompt",
      "systemPrompt",
      "rankingWeight",
      "eligibilityScore",
      "internalMargin",
      "rawOrm",
      "organizationId",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("does not let the browser intent vocabulary express consequential authority", async () => {
    const source = await import("node:fs").then(({ readFileSync }) =>
      readFileSync("src/lib/living-reality/reality-client-intent.ts", "utf8"),
    );
    for (const forbidden of [
      "APPROVE",
      "SIGN",
      "SUBMIT",
      "PAY",
      "SETTLE",
      "PUBLISH",
      "VERIFY",
      "AUTHORIZE",
      "RANK",
      "MATCH",
      "BOOK",
      "ORDER",
    ]) {
      expect(source).not.toContain(`kind: \"${forbidden}`);
    }
  });
});
