import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atmosphereForAppearance, appearancePolicyForPath } from "@/lib/design/atmosphere";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

const shell = read("src/components/marketing/public-experience-shell.tsx");
const header = read("src/components/marketing/public-header.tsx");
const footer = read("src/components/marketing/public-trust-footer.tsx");
const dock = read("src/components/marketing/public-utility-dock.tsx");
const appearance = read("src/components/design/klinikos-atmosphere.tsx");
const zumi = read("src/components/marketing/public-zumi-site-control.tsx");
const layout = read("src/app/layout.tsx");

describe("one public Klinikos shell", () => {
  it.each([
    "src/app/about/page.tsx",
    "src/app/how-it-works/page.tsx",
    "src/app/grid/browse/page.tsx",
  ])("makes the shared shell the only route-chrome owner for %s", (relative) => {
    const page = read(relative);
    expect(page).toContain("<PublicExperienceShell");
    expect(page).not.toMatch(/<header\b/);
    expect(page).not.toMatch(/<footer\b/);
  });

  it("composes the canonical header, route content, and trust footer without another runtime", () => {
    expect(shell).toContain("<PublicHeader");
    expect(shell).toContain("<PublicTrustFooter");
    expect(shell).toContain("{children}");
    expect(shell).not.toMatch(/ThemeProvider|createRoot|hydrateRoot/);
  });

  it("uses the approved wordmark and one canonical desktop/mobile navigation model", () => {
    expect(header).toContain("<KlinikosWordmark");
    expect(header).not.toContain("<BrandMark");
    expect(header).toContain('aria-label="Primary Klinikos navigation"');
    expect(header).toContain('aria-label="Open Klinikos navigation"');
    expect(header).toContain('aria-label="Mobile Klinikos navigation"');
    for (const destination of ["/how-it-works", "/grid", "/grid/browse?intent=provider", "/edu", "/founding-clinic"]) {
      expect(header).toContain(`href: "${destination}"`);
    }
  });

  it("keeps the shared footer readable in both Marble and Obsidian through semantic tokens", () => {
    expect(footer).toContain("<KlinikosWordmark");
    expect(footer).toContain("var(--k-public-bg)");
    expect(footer).toContain("var(--k-text)");
    expect(footer).not.toMatch(/bg-\[#050303\]|text-\[#f8efed\]/);
    expect(footer).toContain('data-public-utility-clearance="true"');
    expect(footer).toContain("pb-24");
  });
});

describe("coordinated public utilities", () => {
  it("mounts one dock instead of two independent fixed controls", () => {
    expect(layout).toContain('import { PublicUtilityDock } from "@/components/marketing/public-utility-dock"');
    expect(layout).toContain("<PublicUtilityDock />");
    expect(layout).not.toContain("<PublicZumiSiteControl />");
    expect(layout).not.toContain("<KlinikosAtmosphereController />");
    expect(dock).toContain('useState<"zumi" | "appearance" | null>');
    expect(dock).toContain('data-public-utility-dock="true"');
    expect(dock).toContain('open={activePanel === "zumi"}');
    expect(dock).toContain('open={activePanel === "appearance"}');
    expect(zumi).not.toContain("fixed bottom-4 right-4");
  });

  it("uses a real modal primitive for Appearance with bounded scrolling and explicit initial focus", () => {
    expect(appearance).toContain('from "@radix-ui/react-dialog"');
    expect(appearance).toContain("<Dialog.Root");
    expect(appearance).toContain("<Dialog.Portal>");
    expect(appearance).toContain("<Dialog.Overlay");
    expect(appearance).toContain("<Dialog.Content");
    expect(appearance).toContain("onOpenAutoFocus");
    expect(appearance).toContain("closeButtonRef.current?.focus()");
    expect(appearance).toContain("max-h-[min(680px,calc(100dvh-6rem))]");
    expect(appearance).toContain("overflow-y-auto");
    expect(appearance).not.toContain('role="dialog" aria-modal="true"');
  });
});

describe("honest appearance policy", () => {
  it("reference-locks only the public Living Home and honors user appearance elsewhere", () => {
    expect(appearancePolicyForPath("/")).toEqual({
      controllerVisible: false,
      referenceLocked: true,
      resolvedBy: "reference",
    });
    for (const pathname of ["/about", "/how-it-works", "/grid/browse"]) {
      expect(appearancePolicyForPath(pathname)).toEqual({
        controllerVisible: true,
        referenceLocked: false,
        resolvedBy: "user-preference",
      });
      expect(atmosphereForAppearance("dark", false, false)).toBe("night");
      expect(atmosphereForAppearance("light", true, false)).toBe("day");
    }
  });
});
