import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/login/page.tsx", "utf8");

describe("universal login surface", () => {
  it("recognizes person-level account sessions as well as legacy clinic sessions", () => {
    expect(source).toContain("getAccountSession");
    expect(source).toContain('redirect("/member")');
  });

  it("does not claim every session has organization authority", () => {
    expect(source).not.toContain("Every session remains bound to one authorized organization and role.");
    expect(source).toContain("personal Klinikos account");
  });

  it("surfaces signup only when the deployment flag is enabled", () => {
    expect(source).toContain("KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED");
    expect(source).toContain('href="/signup"');
  });
});
