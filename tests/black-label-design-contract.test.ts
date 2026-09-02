import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const handoff = read("docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md");
const authority = read("docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md");
const brand = read("src/components/brand/klinikos-brand.tsx");
const rose = read("src/components/brand/rose-atmosphere.tsx");

describe("Klinikos Black Label V2 Claude Design handoff", () => {
  it("records the exact Claude Design provenance and recovered Browser checksum", () => {
    expect(handoff).toContain("b846c1b8-35fb-440f-b883-90dc9fd34483");
    expect(handoff).toContain("Klinikos Browser.dc.html");
    expect(handoff).toContain("6e471a857cb13ce68d67a29249db5e19825ba0e738df209c92f4dd4bbb626b01");
  });

  it("locks the defining Black Label interaction grammar", () => {
    expect(handoff).toContain("Intelligence becomes interface");
    expect(handoff).toContain("ENVIRONMENT → WORKSPACE → OBJECT STAGE → INSPECTOR → CRITICAL DECISION");
    expect(handoff).toContain("INITIAL → PREVIOUS → TODAY");
    expect(handoff).toContain("PERFORMED → DOCUMENTED → CODED → CLAIMED → PAID");
    expect(handoff).toContain("Living Edge");
  });

  it("forbids parallel frontend authority stacks", () => {
    expect(handoff).toContain("No parallel shell");
    expect(handoff).toContain("No parallel Grid");
    expect(handoff).toContain("No parallel EDU");
    expect(handoff).toContain("No parallel Zumi");
    expect(handoff).toContain("Do not create `BlackLabelTheme`");
  });

  it("keeps Design preview behavior subordinate to production authority", () => {
    expect(handoff).toContain("Production/runtime authority: **No**");
    expect(handoff).toContain("design-preview-only");
    expect(handoff).toContain("A beautiful false state is worse than an unfinished truthful one");
  });

  it("binds Black Label to the production-approved Klinikos artwork already in the app", () => {
    for (const asset of [
      "/klinikos-orbital-k-production.png",
      "/klinikos-wordmark-production.png",
      "/klinikos-rose-hero-production.png",
      "/klinikos-rose-wide-production.png",
    ]) expect(handoff).toContain(asset);

    expect(brand).toContain('/klinikos-orbital-k-production.png');
    expect(brand).toContain('/klinikos-wordmark-transparent.png');
    expect(rose).toContain('/klinikos-rose-hero-production.png');
    expect(rose).toContain('/klinikos-rose-wide-production.png');
  });

  it("keeps the broader design authority and Living Home lock intact", () => {
    expect(authority).toContain("AUTHORITATIVE DESIGN SOURCE");
    expect(authority).toContain("APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md");
    expect(authority).toContain("KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md");
    expect(authority).toContain("Black Label V2");
  });
});
