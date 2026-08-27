import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("member signup distributed abuse gate", () => {
  it("uses a durable server-owned admission gate instead of the process-memory limiter", () => {
    expect(existsSync("src/lib/auth/member-signup-attestation.ts")).toBe(true);
    if (!existsSync("src/lib/auth/member-signup-attestation.ts")) return;
    const source = read("src/lib/auth/member-signup-attestation.ts");
    expect(source).toContain('import "server-only"');
    expect(source).toContain("assertMemberSignupAllowed");
    expect(source).toContain('public_mutation_rate_limits');
    expect(source).toContain("ON CONFLICT");
    expect(source).not.toContain("new Map");
    expect(source).not.toContain("checkOnboardingRateLimit");
  });

  it("stores only keyed hashes for signup rate-limit identities", () => {
    const source = read("src/lib/auth/member-signup-attestation.ts");
    expect(source).toContain("createHmac");
    expect(source).toContain("keyHash");
    expect(source).not.toMatch(/INSERT[\s\S]*ipAddress/i);
    expect(source).not.toMatch(/INSERT[\s\S]*emailAddress/i);
  });

  it("fails closed when durable admission evidence cannot be recorded", () => {
    const source = read("src/lib/auth/member-signup-attestation.ts");
    expect(source).toContain("MemberSignupAdmissionError");
    expect(source).toMatch(/temporarily unavailable|cannot verify signup safety/i);
  });

  it("ships a migration for the durable rate-limit table", () => {
    const path = "prisma/migrations/20260827110000_public_mutation_rate_limits/migration.sql";
    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;
    const sql = read(path);
    expect(sql).toContain('CREATE TABLE "public_mutation_rate_limits"');
    expect(sql).toContain('"keyHash"');
    expect(sql).toContain('"attemptCount"');
    expect(sql).toContain('"windowStart"');
    expect(sql).not.toContain('"ipAddress"');
    expect(sql).not.toContain('"email"');
  });
});
