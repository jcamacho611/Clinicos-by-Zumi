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

describe("public Living Home interaction contract", () => {
  const source = read("src/components/marketing/public-living-gateway.tsx");
  const page = read("src/app/page.tsx");
  const atmosphere = read("src/components/design/klinikos-atmosphere.tsx");
  const brand = read("src/components/brand/klinikos-brand.tsx");
  const homeStyles = read("src/app/cinematic-home-overrides.css");

  it("uses one continuous conversation surface rather than a split catalog", () => {
    expect(source).not.toContain("doorwayActions");
    expect(source).not.toContain("Ways to enter Klinikos");
    expect(source).not.toContain("One more detail will help");
    expect(source).toContain("turns.map((turn)");
    expect(source).toContain("priorResolution");
    expect(page).not.toContain("KlinikosHomepage");
  });

  it("renders truthful listening, understanding, connecting, preparing, and ready states", () => {
    const requestPosition = source.indexOf("{turn.prompt}");
    const progressPosition = source.indexOf("{progressSteps.map", requestPosition);
    const responsePosition = source.indexOf("{resolution.title}", progressPosition);
    const actionPosition = source.indexOf("actions.map((action)", responsePosition);

    expect(requestPosition).toBeGreaterThan(0);
    expect(progressPosition).toBeGreaterThan(requestPosition);
    expect(responsePosition).toBeGreaterThan(progressPosition);
    expect(actionPosition).toBeGreaterThan(responsePosition);
    expect(source).toContain("Listening");
    expect(source).toContain("Understanding");
    expect(source).toContain("Connecting");
    expect(source).toContain("Preparing");
    expect(source).toContain("Ready");
    expect(source).toContain('if (resolution.destination)');
  });

  it("supports keyboard submission, accessible status, and reduced motion", () => {
    expect(source).toContain("onKeyDown={handleComposerKeyDown}");
    expect(source).toContain("event.currentTarget.form?.requestSubmit()");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="status"');
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(source.indexOf('role="status"')).toBeLessThan(source.indexOf("<section"));
    expect(source).toContain("readOnly={Boolean(activeTurn)}");
    expect(source).toContain("latestResolution.title");
    expect(source).toContain("latestResolution.destination.action");
  });

  it("passes prior resolved intent into conversational follow-ups", () => {
    expect(source).toContain("const priorResolution = [...turns].reverse().find");
    expect(source).toContain("const resolution = resolvePublicLivingIntent(prompt, priorResolution)");
  });

  it("performs inference before scheduling the progress reveal", () => {
    const inferencePosition = source.indexOf("const resolution = resolvePublicLivingIntent");
    const schedulePosition = source.indexOf("schedule(170");

    expect(inferencePosition).toBeGreaterThan(0);
    expect(inferencePosition).toBeLessThan(schedulePosition);
    expect(source).toContain("stage: \"connecting\"");
    expect(source).toContain("stage: \"preparing\"");
    expect(source).toContain("stage: \"ready\"");
  });

  it("keeps the reference composition responsive and command-first", () => {
    expect(source).toContain("min-h-screen");
    expect(source).toContain("lg:grid-cols-[150px_minmax(0,1fr)_150px]");
    expect(source).toContain('id="public-klinikos-intent"');
    expect(source).toContain('placeholder="Ask Klinikos anything..."');
    expect(source).toContain("What needs");
    expect(source).toContain("to happen?");
    expect(source).toContain("Your AI Operating Partner");
  });

  it("wires the reference navigation and cards to real product surfaces", () => {
    expect(source).toContain('protectedHref("/dashboard")');
    expect(source).toContain('{ label: "Grid", href: "/grid" }');
    expect(source).toContain('protectedHref("/provider")');
    expect(source).toContain('protectedHref("/billing")');
    expect(source).toContain('protectedHref("/quality")');
    expect(source).toContain('protectedHref("/tasks")');
    expect(source).toContain('protectedHref("/crm")');
    expect(source).toContain('href: "/edu"');
    expect(source).toContain("Today's Priorities");
    expect(source).toContain("Revenue Opportunities");
    expect(source).toContain("Team Workflow");
    expect(source).toContain("Grid Network");
    expect(source).toContain("workspaceActions");
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

  it("keeps the approved full-width first-fold composition and state-bearing Zumi presence", () => {
    const centerPosition = source.indexOf('className="reference-center');
    const rightRailPosition = source.indexOf('className="reference-action-rail');
    const bottomPosition = source.indexOf('className="reference-bottom-grid');

    expect(centerPosition).toBeGreaterThan(0);
    expect(rightRailPosition).toBeGreaterThan(centerPosition);
    expect(bottomPosition).toBeGreaterThan(rightRailPosition);
    expect(source).toContain("function LivingZumiOrb");
    expect(source).toContain("data-zumi-state={state}");
    expect(source).toContain('<LivingZumiOrb state="observing" />');
    expect(source).toContain('<ArrowUp className="size-5" />');
    expect(homeStyles).toContain("max-width: 1244px");
    expect(homeStyles).toContain("grid-row: 2");
  });

  it("uses real document and voice destinations instead of dead decorative composer controls", () => {
    expect(source).toContain('protectedHref("/documents")');
    expect(source).toContain('protectedHref("/voice-assistant")');
    expect(source).toContain('aria-label="Open documents"');
    expect(source).toContain('aria-label="Talk to Zumi"');
  });

  it("removes the global appearance control from the focused Living Home", () => {
    expect(atmosphere).toContain('if (pathname === "/") return null');
    expect(atmosphere).toContain("usePathname()");
  });
});
