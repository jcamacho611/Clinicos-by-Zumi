import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_SCREEN_EXPERIENCE_CONTRACTS,
  SCREEN_SOURCE_BINDINGS,
  resolveSourceExperienceContract,
  resolveSourceExperienceContracts,
} from "@/lib/screen-experience-route-registry";

const APP_ROOT = join(process.cwd(), "src", "app");

function walkPages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return walkPages(absolute);
    if (!entry.isFile() || entry.name !== "page.tsx") return [];
    return [relative(process.cwd(), absolute).replaceAll("\\", "/")];
  });
}

describe("screen experience route coverage", () => {
  it("binds every real app page to exactly one screen experience contract", () => {
    const pages = walkPages(APP_ROOT);
    expect(pages.length).toBeGreaterThan(0);

    const uncovered: string[] = [];
    const ambiguous: Array<{ page: string; contracts: string[] }> = [];

    for (const page of pages) {
      const matches = resolveSourceExperienceContracts(page);
      if (matches.length === 0) uncovered.push(page);
      if (matches.length > 1) ambiguous.push({
        page,
        contracts: matches.map((contract) => contract.id),
      });
    }

    expect(uncovered, `Screens without a contract:\n${uncovered.join("\n")}`).toEqual([]);
    expect(
      ambiguous,
      `Screens with competing contracts:\n${ambiguous
        .map(({ page, contracts }) => `${page}: ${contracts.join(", ")}`)
        .join("\n")}`,
    ).toEqual([]);
  });

  it("keeps every source binding attached to a fully declared contract", () => {
    const contractIds = new Set(ALL_SCREEN_EXPERIENCE_CONTRACTS.map((contract) => contract.id));
    expect(SCREEN_SOURCE_BINDINGS.length).toBeGreaterThan(0);

    for (const binding of SCREEN_SOURCE_BINDINGS) {
      expect(binding.sourcePattern.source).not.toBe(".*");
      expect(contractIds.has(binding.contractId)).toBe(true);
    }
  });

  it("classifies free signup and the person-level Living Home by their real authority boundary", () => {
    expect(resolveSourceExperienceContract("src/app/signup/page.tsx").id).toBe("auth-signup");
    expect(resolveSourceExperienceContract("src/app/member/page.tsx").id).toBe("person-home");
  });

  it("keeps AI model training opt-in outside ordinary screen contracts", () => {
    for (const contract of ALL_SCREEN_EXPERIENCE_CONTRACTS) {
      expect(contract.aiProcessing.modelTraining).toBe("not-permitted-by-default");
      expect(contract.zumi.forbidden).toEqual(
        expect.arrayContaining(["grant-authority", "manufacture-verified-facts"]),
      );
    }
  });
});
