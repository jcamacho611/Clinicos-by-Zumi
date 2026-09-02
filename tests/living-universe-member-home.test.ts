import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UniverseShell, type MemberHomeProjection } from "@/components/living-universe/universe-shell";
import { canonicalEcosystemGraph } from "@/lib/ecosystem/canonical-ecosystem-graph";

const projection: MemberHomeProjection = {
  person: {
    displayName: "Jordan Lee",
  },
  activeLens: "lifecycle",
  lenses: canonicalEcosystemGraph.planes.map((plane, index) => ({
    id: plane.id,
    number: String(index + 1).padStart(2, "0"),
    title: plane.label,
    description: `${plane.label} explains this Person-owned object without changing its authority.`,
    status: plane.id === "lifecycle" ? "active" : "available",
  })),
  object: {
    id: "person-profile",
    title: "Your Klinikos identity",
    kind: "Person profile",
    state: "Account active",
    summary: "Your person-owned identity can carry governed context without classifying you as a patient, professional, learner, or organization.",
    claimStatus: "unverified",
    authorityNotice: "An active account is not a verified credential, role, eligibility decision, or authority.",
  },
  timeline: {
    before: "You created one person-owned account.",
    now: "Add the evidence that supports what you can do.",
    next: "Use verified evidence when an opportunity evaluates eligibility.",
  },
  inspector: {
    eyebrow: "Evidence and authority",
    title: "What Klinikos knows",
    body: "Your account identifies you. It does not grant a license, role, or patient access.",
    evidence: ["Profile claim received", "No credential verification recorded"],
    authority: ["Claimed does not mean verified", "Eligibility is decided per opportunity"],
  },
  actions: [
    { id: "grid", label: "Explore Grid", href: "/grid", description: "See discoverable opportunities." },
    { id: "edu", label: "Continue learning", href: "/edu", description: "Build supported evidence." },
    { id: "home", label: "Return home", href: "/member" },
  ],
};

describe("person-level Living Universe home", () => {
  it("renders the server-projected canonical plane order, titles and numbers", () => {
    const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));
    const expected = canonicalEcosystemGraph.planes.map((plane, index) => ({
      id: plane.id,
      title: plane.label,
      number: String(index + 1).padStart(2, "0"),
    }));

    expect(projection.lenses.map(({ id, title, number }) => ({ id, title, number }))).toEqual(expected);
    for (const plane of expected) {
      expect(html).toContain(plane.title.replaceAll("&", "&amp;"));
      expect(html).toContain(`>${plane.number}<`);
    }
  });

  it("keeps one Person object while explaining lifecycle and authority truth", () => {
    const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));

    expect(html).toContain("Jordan Lee");
    expect(html).toContain('data-living-object-id="person-profile"');
    expect(html).toContain("Before");
    expect(html).toContain("Now");
    expect(html).toContain("Next");
    expect(html).toContain("Your Klinikos identity");
    expect(html).toContain("Eligibility is decided per opportunity");
    expect(html).not.toContain("Organization dashboard");
    expect(html).not.toContain("Patient record");
    expect(html).toContain("Sign out");
  });

  it("offers a keyboard-operable mobile inspector and only approved continuations", () => {
    const unsafe = {
      ...projection,
      actions: [
        { id: "path", label: "Continue path", href: "/portal/login?path=patient-find-care" },
        ...projection.actions,
        { id: "unsafe-api", label: "Mutation", href: "/api/account/signup" },
        { id: "unsafe-near-prefix", label: "Near prefix", href: "/grid-evil/collect" },
        { id: "unsafe", label: "Untrusted", href: "https://example.test" },
      ],
    } as unknown as MemberHomeProjection;
    const html = renderToStaticMarkup(createElement(UniverseShell, { projection: unsafe }));

    expect(html).toContain('data-mobile-inspector="true"');
    expect(html).toContain("Open Inspector");
    expect(html).toContain('href="/grid"');
    expect(html).toContain('href="/edu"');
    expect(html).toContain('href="/member"');
    expect(html).toContain('href="/portal/login?path=patient-find-care"');
    expect(html).not.toContain('/api/account/signup');
    expect(html).not.toContain('/grid-evil/collect');
    expect(html).not.toContain("https://example.test");
  });

  it("wires the member route to the person session and server projection", () => {
    const page = readFileSync("src/app/member/page.tsx", "utf8");

    expect(page).toContain("requirePersonAccountSession");
    expect(page).toContain("getMemberHomeProjection");
    expect(page).toContain("klinikosPathCatalog.find");
    expect(page).toContain("requestedPath?.id");
    expect(page).toContain("<UniverseShell projection={projection}");
    expect(page).not.toContain("demo");
    expect(page).not.toContain("mock");
  });
});
