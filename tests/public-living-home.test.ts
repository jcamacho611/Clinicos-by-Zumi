import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

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
  ])("infers %s into a real product destination", (prompt, key, href) => {
    const resolution = resolvePublicLivingIntent(prompt);
    expect(resolution.destination).toMatchObject({ key, href });
    expect(resolution.body.length).toBeGreaterThan(30);
  });

  it("keeps an unknown request useful without forcing a category", () => {
    const resolution = resolvePublicLivingIntent("Help me make this better");
    expect(resolution.destination).toBeNull();
    expect(resolution.title).toBe("I’m keeping this as the working goal.");
    expect(resolution.body).toContain("instead of forcing it into the wrong product category");
  });

  it("preserves a known destination when a short follow-up adds context", () => {
    const initial = resolvePublicLivingIntent("I need a treatment room");
    const followUp = resolvePublicLivingIntent("Saturday", initial);

    expect(followUp.destination).toMatchObject({ key: "grid", href: "/grid" });
    expect(followUp.title).toContain("Grid thread");
    expect(followUp.assumption).toContain("refines the previous Grid request");
  });

  it("lets a clear new intent override the prior conversation destination", () => {
    const initial = resolvePublicLivingIntent("I need a treatment room");
    const changedGoal = resolvePublicLivingIntent("Actually I need injector training", initial);

    expect(changedGoal.destination).toMatchObject({ key: "edu", href: "/edu" });
  });
});

describe("public Living Home truth and accessibility contract", () => {
  const source = read("src/components/marketing/public-living-gateway.tsx");
  const page = read("src/app/page.tsx");
  const atmosphere = read("src/components/design/klinikos-atmosphere.tsx");
  const brand = read("src/components/brand/klinikos-brand.tsx");
  const homeStyles = read("src/app/cinematic-home-overrides.css");

  it("uses one continuous outcome-first routing surface", () => {
    expect(source).toContain("turns.map((turn)");
    expect(source).toContain("priorResolution");
    expect(source).toContain("What needs");
    expect(source).toContain("to happen?");
    expect(source).toContain("Healthcare operating ecosystem");
    expect(page).toContain("PublicConversionBridge");
    expect(page).toContain("PublicTrustFooter");
  });

  it("labels the public experience as deterministic routing rather than model reasoning", () => {
    expect(source).toContain("Public routing preview");
    expect(source).toContain("This public preview uses deterministic routing rules in your browser.");
    expect(source).toContain("It is not a model conversation");
    expect(source).toContain("No records opened · no action executed");
    expect(source).toContain("Deterministic public route");
    expect(source).not.toContain("Your AI Operating Partner");
    expect(source).not.toContain("schedule(");
    expect(source).not.toContain("setTimeout");
    expect(source).not.toContain("Listening");
    expect(source).not.toContain("Connecting");
    expect(source).not.toContain("Preparing");
  });

  it("keeps real inference before rendering without manufactured progress delays", () => {
    const inferencePosition = source.indexOf("const resolution = resolvePublicLivingIntent");
    const appendPosition = source.indexOf("setTurns((current)", inferencePosition);
    expect(inferencePosition).toBeGreaterThan(0);
    expect(appendPosition).toBeGreaterThan(inferencePosition);
  });

  it("provides an explicit composer label, disclosure, live status, and keyboard submit", () => {
    expect(source).toContain('htmlFor="public-klinikos-intent"');
    expect(source).toContain('aria-describedby="public-routing-disclosure"');
    expect(source).toContain('id="public-routing-disclosure"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="status"');
    expect(source).toContain("onKeyDown={handleComposerKeyDown}");
    expect(source).toContain("event.currentTarget.form?.requestSubmit()");
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
  });

  it("keeps public and patient destinations out of clinic-staff authentication", () => {
    expect(source).toContain('if (href === "/portal") return "/portal/login"');
    expect(source).toContain('"/grid", "/edu"');
    expect(source).toContain("publicActionPaths.has(href)");
    expect(source).toContain("return protectedHref(href)");
    expect(source).toContain("destinationActionHref(action.href)");
  });

  it("provides equivalent mobile navigation rather than hiding the only primary nav", () => {
    expect(source).toContain("<details");
    expect(source).toContain('aria-label="Open navigation menu"');
    expect(source).toContain('aria-label="Mobile navigation"');
    expect(source).toContain('{ label: "Trust", href: "/trust" }');
    expect(source).toContain('{ label: "Pricing", href: "/pricing" }');
  });

  it("surfaces buyer proof and legal/trust entry instead of hiding readiness boundaries", () => {
    expect(source).toContain("Proof before promises.");
    expect(source).toContain('href="/trust"');
    expect(page).toContain("PublicTrustFooter");
  });

  it("ships the exact approved production artwork instead of broken substitutes", () => {
    expect(sha256("public/klinikos-orbital-k-production.png")).toBe("16d58ca917d56b2a26549896193320c8c4b4cc803dadde3c30a95d5fa49f01ba");
    expect(sha256("public/klinikos-wordmark-production.png")).toBe("dc584c56dd8ea9e420a505c00c78f4d3651405b023c539c4f469c2fe411a0c2d");
    expect(sha256("public/klinikos-rose-hero-production.png")).toBe("f50f9b4cecfb67fba159b29a1375b6e9372497036585b5ab473430effb3ff8be");
    expect(sha256("public/klinikos-rose-wide-production.png")).toBe("90482a6b122605d972ba46877dc3ce8fa537b3994190ba160f30220324687a93");
    expect(brand).toContain('const MARK_SRC = "/klinikos-orbital-k-production.png"');
    expect(brand).toContain('const WORDMARK_SRC = "/klinikos-wordmark-production.png"');
    expect(homeStyles).toContain("url('/klinikos-rose-hero-production.png')");
    expect(homeStyles).toContain("url('/klinikos-rose-wide-production.png')");
    expect(homeStyles).not.toContain("transparent.webp");
  });

  it("keeps the global appearance control off the focused root experience", () => {
    expect(atmosphere).toContain('if (pathname === "/") return null');
    expect(atmosphere).toContain("usePathname()");
  });
});
