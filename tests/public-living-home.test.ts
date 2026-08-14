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
    const progressPosition = source.indexOf("{progressSteps.map");
    const responsePosition = source.indexOf("{turn.resolution.title}");
    const actionPosition = source.indexOf("{turn.resolution.destination.action}");

    expect(requestPosition).toBeGreaterThan(0);
    expect(progressPosition).toBeGreaterThan(requestPosition);
    expect(responsePosition).toBeGreaterThan(progressPosition);
    expect(actionPosition).toBeGreaterThan(responsePosition);
    expect(source).toContain("Understanding");
    expect(source).toContain("Preparing the next move");
    expect(source).toContain("Ready");
  });

  it("supports keyboard submission, accessible status, and reduced motion", () => {
    expect(source).toContain("onKeyDown={handleComposerKeyDown}");
    expect(source).toContain("event.currentTarget.form?.requestSubmit()");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="status"');
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
  });

  it("keeps the full-screen workspace responsive without hiding the composer", () => {
    expect(source).toContain("h-[100svh]");
    expect(source).toContain("sm:grid-cols-3");
    expect(source).toContain("lg:grid-cols-[12rem_minmax(0,1fr)]");
    expect(source).toContain('id="public-klinikos-intent"');
    expect(source).toContain('placeholder={conversationStarted ? "Continue the thread..."');
  });

  it("removes the global appearance control from the focused Living Home", () => {
    expect(atmosphere).toContain('if (pathname === "/") return null');
    expect(atmosphere).toContain("usePathname()");
  });
});
