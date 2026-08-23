import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("free member account lifecycle evidence", () => {
  it("defines an append-oriented account event without tenant authority", () => {
    const schemaPath = "prisma/models/universal-account.prisma";
    expect(existsSync(schemaPath)).toBe(true);
    if (!existsSync(schemaPath)) return;
    const schema = read(schemaPath);
    expect(schema).toContain("model AccountEvent");
    expect(schema).toContain('@@map("account_events")');
    expect(schema).not.toContain("organizationId String");
  });

  it("records account.created inside the same signup transaction", () => {
    const sourcePath = "src/lib/auth/free-member-signup.ts";
    expect(existsSync(sourcePath)).toBe(true);
    if (!existsSync(sourcePath)) return;
    const source = read(sourcePath);
    expect(source).toContain("accountEvent.create");
    expect(source).toContain('eventType: "account.created"');
    expect(source).not.toContain("auditLog.create");
  });

  it("does not expose destructive cascade from account to lifecycle evidence", () => {
    const schema = read("prisma/models/universal-account.prisma");
    expect(schema).toContain("onDelete: Restrict");
  });
});
