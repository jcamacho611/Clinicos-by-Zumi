import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { safeMemberReturnTo, safePersonReturnTo } from "@/lib/auth/return-to";
import { klinikosPathCatalog } from "@/lib/paths/catalog";

describe("Person Path auth continuity", () => {
  const pathId = klinikosPathCatalog[0]!.id;

  it("preserves one known Path through the person-owned return boundary", () => {
    const target = `/member?path=${encodeURIComponent(pathId)}`;
    expect(safeMemberReturnTo(target)).toBe(target);
    expect(safePersonReturnTo(target)).toBe(target);
  });

  it("rejects unknown, ambiguous, and external return targets", () => {
    expect(safePersonReturnTo("/member?path=not-real")).toBeNull();
    expect(safePersonReturnTo(`/member?path=${pathId}&path=${pathId}`)).toBeNull();
    expect(safePersonReturnTo("//evil.example/member")).toBeNull();
    expect(safePersonReturnTo("https://evil.example/member")).toBeNull();
  });

  it("keeps clinic and Person routing separate and signup authority-neutral", () => {
    const signup = readFileSync("src/app/api/account/signup/route.ts", "utf8");
    const login = readFileSync("src/app/login/page.tsx", "utf8");

    expect(login).toContain("safeClinicReturnTo");
    expect(login).toContain("safePersonReturnTo");

    for (const forbiddenCreation of [
      "organization.create",
      "membership.create",
      "provider.create",
      "patient.create",
    ]) {
      expect(signup).not.toContain(forbiddenCreation);
    }
  });
});
