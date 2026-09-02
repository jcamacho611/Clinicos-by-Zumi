import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const executeRaw = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $executeRaw: (...args: unknown[]) => executeRaw(...args),
  },
}));

import {
  assertMemberSignupAllowed,
  MemberSignupAdmissionError,
} from "@/lib/auth/member-signup-admission";

describe("durable member-signup admission", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgresql://test.invalid/klinikos";
    queryRaw.mockResolvedValue([{ attemptCount: 1 }]);
    executeRaw.mockResolvedValue(0);
  });

  afterEach(() => {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it("consumes durable email and IP buckets without storing either raw value", async () => {
    await expect(assertMemberSignupAllowed({
      email: "Member@Example.Test",
      ipAddress: "203.0.113.10",
    })).resolves.toBeUndefined();

    expect(queryRaw).toHaveBeenCalledTimes(2);
    const serialized = JSON.stringify(queryRaw.mock.calls);
    expect(serialized).not.toContain("member@example.test");
    expect(serialized).not.toContain("203.0.113.10");
    expect(serialized).toContain("member-signup:email");
    expect(serialized).toContain("member-signup:ip");

    expect(executeRaw).toHaveBeenCalledTimes(1);
    const cleanupSql = JSON.stringify(executeRaw.mock.calls);
    expect(cleanupSql).toContain("public_mutation_rate_limits");
    expect(cleanupSql).toContain("LIMIT");
    expect(cleanupSql).toContain("100");
  });

  it("continues admission when bounded expired-bucket cleanup fails", async () => {
    executeRaw.mockRejectedValueOnce(new Error("cleanup unavailable"));

    await expect(assertMemberSignupAllowed({ email: "member@example.test" }))
      .resolves.toBeUndefined();

    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("rejects a bucket beyond its configured limit", async () => {
    queryRaw.mockResolvedValue([{ attemptCount: 4 }]);
    await expect(assertMemberSignupAllowed({ email: "member@example.test" }))
      .rejects.toMatchObject({ status: 429, name: "MemberSignupAdmissionError" });
  });

  it("fails closed when durable storage is unavailable", async () => {
    delete process.env.DATABASE_URL;
    await expect(assertMemberSignupAllowed({ email: "member@example.test" }))
      .rejects.toBeInstanceOf(MemberSignupAdmissionError);
    expect(executeRaw).not.toHaveBeenCalled();
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
