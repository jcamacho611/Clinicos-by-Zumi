import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_LIVING_ACTIONS } from "@/lib/marketing/public-living-actions";
import { PUBLIC_PRIMARY_NAVIGATION } from "@/lib/screen-experience-route-presentation";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Action-First public Living Universe", () => {
  const source = read("src/components/marketing/public-living-gateway.tsx");
  const page = read("src/app/page.tsx");

  it("leads with everyday intent instead of a module catalog", () => {
    expect(source).toContain("What do you need today?");
    expect(source).toContain("Tell Klinikos what you need");
    const labels = PUBLIC_LIVING_ACTIONS.map((action) => action.label);
    expect(labels).toContain("I need care");
    expect(labels).toContain("I need work");
    expect(labels).toContain("I need someone tomorrow");
    expect(labels).toContain("I have my own client");
    expect(labels).toContain("I need a room");
    expect(labels).toContain("I have rooms open Friday");
    expect(labels).toContain("I want to learn");
    expect(labels).toContain("I need a clinical placement");
    expect(labels).toContain("Help me run my practice");
    expect(labels).toContain("Why hasn't this been paid?");
    expect(PUBLIC_LIVING_ACTIONS).toHaveLength(17);
    expect(new Set(PUBLIC_LIVING_ACTIONS.map((action) => action.category))).toEqual(
      new Set(["need", "offer", "grow"]),
    );
    expect(PUBLIC_LIVING_ACTIONS.filter((action) => action.category === "need")).toHaveLength(9);
    expect(PUBLIC_LIVING_ACTIONS.filter((action) => action.category === "offer")).toHaveLength(4);
    expect(PUBLIC_LIVING_ACTIONS.filter((action) => action.category === "grow")).toHaveLength(4);
    expect(source).toContain("What I need");
    expect(source).toContain("What I can offer");
    expect(source).toContain("What I want to build");
    expect(source).toContain("data-public-action-id={action.id}");
    expect(source).toContain("data-public-action-side={action.side}");
    expect(source).toContain("data-public-action-category={action.category}");
  });

  it("reuses the current public Zumi server path for quick intents", () => {
    expect(source).toContain("PUBLIC_LIVING_ACTIONS");
    expect(source).toContain("void sendPrompt(action.prompt, action.id)");
    expect(source).toContain("...(actionId ? { actionId } : {})");
    expect(source).not.toContain("...(pathId ? { pathId } : {})");
    expect(source).toContain('fetch("/api/zumi/public"');
    expect(source).toContain("cannot open private clinic records or make changes");
    expect(source).toContain("Do not enter patient information here.");
  });

  it("keeps public navigation simple and offers a real free entry", () => {
    const publicDestinations = PUBLIC_PRIMARY_NAVIGATION.map((item) => item.href);
    expect(publicDestinations).toContain("/how-it-works");
    // Free entry moved from the Grid-specific funnel to the one Person account.
    // The law this asserts — the front door offers a real free entry — is unchanged;
    // /signup is now the entry that creates the single Klinikos identity, and it is
    // backed by a real page and API rather than a Grid participant record.
    expect(source).toContain('href="/signup"');
    expect(source).toContain("Join free");
    expect(source).toContain('href="/login"');

    expect(PUBLIC_PRIMARY_NAVIGATION.map((item) => item.label)).not.toContain("Clinics");
    expect(PUBLIC_PRIMARY_NAVIGATION.map((item) => item.label)).not.toContain("Grid");
    expect(PUBLIC_PRIMARY_NAVIGATION.map((item) => item.label)).not.toContain("EDU");
    expect(PUBLIC_PRIMARY_NAVIGATION.map((item) => item.label)).not.toContain("Pricing");
    expect(PUBLIC_PRIMARY_NAVIGATION.map((item) => item.label)).not.toContain("Trust");
  });

  it("keeps the root focused on the Living Universe gateway", () => {
    expect(page).toContain("PublicLivingGateway");
    expect(page).toContain("PublicTrustFooter");
    expect(page).not.toContain("ProductEvidenceSection");
    expect(page).not.toContain("EcosystemHierarchy");
  });
});
