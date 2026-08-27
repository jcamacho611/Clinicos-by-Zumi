import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const client = readFileSync("src/app/signup/FreeSignupClient.tsx", "utf8");
const memberPage = readFileSync("src/app/member/page.tsx", "utf8");

describe("member onboarding browser disclosure boundary", () => {
  it("keeps the signup client free of secrets, ORM access and server authority internals", () => {
    for (const forbidden of [
      "process.env",
      "@/lib/db",
      "@prisma/client",
      "AUTH_SECRET",
      "documentSha256",
      "accountId",
      "personId",
      "legacyUserId",
      "organizationId",
      "public_mutation_rate_limits",
    ]) {
      expect(client).not.toContain(forbidden);
    }
  });

  it("does not project hidden authority state into the member surface", () => {
    for (const forbidden of [
      "passwordHash",
      "documentSha256",
      "legacyLinks",
      "failedAttempts",
      "lockedUntil",
      "organizationMembership",
      "providerProfile",
    ]) {
      expect(memberPage).not.toContain(forbidden);
    }
    expect(memberPage).toContain("requireAccountSession");
  });
});
