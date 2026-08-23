import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("entry agreement evidence", () => {
  it("uses a new immutable clickwrap agreement version", () => {
    expect(existsSync("src/lib/legal/entry-agreement.ts")).toBe(true);
    if (!existsSync("src/lib/legal/entry-agreement.ts")) return;

    const source = read("src/lib/legal/entry-agreement.ts");
    expect(source).toContain('ENTRY_TERMS_VERSION = "2026.08.23.1"');
    expect(source).toContain("clicking Agree & Enter Klinikos");
    expect(source).not.toContain('GLOBAL_TERMS_VERSION = "2026.08.18.1"');
  });

  it("keeps anonymous entry evidence unbound until authentication", () => {
    expect(existsSync("src/lib/legal/entry-access.ts")).toBe(true);
    if (!existsSync("src/lib/legal/entry-access.ts")) return;

    const source = read("src/lib/legal/entry-access.ts");
    expect(source).toContain('"userId"');
    expect(source).toContain('"organizationId"');
    expect(source).toMatch(/NULL[\s\S]*NULL/);
    expect(source).toContain("bindEntryAcceptanceToIdentity");
  });

  it("requires reviewed exact-version evidence before anonymous acceptance", () => {
    const route = read("src/app/api/access/accept/route.ts");

    expect(route).toContain("verifyEntryToken");
    expect(route).toContain('"reviewed"');
    expect(route).toContain("documentSha256");
    expect(route).toContain("createAnonymousEntryAcceptance");
  });

  it("never treats browser storage as legal authority", () => {
    const access = read("src/app/access/page.tsx");

    expect(access).not.toContain("localStorage.setItem");
    expect(access).not.toContain("sessionStorage.setItem");
  });

  it("uses an HttpOnly cookie only after persisted anonymous acceptance", () => {
    const route = read("src/app/api/access/accept/route.ts");
    const persistIndex = route.indexOf("createAnonymousEntryAcceptance");
    const cookieIndex = route.indexOf("cookies.set");

    expect(persistIndex).toBeGreaterThan(-1);
    expect(cookieIndex).toBeGreaterThan(persistIndex);
    expect(route).toContain("httpOnly: true");
  });
});
