import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
});
