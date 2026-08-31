import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public Grid resource detail", () => {
  it("requires the same active, approved, public gates as Grid discovery", () => {
    const repository = read("src/lib/grid/public-resource-detail.ts");

    expect(repository).toContain("findPublicGridResource");
    expect(repository).toContain('"status" = \'active\'');
    expect(repository).toContain('"reviewStatus" = \'approved\'');
    expect(repository).toContain('"visibility" = \'public\'');
    expect(repository).toContain("publicGridCoordinate");
  });

  it("reduces unstructured policy metadata to minimum-necessary requirement indicators", () => {
    const repository = read("src/lib/grid/public-resource-detail.ts");

    expect(repository).toContain("credentialRequirementsApply");
    expect(repository).toContain("insuranceRequirementsApply");
    expect(repository).toContain("operatorRequirementsApply");
    expect(repository).toContain("usageRestrictionsApply");
    expect(repository).not.toContain("reviewedBy:");
    expect(repository).not.toContain("createdBy:");
  });

  it("adds a public detail route that never exposes review internals or owner identifiers", () => {
    const page = read("src/app/grid/resource/[resourceId]/page.tsx");

    expect(page).toContain("findPublicGridResource");
    expect(page).toContain("notFound()");
    expect(page).toContain("Reviewed Grid resource");
    expect(page).toContain("Request this resource");
    expect(page).toContain("Listing does not equal authorization");
    expect(page).not.toContain("reviewedBy");
    expect(page).not.toContain("organizationId");
    expect(page).not.toContain("createdBy");
  });

  it("keeps the consequential request behind authenticated governed routing", () => {
    const page = read("src/app/grid/resource/[resourceId]/page.tsx");

    expect(page).toContain("/login?returnTo=");
    expect(page).toContain("/grid/resources/request/");
    expect(page).toContain("from=resource-detail");
  });

  it("moves browse conversion through the public detail surface instead of forcing login before comprehension", () => {
    const browser = read("src/components/grid/universal-resource-browser.tsx");

    expect(browser).toContain("View details");
    expect(browser).toContain("/grid/resource/");
    expect(browser).not.toContain("from=discovery");
  });

  it("supports resource-specific metadata without inventing ratings, verification claims, or availability guarantees", () => {
    const page = read("src/app/grid/resource/[resourceId]/page.tsx");

    expect(page).toContain("generateMetadata");
    expect(page).toContain("resource.title");
    expect(page).not.toMatch(/five.star|5-star|rating|guaranteed available|verified provider/i);
  });
});
