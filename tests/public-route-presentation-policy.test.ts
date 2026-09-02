import { describe, expect, it } from "vitest";
import * as registry from "@/lib/screen-experience-route-registry";
import { classifySurface } from "@/lib/design/design-architecture";
import { isMarketplaceSurface } from "@/lib/design/marketplace-system";

type Presentation = {
  projection: string;
  chromeMode: string;
  zumiMode: string;
  appearanceMode: string;
};

type PresentationRegistry = typeof registry & {
  PUBLIC_ROUTE_PRESENTATION_POLICIES?: readonly Presentation[];
  resolvePublicRoutePresentation?: (pathname: string) => Presentation | null;
  publicSitemapEntries?: readonly Array<{
    path: string;
    changeFrequency: string;
    priority: number;
  }>;
  PUBLIC_PRIMARY_NAVIGATION?: readonly Array<{ label: string; href: string }>;
  isPublicDirectDestination?: (href: string) => boolean;
};

const presentationRegistry = registry as PresentationRegistry;

function resolve(pathname: string) {
  return presentationRegistry.resolvePublicRoutePresentation?.(pathname) ?? null;
}

describe("public route presentation policy", () => {
  it("makes the reference Living Home the sole embedded-command surface", () => {
    expect(resolve("/")).toMatchObject({
      projection: "living-home",
      chromeMode: "reference",
      zumiMode: "embedded-command",
      appearanceMode: "reference-obsidian",
    });

    for (const pathname of ["/about", "/grid", "/grid/browse", "/edu"]) {
      expect(resolve(pathname)?.zumiMode, pathname).not.toBe("embedded-command");
    }
    expect(presentationRegistry.PUBLIC_ROUTE_PRESENTATION_POLICIES
      ?.filter((policy) => policy.zumiMode === "embedded-command"))
      .toHaveLength(1);
  });

  it("keeps route-owned intelligence pages out of the global floating Zumi", () => {
    for (const pathname of ["/sales", "/start", "/founding-clinic"]) {
      expect(resolve(pathname), pathname).toMatchObject({ zumiMode: "route-owned" });
    }

    expect(resolve("/operational-audit")?.zumiMode).toBe("floating-public");
  });

  it("keeps one floating public Zumi across the complete public Grid family", () => {
    for (const pathname of [
      "/grid",
      "/grid/pricing",
      "/grid/browse",
      "/grid/browse/listing_123",
      "/grid/resource/resource_123",
      "/grid/resources/browse",
      "/grid/join",
      "/grid/join/location",
      "/grid/join/seller",
    ]) {
      expect(resolve(pathname), pathname).toMatchObject({ zumiMode: "floating-public" });
    }

    expect(resolve("/grid/requests")).toBeNull();
    expect(resolve("/grid/transactions")).toBeNull();
  });

  it("normalizes safe query strings and trailing slashes without admitting external destinations", () => {
    expect(resolve("/grid/browse/?intent=provider#results")).toMatchObject({
      projection: "grid-discovery",
      zumiMode: "floating-public",
    });
    expect(presentationRegistry.isPublicDirectDestination?.("/grid/browse?intent=provider")).toBe(true);
    expect(presentationRegistry.isPublicDirectDestination?.("/login")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("/grid/requests")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("/grid/browse/../../dashboard")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("/grid/browse/%2e%2e/%2e%2e/dashboard")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("/grid/browse/../../about")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("/grid/browse/%2e%2e/%2e%2e/about")).toBe(false);
    expect(resolve("/grid/browse/../../about")).toBeNull();
    expect(resolve("/grid/browse/%2e%2e/%2e%2e/about")).toBeNull();
    expect(presentationRegistry.isPublicDirectDestination?.("/\\\\example.com/grid")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("//example.com/grid")).toBe(false);
    expect(presentationRegistry.isPublicDirectDestination?.("https://example.com/grid")).toBe(false);
  });

  it("declares current shared-shell and fixed-theme boundaries truthfully", () => {
    expect(resolve("/about")).toMatchObject({ chromeMode: "shared-public", appearanceMode: "adaptive" });
    expect(resolve("/how-it-works")).toMatchObject({ chromeMode: "shared-public", appearanceMode: "adaptive" });
    expect(resolve("/grid/browse")).toMatchObject({ chromeMode: "shared-public", appearanceMode: "adaptive" });

    expect(resolve("/grid")).toMatchObject({ chromeMode: "route-owned", appearanceMode: "fixed-obsidian" });
    expect(resolve("/grid/pricing")).toMatchObject({ chromeMode: "route-owned", appearanceMode: "fixed-marble" });
    expect(resolve("/grid/join/location")).toMatchObject({ chromeMode: "route-owned", appearanceMode: "fixed-marble" });
  });

  it("drives design and marketplace classification without a second route list", () => {
    expect(classifySurface("/sales")).toBe("marketing");
    expect(classifySurface("/grid/browse/listing_123")).toBe("marketplace");
    expect(classifySurface("/grid/resource/resource_123")).toBe("marketplace");
    expect(isMarketplaceSurface("/grid/resources/browse")).toBe(true);

    for (const pathname of ["/access", "/legal/accept", "/grid/requests", "/edu/dashboard"]) {
      expect(classifySurface(pathname), pathname).toBe("product");
      expect(isMarketplaceSurface(pathname), pathname).toBe(false);
    }
  });

  it("keeps access and agreement acceptance inside the authentication presentation boundary", () => {
    expect(resolve("/access")).toMatchObject({
      projection: "auth-entry",
      zumiMode: "none",
      directContinuation: true,
    });
    expect(resolve("/legal/accept")).toMatchObject({
      projection: "auth-entry",
      zumiMode: "none",
      directContinuation: false,
    });
  });

  it("derives public navigation and sitemap entries from the same policy", () => {
    expect(presentationRegistry.PUBLIC_PRIMARY_NAVIGATION).toEqual([
      { label: "How Klinikos helps", href: "/how-it-works" },
      { label: "Explore Grid", href: "/grid" },
      { label: "Find care", href: "/grid/browse?intent=provider" },
      { label: "Learn", href: "/edu" },
      { label: "For clinics", href: "/founding-clinic" },
    ]);

    const sitemapPaths = presentationRegistry.publicSitemapEntries?.map((entry) => entry.path);
    expect(sitemapPaths).toEqual([
      "/",
      "/about",
      "/how-it-works",
      "/capabilities",
      "/ecosystem",
      "/pricing",
      "/trust",
      "/founding-clinic",
      "/operational-audit",
      "/sales",
      "/start",
      "/grid",
      "/grid/browse",
      "/grid/pricing",
      "/edu",
    ]);

    for (const path of sitemapPaths ?? []) expect(resolve(path), path).not.toBeNull();
    expect(sitemapPaths).not.toContain("/login");
    expect(sitemapPaths).not.toContain("/member");
    expect(sitemapPaths).not.toContain("/grid/requests");
  });
});
