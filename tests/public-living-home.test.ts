import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { appearancePolicyForPath } from "@/lib/design/atmosphere";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";
import {
  isPublicDirectDestination,
  PUBLIC_PRIMARY_NAVIGATION,
} from "@/lib/screen-experience-route-presentation";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

function sha256(relative: string) {
  return createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), relative))).digest("hex");
}

describe("public Living Home intent", () => {
  it.each([
    ["I need a nurse Saturday", "staffing", "/grid"],
    ["I want training to become an injector", "edu", "/edu"],
    ["Book an appointment for me", "patient", "/portal"],
    ["Our referrals and follow-up are getting lost", "referrals", "/referrals"],
    ["Help me run my clinic", "clinic", "/dashboard"],
    ["I need a treatment room Saturday", "grid", "/grid"],
    ["Show me today's priorities", "priorities", "/tasks"],
    ["Where are we losing revenue?", "revenue", "/crm"],
    ["Show me outstanding claims", "billing", "/billing"],
    ["Show me our care gaps", "insights", "/quality"],
    ["Open the provider workspace", "care", "/provider"],
    ["I need an RN Friday night", "staffing", "/grid"],
    ["Find an LPN tomorrow", "staffing", "/grid"],
    ["Prepare our healthcare workforce RFP response", "procurement", "/dashboard"],
  ])("infers %s into a real product destination", (prompt, key, href) => {
    const resolution = resolvePublicLivingIntent(prompt);
    expect(resolution.kind).toBe("route");
    expect(resolution.destination).toMatchObject({ key, href });
    expect(resolution.body.length).toBeGreaterThan(30);
  });

  it("handles a greeting like a conversation instead of a routing failure", () => {
    const resolution = resolvePublicLivingIntent("hey");
    expect(resolution.kind).toBe("conversation");
    expect(resolution.destination).toBeNull();
    expect(resolution.title).toBe("Hey.");
    expect(resolution.body).toBe("What can I help you with?");
  });

  it("keeps an unknown request useful without exposing routing internals", () => {
    const resolution = resolvePublicLivingIntent("Help me make this better");
    expect(resolution.kind).toBe("conversation");
    expect(resolution.destination).toBeNull();
    expect(resolution.title.length).toBeGreaterThan(0);
    expect(resolution.body.length).toBeGreaterThan(40);
    expect(resolution.title).not.toBe("Tell me a little more.");
  });

  it("preserves a known destination when a short follow-up adds context", () => {
    const initial = resolvePublicLivingIntent("I need a treatment room");
    const followUp = resolvePublicLivingIntent("Saturday", initial);

    expect(followUp.kind).toBe("conversation");
    expect(followUp.destination).toMatchObject({ key: "grid", href: "/grid" });
    expect(followUp.title).toBe("Got it.");
    expect(followUp.body).toContain("Grid request");
  });

  it("lets a clear new intent override the prior conversation destination", () => {
    const initial = resolvePublicLivingIntent("I need a treatment room");
    const changedGoal = resolvePublicLivingIntent("Actually I need injector training", initial);

    expect(changedGoal.kind).toBe("route");
    expect(changedGoal.destination).toMatchObject({ key: "edu", href: "/edu" });
  });
});

describe("public Living Home conversation and accessibility contract", () => {
  const source = read("src/components/marketing/public-living-gateway.tsx");
  const publicRoute = read("src/app/api/zumi/public/route.ts");
  const continuation = read("src/lib/distribution/public-continuation.ts");
  const page = read("src/app/page.tsx");
  const atmosphere = read("src/components/design/klinikos-atmosphere.tsx");
  const brand = read("src/components/brand/klinikos-brand.tsx");
  const homeStyles = read("src/app/cinematic-home-overrides.css");

  it("uses one calm conversation-first surface", () => {
    expect(source).toContain("turns.map((turn)");
    expect(source).toContain("priorResolution");
    expect(source).toContain("KLINIKOS_PUBLIC_ENTRY_LINE");
    expect(source).toContain("KLINIKOS_SUPPORTING");
    expect(source).toContain('aria-label="Public Zumi guidance"');
    expect(page).toContain("PublicLivingGateway");
    expect(page).toContain("PublicTrustFooter");
    expect(page).not.toContain("PublicLivingUniverse");
    expect(source).toContain('data-living-universe-stage="true"');
    expect(source).toContain("PublicLivingUniverseObjectStage");
    expect(page).not.toContain("PublicConversionBridge");
  });

  it("renders one Object Stage with a non-personalized path, Inspector, and Action Dock", () => {
    const stage = read("src/components/marketing/public-living-universe-stage.tsx");
    expect(stage).toContain("Starting point");
    expect(stage).toContain("Orchestration");
    expect(stage).toContain("Continuation");
    expect(stage).not.toContain("What you brought");
    expect(stage).toContain("Inspector");
    expect(stage).toContain("Action dock");
    expect(stage).toContain('data-object-stage="true"');
  });

  it("uses bounded server intelligence while preserving the verified escalating deterministic path", () => {
    expect(source).toContain('fetch("/api/zumi/public"');
    expect(source).toContain("Public Zumi can answer general Klinikos questions");
    expect(publicRoute).toContain("resolvePublicZumiTurn");
    expect(publicRoute).not.toContain("getClinicSession");

    expect(source).toContain("let unresolvedTurns = 0");
    expect(source).toContain("priorResolution,");
    expect(source).toContain("unresolvedTurns,");
    expect(publicRoute).toContain("resolvePublicLivingIntent(");
    expect(publicRoute).toContain("parsed.data.unresolvedTurns");

    expect(source).not.toContain("resolvePublicLivingIntent(prompt");
    expect(source).toContain("import type {");
    expect(source).toContain("PublicLivingResolution");

    expect(source).toContain("I can't reach Klinikos right now");
    expect(source).not.toContain("Public routing preview");
    expect(source).not.toContain("Deterministic public route");
    expect(source).not.toContain("Assumption:");
    expect(source).not.toContain("reference-state-rail");
    expect(source).not.toContain("reference-action-rail");
    expect(source).not.toContain("reference-card-row");
  });

  it("shows page-only interface progress and prevents duplicate concurrent sends", () => {
    expect(source).toContain("pendingPrompt");
    expect(source).toContain("isSubmitting");
    expect(source).toContain("Working on your question…");
    expect(source).toContain("activeRequest.current?.abort()");
    expect(source).toContain("disabled={isSubmitting || !intent.trim()}");
    expect(source).not.toContain("setTimeout");
    expect(source).toContain('const PUBLIC_INTERFACE_STEPS = ["Listening", "Understanding", "Connecting", "Preparing", "Ready"] as const');
    expect(source).toContain("interfaceProgressIndex");
    expect(source).toContain("data-interface-state={state}");
    expect(source).toContain("This rail reflects this page only");
    expect(source).toContain("It never claims care, work, payment, eligibility, or authority is complete.");
  });

  it("keeps Zumi embedded in the composer while making the send action explicit", () => {
    expect(source).toContain("function ZumiSendGlyph");
    expect(source).toContain("data-zumi-send-glyph");
    expect(source).toContain("<ZumiSendGlyph active={isSubmitting} />");
    expect(source).toContain("styles.zumiPresence");
    expect(source).toContain('<ArrowRight aria-hidden="true" className="size-5" />');
    expect(source).not.toContain('<ZumiOrb state="observing" size={44} />');
    expect(source).not.toContain("ArrowUp");
  });

  it("provides explicit composer labels, plain-language disclosure, live status, and keyboard submit", () => {
    expect(source).toContain('htmlFor="public-klinikos-intent"');
    expect(source).toContain('aria-describedby="public-conversation-disclosure"');
    expect(source).toContain('id="public-conversation-disclosure"');
    expect(source).toContain("cannot open private clinic records or make changes");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="status"');
    expect(source).toContain("onKeyDown={handleComposerKeyDown}");
    expect(source).toContain("event.currentTarget.form?.requestSubmit()");
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
  });

  it("keeps public and patient destinations out of clinic-staff authentication while preserving safe structured protected intent", () => {
    expect(source).toContain('if (destination.href === "/portal") return "/portal/login"');
    expect(source).toContain("isPublicDirectDestination(destination.href)");
    expect(isPublicDirectDestination("/grid")).toBe(true);
    expect(isPublicDirectDestination("/edu")).toBe(true);
    expect(isPublicDirectDestination("/dashboard")).toBe(false);
    expect(source).toContain("protectedPublicContinuationHref(destination.href, destination.key)");
    expect(source).toContain("destinationActionHref(resolution.destination)");
    expect(source).not.toContain("/login?next=");
    expect(continuation).toContain('destination.searchParams.set("from", "public-zumi")');
    expect(continuation).toContain('destination.searchParams.set("intent", intentKey)');
    expect(continuation).not.toContain("rawPrompt");
  });

  it("provides equivalent mobile navigation rather than hiding the only primary nav", () => {
    expect(source).toContain("<details");
    expect(source).toContain('aria-label="Open navigation menu"');
    expect(source).toContain('aria-label="Mobile navigation"');

    // The law is equivalence, not a particular set of links. Naming Trust and Pricing
    // pinned the old module nav, which the action-first contract deliberately removed.
    // Asserting that the mobile menu renders the same governed navigation the desktop nav does
    // proves the same thing and survives the nav changing again.
    const desktopNav = source.match(/aria-label="Primary"[\s\S]{0,400}?PUBLIC_PRIMARY_NAVIGATION\.map/);
    const mobileNav = source.match(/aria-label="Mobile navigation"[\s\S]{0,400}?PUBLIC_PRIMARY_NAVIGATION\.map/);
    expect(desktopNav, "desktop nav does not render governed navigation").not.toBeNull();
    expect(mobileNav, "mobile menu does not render the same governed navigation").not.toBeNull();
    expect(PUBLIC_PRIMARY_NAVIGATION.length).toBeGreaterThan(0);

    // Entry paths a small screen must not lose.
    expect(source).toContain('href="/portal/login"');
    expect(source).toContain('href="/signup"');
  });

  it("ships the exact approved production artwork instead of broken substitutes", () => {
    expect(sha256("public/klinikos-orbital-k-production.png")).toBe("16d58ca917d56b2a26549896193320c8c4b4cc803dadde3c30a95d5fa49f01ba");
    expect(sha256("public/klinikos-wordmark-production.png")).toBe("dc584c56dd8ea9e420a505c00c78f4d3651405b023c539c4f469c2fe411a0c2d");
    expect(sha256("public/klinikos-wordmark-transparent.png")).toBe("63137443081f957c49b2cc9afe010c5f391b17f1b4f82a1802432514431a12f3");
    expect(sha256("public/klinikos-rose-hero-production.png")).toBe("f50f9b4cecfb67fba159b29a1375b6e9372497036585b5ab473430effb3ff8be");
    expect(sha256("public/klinikos-rose-wide-production.png")).toBe("90482a6b122605d972ba46877dc3ce8fa537b3994190ba160f30220324687a93");
    expect(brand).toContain('const MARK_SRC = "/klinikos-orbital-k-production.png"');
    expect(brand).toContain('const WORDMARK_SRC = "/klinikos-wordmark-transparent.png"');
    expect(brand).toContain('data-klinikos-approved-wordmark="true"');
    expect(brand).toContain("width={1937}");
    expect(brand).toContain("height={230}");
    expect(brand).not.toContain("mix-blend-screen");
    expect(homeStyles).toContain("url('/klinikos-rose-hero-production.png')");
    expect(homeStyles).toContain("url('/klinikos-rose-wide-production.png')");
    expect(homeStyles).not.toContain("transparent.webp");
  });

  it("keeps the global appearance control off the focused root experience", () => {
    expect(appearancePolicyForPath("/")).toMatchObject({ controllerVisible: false, referenceLocked: true });
    expect(appearancePolicyForPath("/grid/browse")).toMatchObject({ controllerVisible: true, referenceLocked: false });
    expect(atmosphere).toContain("appearancePolicyForPath(pathname)");
    expect(atmosphere).toContain("usePathname()");
  });
});
