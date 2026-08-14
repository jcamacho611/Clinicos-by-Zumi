import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public Living Home intent", () => {
  it.each([
    ["I need a nurse Saturday", "staffing", "/grid"],
    ["I want training to become an injector", "edu", "/edu"],
    ["Book an appointment for me", "patient", "/portal"],
    ["Our referrals and follow-up are getting lost", "referrals", "/start"],
    ["Help me run my clinic", "clinic", "/start"],
    ["I need a treatment room Saturday", "grid", "/grid"],
  ])("infers %s without inventing authenticated Path IDs", (prompt, key, href) => {
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

  it("uses one continuous conversation surface rather than a split catalog", () => {
    expect(source).not.toContain("doorwayActions");
    expect(source).not.toContain("Ways to enter Klinikos");
    expect(source).not.toContain("One more detail will help");
    expect(source).toContain("Living thread");
    expect(source).toContain("Continue the thread...");
    expect(page).not.toContain("KlinikosHomepage");
  });

  it("renders the request, truthful progress, response, and relevant action in order", () => {
    const requestPosition = source.indexOf("{turn.prompt}");
    const progressPosition = source.indexOf("{progressSteps.map", requestPosition);
    const responsePosition = source.indexOf("{turn.resolution.title}", progressPosition);
    const actionPosition = source.indexOf("{turn.resolution.destination.action}", responsePosition);

    expect(requestPosition).toBeGreaterThan(0);
    expect(progressPosition).toBeGreaterThan(requestPosition);
    expect(responsePosition).toBeGreaterThan(progressPosition);
    expect(actionPosition).toBeGreaterThan(responsePosition);
    expect(source).toContain("Listening");
    expect(source).toContain("Understanding");
    expect(source).toContain("Preparing");
    expect(source).toContain("Ready");
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

  it("passes the prior resolved intent into conversational follow-ups", () => {
    expect(source).toContain("const priorResolution = [...turns].reverse().find");
    expect(source).toContain("const resolution = resolvePublicLivingIntent(prompt, priorResolution)");
  });

  it("performs inference before scheduling the progress reveal", () => {
    const inferencePosition = source.indexOf("const resolution = resolvePublicLivingIntent");
    const schedulePosition = source.indexOf("schedule(timing.preparing");

    expect(inferencePosition).toBeGreaterThan(0);
    expect(inferencePosition).toBeLessThan(schedulePosition);
    expect(source).toContain("response: 520");
  });

  it("keeps the cinematic workspace responsive without hiding either composer", () => {
    expect(source).toContain("min-h-screen");
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("lg:grid-cols-[180px_minmax(0,1fr)_180px]");
    expect(source).toContain('id="public-klinikos-intent"');
    expect(source).toContain('placeholder="Ask Klinikos anything..."');
    expect(source).toContain('placeholder="Continue the thread..."');
  });

  it("keeps the approved rose navigation and operational surfaces wired to real routes", () => {
    expect(source).toContain('/login?next=/dashboard');
    expect(source).toContain('/login?next=/grid');
    expect(source).toContain('/login?next=/patients');
    expect(source).toContain('href: "/edu"');
    expect(source).toContain("Today's Priorities");
    expect(source).toContain("Revenue Opportunities");
    expect(source).toContain("Team Workflow");
    expect(source).toContain("Grid Network");
  });

  it("removes the global appearance control from the focused Living Home", () => {
    expect(atmosphere).toContain('if (pathname === "/") return null');
    expect(atmosphere).toContain("usePathname()");
  });
});
