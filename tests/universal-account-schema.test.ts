import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("universal account schema", () => {
  it("adds canonical account models without putting organization authority on Account", () => {
    expect(existsSync("prisma/models/universal-account.prisma")).toBe(true);
    if (!existsSync("prisma/models/universal-account.prisma")) return;
    const schema = read("prisma/models/universal-account.prisma");
    expect(schema).toContain("model Account {");
    expect(schema).toContain("model AccountCredential {");
    expect(schema).toContain("model AccountSession {");
    expect(schema).toContain("model LegacyUserAccountLink {");
    const accountBlock = schema.split("model Account {")[1]?.split("}\n\nmodel")[0] ?? "";
    expect(accountBlock).toContain("personId");
    expect(accountBlock).toContain("primaryEmail");
    expect(accountBlock).not.toContain("organizationId");
  });

  it("uses additive migration and preserves legacy authentication rows", () => {
    const path = "prisma/migrations/20260823190000_universal_account_foundation/migration.sql";
    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;
    const sql = read(path).toLowerCase();
    expect(sql).toContain("create table");
    expect(sql).toContain("accounts");
    expect(sql).toContain("account_credentials");
    expect(sql).toContain("account_sessions");
    expect(sql).toContain("legacy_user_account_links");
    expect(sql).toContain("auth_credentials");
    expect(sql).not.toContain("drop table \"auth_credentials\"");
    expect(sql).not.toContain("drop table \"auth_sessions\"");
    expect(sql).not.toContain("delete from \"users\"");
    expect(sql).toContain("access_gate_acceptances");
    expect(sql).toContain("accountid");
    expect(sql).toContain("personid");
  });
});
