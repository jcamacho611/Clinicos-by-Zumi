import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_LIVING_ACTIONS } from "@/lib/marketing/public-living-actions";
import { projectPublicLivingUniverseForActionId } from "@/lib/orchestration/public-living-universe";

const intentionallyUnmapped = new Set(["learn"]);

describe("public value before signup", () => {
  it("projects truthful Path value before asking for an account", () => {
    for (const action of PUBLIC_LIVING_ACTIONS) {
      const result = projectPublicLivingUniverseForActionId(action.id);
      if (intentionallyUnmapped.has(action.id)) {
        expect(result).toBeNull();
        continue;
      }

      expect(result, action.id).not.toBeNull();
      expect(result!.title.length).toBeGreaterThan(0);
      expect(result!.summary.length).toBeGreaterThan(0);
      expect(result!.governance.length).toBeGreaterThan(0);
      expect(result!.continuationHref).toBe(`/member?path=${encodeURIComponent(result!.pathId)}`);
      expect([
        "available_now",
        "requires_setup",
        "requires_verification",
        "requires_organization_connection",
        "defined",
      ]).toContain(result!.availability);
    }
  });

  it("offers semantic free-Person continuation only after the Path projection exists", () => {
    const stage = readFileSync("src/components/marketing/public-living-universe-stage.tsx", "utf8");
    expect(stage).toContain('const signupHref = `/signup?returnTo=${encodeURIComponent(item.continuationHref)}`');
    expect(stage).toContain("Join free and start here");
    expect(stage).toContain("Joining costs nothing and is not a credential.");
  });
});
