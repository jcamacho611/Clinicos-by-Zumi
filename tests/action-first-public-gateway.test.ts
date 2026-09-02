import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Action-First public Living Universe", () => {
  const source = read("src/components/marketing/public-living-gateway.tsx");
  const page = read("src/app/page.tsx");

  it("leads with everyday intent instead of a module catalog", () => {
    expect(source).toContain("What do you need today?");
    expect(source).toContain("Tell Klinikos what you need");
    expect(source).toContain("I need care");
    expect(source).toContain("I need work");
    expect(source).toContain("I need someone");
    expect(source).toContain("I have my own client");
    expect(source).toContain("I need a room");
    expect(source).toContain("I have space available");
    expect(source).toContain("I want to learn");
    expect(source).toContain("I need a placement");
    expect(source).toContain("Help me run my practice");
    expect(source).toContain("I need to get paid");
    expect(source).toContain("I want to grow my healthcare business");
  });

  it("reuses the current public Zumi server path for quick intents", () => {
    expect(source).toContain("quickIntentActions");
    expect(source).toContain("void sendPrompt(action.prompt)");
    expect(source).toContain('fetch("/api/zumi/public"');
    expect(source).toContain("cannot open private clinic records or make changes");
    expect(source).toContain("Do not enter patient information here.");
  });

  it("keeps public navigation simple and offers a real free entry", () => {
    expect(source).toContain('{ label: "How Klinikos helps", href: "/how-it-works" }');
    // Free entry moved from the Grid-specific funnel to the one Person account.
    // The law this asserts — the front door offers a real free entry — is unchanged;
    // /signup is now the entry that creates the single Klinikos identity, and it is
    // backed by a real page and API rather than a Grid participant record.
    expect(source).toContain('href="/signup"');
    expect(source).toContain("Join free");
    expect(source).toContain('href="/login"');

    expect(source).not.toContain('{ label: "Clinics", href: "/founding-clinic" }');
    expect(source).not.toContain('{ label: "Grid", href: "/grid" }');
    expect(source).not.toContain('{ label: "EDU", href: "/edu" }');
    expect(source).not.toContain('{ label: "Pricing", href: "/pricing" }');
    expect(source).not.toContain('{ label: "Trust", href: "/trust" }');
  });

  it("keeps the root focused on the Living Universe gateway", () => {
    expect(page).toContain("PublicLivingGateway");
    expect(page).toContain("PublicTrustFooter");
    expect(page).not.toContain("ProductEvidenceSection");
    expect(page).not.toContain("EcosystemHierarchy");
  });
});
