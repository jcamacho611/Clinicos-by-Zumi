import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UniverseShell, type MemberHomeProjection } from "@/components/living-universe/universe-shell";
import { memberRealityProjection } from "@/lib/living-reality/member-reality-projection";

const projection: MemberHomeProjection = {
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
    { id: "grid", label: "Explore Grid", href: "/grid" },
    { id: "member", label: "Living Home", href: "/member" },
  ],
};

describe("P01 member Living Reality integration", () => {
  it("preserves the semantic member application when the spatial projection is present", () => {
    const realityProjection = memberRealityProjection(projection);
    const html = renderToStaticMarkup(createElement(UniverseShell, { projection, realityProjection }));

    expect(realityProjection.realityId).toBe("member-living-home");
    expect(html).toContain('data-member-living-universe="true"');
    expect(html).toContain('href="/grid"');
    expect(html).toContain('href="/member"');
    expect(html).toContain("Evidence");
    expect(html).toContain("Account evidence");
    expect(html).toContain("Authority");
    expect(html).toContain("No clinical authority");
  });

  it("mounts the client-only Living Reality host from the server-built projection", () => {
    const page = readFileSync("src/app/member/page.tsx", "utf8");
    const shell = readFileSync("src/components/living-universe/universe-shell.tsx", "utf8");

    expect(page).toContain("const realityProjection = memberRealityProjection(projection)");
    expect(page).toContain("realityProjection={realityProjection}");
    expect(shell).toContain('data-living-reality-host="member"');
    expect(shell).toContain("data-reality-id={realityProjection.realityId}");
    expect(shell).toContain("<LivingRealityLayer projection={realityProjection} />");
    expect(shell).not.toContain("member-reality-projection");
    expect(shell).not.toMatch(/@\/lib\/(db|repositories|orchestration)/);
  });
});
