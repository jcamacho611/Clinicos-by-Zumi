import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();

vi.mock("@/lib/db", () => ({ db: { $queryRaw: (...args: unknown[]) => queryRaw(...args) } }));

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
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
