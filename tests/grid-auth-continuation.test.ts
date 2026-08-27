import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const listingPage = read("src/app/grid/browse/[listingId]/page.tsx");
const needPage = read("src/app/(platform)/grid/needs/new/page.tsx");

describe("Grid public-to-authenticated continuation", () => {
  it("sends an unauthenticated provider request directly to the authenticated need composer", () => {
    expect(listingPage).toContain("/grid/needs/new?kind=provider&listingId=");
    expect(listingPage).toContain("/login?returnTo=");
    expect(listingPage).not.toContain("`/login?returnTo=${encodeURIComponent(`/grid/browse/${listing.id}`)}`");
  });

  it("re-resolves listing context server-side after login instead of trusting a serialized listing from the URL", () => {
    expect(needPage).toContain("listingId?: string");
    expect(needPage).toContain("getMarketplaceListing");
    expect(needPage).toContain("listingId");
    expect(needPage).not.toContain("JSON.parse(searchParams");
    expect(needPage).not.toContain("listingPayload");
  });
});
