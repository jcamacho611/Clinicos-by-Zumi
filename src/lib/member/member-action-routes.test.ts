import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import {
  isAllowedMemberActionHref,
  personEntryHrefForPath,
} from "@/lib/member/member-action-routes";

describe("member Living Home action routes", () => {
  it("accepts only the reviewed person-safe public entry routes", () => {
    expect(isAllowedMemberActionHref("/portal/login?path=patient-find-care")).toBe(true);
    expect(isAllowedMemberActionHref("/grid/browse?path=clinic-monetize-capacity")).toBe(true);
    expect(isAllowedMemberActionHref("/edu?path=student-clinical-placement")).toBe(true);
  });

  it("rejects near-prefix, mutation, external, and malformed routes", () => {
    expect(isAllowedMemberActionHref("/grid-evil/collect")).toBe(false);
    expect(isAllowedMemberActionHref("/education")).toBe(false);
    expect(isAllowedMemberActionHref("/grid/workspace")).toBe(false);
    expect(isAllowedMemberActionHref("/edu/competencies")).toBe(false);
    expect(isAllowedMemberActionHref("/api")).toBe(false);
    expect(isAllowedMemberActionHref("/api/account/signup")).toBe(false);
    expect(isAllowedMemberActionHref("//attacker.example/grid")).toBe(false);
    expect(isAllowedMemberActionHref("/grid\\attacker")).toBe(false);
  });

  it("gives every catalog Path a reviewed person-safe entry instead of a clinic-session deep link", () => {
    for (const path of klinikosPathCatalog) {
      const href = personEntryHrefForPath(path);
      expect(isAllowedMemberActionHref(href), `${path.id} -> ${href}`).toBe(true);
      expect(href, path.id).not.toMatch(/^\/(?:dashboard|provider-network|tasks|quality|billing|referrals)(?:[/?]|$)/);
      expect(href, path.id).not.toMatch(/^\/(?:grid|edu)\/(?:workspace|availability|providers|transactions|competencies|courses|dashboard)(?:[/?]|$)/);
    }
  });
});
