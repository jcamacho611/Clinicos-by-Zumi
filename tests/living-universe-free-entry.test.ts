import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { signAccountSessionToken, verifyAccountSessionToken } from "@/lib/auth/account-token";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Living Universe person-first free entry", () => {
  it("adds a Person-owned Account substrate without manufacturing organization authority", () => {
    const accountSchemaPath = "prisma/models/universal-account.prisma";

    expect(existsSync(join(process.cwd(), accountSchemaPath))).toBe(true);

    const accountSchema = read(accountSchemaPath);
    expect(accountSchema).toContain("model Account {");
    expect(accountSchema).toContain("personId");
    expect(accountSchema).toContain("person                  Person");
    expect(accountSchema).toContain("model AccountSession {");
    expect(accountSchema).not.toContain("organizationId");
    expect(accountSchema).not.toContain("clinicRole");
  });

  it("keeps ClinicSession explicitly organization-bound", () => {
    const clinicSession = read("src/lib/auth/types.ts");

    expect(clinicSession).toContain("export interface ClinicSession");
    expect(clinicSession).toContain("organizationId: string");
    expect(clinicSession).toContain("organizationName: string");
    expect(clinicSession).toContain("organizationSlug: string");
    expect(clinicSession).toContain("role: ClinicRole");
  });

  it("requires a separate person session instead of widening ClinicSession with nullable organization state", () => {
    const accountSessionPath = "src/lib/auth/account-session.ts";
    const accountTypesPath = "src/lib/auth/account-types.ts";

    expect(existsSync(join(process.cwd(), accountSessionPath))).toBe(true);
    expect(existsSync(join(process.cwd(), accountTypesPath))).toBe(true);

    const accountTypes = read(accountTypesPath);
    expect(accountTypes).toContain("PersonAccountSession");
    expect(accountTypes).toContain("personId: string");
    expect(accountTypes).toContain("accountId: string");
    expect(accountTypes).not.toContain("organizationId");
    expect(accountTypes).not.toContain("ClinicRole");
  });

  it("uses a distinct signed audience and rejects clinic tokens across the person boundary", async () => {
    const expiresAt = Math.floor(Date.now() / 1_000) + 300;
    const personToken = await signAccountSessionToken({
      sessionId: "person-session",
      accountId: "account-1",
      personId: "person-1",
      email: "person@example.test",
      displayName: "Person Example",
      expiresAt,
    });
    const clinicToken = await signSessionToken({
      sessionId: "clinic-session",
      userId: "user-1",
      organizationId: "org-1",
      organizationName: "Clinic",
      organizationSlug: "clinic",
      email: "staff@example.test",
      name: "Clinic Staff",
      role: "viewer",
      demo: false,
      expiresAt,
    });

    await expect(verifyAccountSessionToken(personToken)).resolves.toMatchObject({
      accountId: "account-1",
      personId: "person-1",
    });
    await expect(verifyAccountSessionToken(clinicToken)).resolves.toBeNull();
    await expect(verifySessionToken(personToken)).resolves.toBeNull();
  });
});
