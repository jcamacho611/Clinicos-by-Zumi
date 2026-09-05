import { describe, expect, it } from "vitest";
import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";
import { memberRealityProjection } from "@/lib/living-reality/member-reality-projection";

const memberProjection: MemberHomeProjection & {
  secret: string;
  passwordHash: string;
  internalScore: number;
} = {
  person: { displayName: "Jordan Member" },
  activeLens: "lifecycle",
  lenses: [
    { id: "healthcare_universe", number: "01", title: "Healthcare Universe", description: "Care context", status: "available" },
    { id: "economic_resource", number: "02", title: "Economic & Resource", description: "Economic context", status: "available" },
    { id: "lifecycle", number: "03", title: "Lifecycle", description: "Journey context", status: "active" },
    { id: "operating_infrastructure", number: "04", title: "Operating Infrastructure", description: "Infrastructure context", status: "available" },
    { id: "compounding_business", number: "05", title: "Company Compounding", description: "Compounding context", status: "available" },
  ],
  object: {
    id: "person_opaque_123",
    title: "Jordan Member",
    kind: "Person",
    state: "active",
    summary: "One governed Person identity.",
    claimStatus: "claimed",
    authorityNotice: "Claims do not create authority.",
  },
  timeline: { before: "Account created", now: "Member active", next: "Complete evidence" },
  inspector: {
    eyebrow: "Identity",
    title: "What is true",
    body: "A member account exists.",
    evidence: ["Account evidence"],
    authority: ["No clinical authority"],
  },
  actions: [
    { id: "grid", label: "Explore Grid", href: "/grid", description: "Find governed opportunities." },
    { id: "member", label: "Living Home", href: "/member" },
  ],
  secret: "must-not-cross",
  passwordHash: "must-not-cross",
  internalScore: 99,
};

describe("P01 RealityProjection", () => {
  it("constructs a minimum-necessary member spatial projection", () => {
    const projected = memberRealityProjection(memberProjection);

    expect(projected.realityId).toBe("member-living-home");
    expect(projected.contextId).toBe("person_opaque_123");
    expect(projected.modeHint).toBe("FULL_REALITY");
    expect(projected.cameraIntent).toBe("ARRIVAL");
    expect(projected.activeObject?.id).toBe("person_opaque_123");
    expect(projected.nodes).toHaveLength(6);
    expect(projected.edges).toHaveLength(5);
    expect(projected.precisionActions).toEqual([
      { id: "grid", label: "Explore Grid", href: "/grid" },
      { id: "member", label: "Living Home", href: "/member" },
    ]);
  });

  it("uses an explicit safe node allowlist and drops source-only fields", () => {
    const projected = memberRealityProjection(memberProjection);
    const active = projected.nodes[0];

    expect(Object.keys(active)).toEqual([
      "id",
      "kind",
      "label",
      "state",
      "summary",
      "claimStatus",
      "routeRef",
    ]);
    const serialized = JSON.stringify(projected);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("internalScore");
    expect(serialized).not.toContain("must-not-cross");
    expect(serialized).not.toContain("authorityNotice");
  });

  it("projects exactly the five constitutional lenses without inventing density", () => {
    const projected = memberRealityProjection(memberProjection);
    const lensNodes = projected.nodes.filter((node) => node.kind === "canonical_plane_lens");

    expect(lensNodes.map((node) => node.id)).toEqual([
      "lens:healthcare_universe",
      "lens:economic_resource",
      "lens:lifecycle",
      "lens:operating_infrastructure",
      "lens:compounding_business",
    ]);
    expect(projected.attention).toEqual([]);
  });
});
