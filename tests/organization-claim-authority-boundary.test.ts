import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repositoryPath = "src/lib/identity/relationship-claim-repository.ts";
const claimsRoutePath = "src/app/api/identity/claims/route.ts";
const reviewRoutePath = "src/app/api/identity/claims/[claimId]/review/route.ts";

const repository = readFileSync(repositoryPath, "utf8");
const claimsRoute = existsSync(claimsRoutePath) ? readFileSync(claimsRoutePath, "utf8") : "";
const reviewRoute = existsSync(reviewRoutePath) ? readFileSync(reviewRoutePath, "utf8") : "";

describe("organization claim authority boundary", () => {
  it("keeps a relationship claim separate from login, tenant, role, provider, and credential authority", () => {
    expect(repository).toContain("pending_verification");
    expect(repository).toContain("verified_relationship");
    expect(repository).toContain("can(session.role, \"identity\", \"manage\")");

    for (const prohibitedWrite of [
      "user.update(",
      "authSession.update(",
      "authCredential.update(",
      "provider.update(",
    ]) {
      expect(repository).not.toContain(prohibitedWrite);
    }
  });

  it("does not let API routes manufacture claimant or reviewer authority", () => {
    expect(existsSync(claimsRoutePath)).toBe(true);
    expect(existsSync(reviewRoutePath)).toBe(true);
    expect(claimsRoute).not.toContain("organizationId: input");
    expect(claimsRoute).not.toContain("roleKey: input");
    expect(reviewRoute).not.toContain("reviewedBy");
    expect(reviewRoute).not.toContain("verificationStatus");
  });
});
