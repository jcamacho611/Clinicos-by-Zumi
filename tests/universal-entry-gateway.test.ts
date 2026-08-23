import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("universal entry gateway", () => {
  it("keeps the public homepage public while routing interactive entry through /access", () => {
    const landing = read("src/app/page.tsx");
    const gateway = read("src/components/marketing/public-living-gateway.tsx");

    expect(landing).toContain("PublicLivingGateway");
    expect(gateway).toContain("entryHref");
    expect(gateway).toContain("/access");
    expect(gateway).toContain("ENTER KLINIKOS");
  });

  it("keeps patient portal access outside the proprietary professional entry airlock", () => {
    const gateway = read("src/components/marketing/public-living-gateway.tsx");

    expect(gateway).toContain('href="/portal/login"');
    expect(gateway).not.toContain("/access?returnTo=%2Fportal%2Flogin");
  });

  it("requires server-owned entry evidence before staff/professional login when enforcement is enabled", () => {
    const page = read("src/app/login/page.tsx");

    expect(page).toContain("requireEntryAccessForLogin");
    expect(page).toContain("/access");
  });

  it("binds entry acceptance only after successful credential authentication", () => {
    const route = read("src/app/api/auth/login/route.ts");
    const authenticateIndex = route.indexOf("authenticateCredentials");
    const bindIndex = route.indexOf("bindEntryAcceptanceToIdentity");

    expect(authenticateIndex).toBeGreaterThan(-1);
    expect(bindIndex).toBeGreaterThan(authenticateIndex);
  });

  it("requires same-origin login mutation before legal evidence can bind", () => {
    const route = read("src/app/api/auth/login/route.ts");
    const originCheckIndex = route.indexOf("isSameOriginMutation");
    const authenticateIndex = route.indexOf("authenticateCredentials(parsed.data.email");

    expect(originCheckIndex).toBeGreaterThan(-1);
    expect(originCheckIndex).toBeLessThan(authenticateIndex);
  });

  it("has an anonymous review endpoint instead of reusing authenticated legal review authority", () => {
    expect(existsSync("src/app/api/access/review/route.ts")).toBe(true);
    if (!existsSync("src/app/api/access/review/route.ts")) return;

    const route = read("src/app/api/access/review/route.ts");
    expect(route).toContain("verifyEntryToken");
    expect(route).not.toContain("getAuthenticationSession");
  });
});
