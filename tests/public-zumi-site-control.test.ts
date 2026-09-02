import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as registry from "@/lib/screen-experience-route-registry";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");
const control = read("src/components/marketing/public-zumi-site-control.tsx");
const rootLayout = read("src/app/layout.tsx");
const utilityDock = read("src/components/marketing/public-utility-dock.tsx");
const clinicLayout = read("src/app/(clinic)/layout.tsx");

describe("public Zumi site control", () => {
  it("mounts one bounded public assistant at the root layout but renders only on approved public acquisition pages", () => {
    expect(rootLayout).toContain('import { PublicUtilityDock } from "@/components/marketing/public-utility-dock"');
    expect(rootLayout).toContain("<PublicUtilityDock />");
    expect(utilityDock).toContain("<PublicZumiSiteControl");
    const resolve = (registry as typeof registry & {
      resolvePublicRoutePresentation?: (pathname: string) => { zumiMode: string } | null;
    }).resolvePublicRoutePresentation;
    for (const pathname of ["/pricing", "/trust", "/how-it-works", "/founding-clinic", "/operational-audit", "/grid", "/grid/browse", "/grid/pricing", "/grid/resource/resource_1", "/grid/join/seller", "/edu"]) {
      expect(resolve?.(pathname)?.zumiMode, pathname).toBe("floating-public");
    }
    expect(resolve?.("/")?.zumiMode).toBe("embedded-command");
    expect(resolve?.("/login") ?? null).toBeNull();
    expect(resolve?.("/portal") ?? null).toBeNull();
    expect(resolve?.("/dashboard") ?? null).toBeNull();
    expect(control).not.toContain("const PUBLIC_PATHS");
  });

  it("is a clearly labeled control rather than an unexplained decorative orb", () => {
    expect(control).toContain('aria-label={open ? "Public Zumi assistant is open" : "Open Zumi assistant"}');
    expect(control).toContain('<span>Zumi</span>');
    expect(control).toContain('id="public-zumi-site-panel"');
    expect(control).toContain('aria-controls="public-zumi-site-panel"');
    expect(control).toContain('aria-label="Public Zumi assistant"');
    expect(control).toContain('htmlFor="public-zumi-site-input"');
  });

  it("uses the same bounded public server path with page context and no private authority", () => {
    expect(control).toContain('fetch("/api/zumi/public"');
    expect(control).toContain("surface: pathname");
    expect(control).toContain("sessionId: sessionId()");
    expect(control).toContain(".slice(-12)");
    expect(control).toContain("cannot access private clinic records or execute clinic changes");
    expect(control).toContain("Do not enter patient information here");
  });

  it("keeps suggestions as conversational prompt shortcuts rather than executable model actions", () => {
    expect(control).toContain('aria-label="Suggested replies"');
    expect(control).toContain("send(suggestion.prompt)");
    expect(control).not.toContain("suggestion.href");
    expect(control).not.toContain("suggestion.action");
  });
});

describe("legacy authenticated clinic routes", () => {
  it("inherits the same authenticated AppShell and persistent Zumi instead of remaining an island", () => {
    expect(clinicLayout).toContain('import { AppShell } from "@/components/clinic/app-shell"');
    expect(clinicLayout).toContain('import { requireClinicSession } from "@/lib/auth/session"');
    expect(clinicLayout).toContain("const session = await requireClinicSession()");
    expect(clinicLayout).toContain("<AppShell session={session}>{children}</AppShell>");
  });
});
