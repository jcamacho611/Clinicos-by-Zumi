import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const claimsRoutePath = "src/app/api/identity/claims/route.ts";
const reviewRoutePath = "src/app/api/identity/claims/[claimId]/review/route.ts";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

describe("relationship claim API contract", () => {
  it("exposes authenticated submit/list and review routes", () => {
    expect(existsSync(claimsRoutePath)).toBe(true);
    expect(existsSync(reviewRoutePath)).toBe(true);

    const claims = source(claimsRoutePath);
    const review = source(reviewRoutePath);
    expect(claims).toContain("getAuthenticationSession");
    expect(claims).toContain("submitRelationshipClaim");
    expect(claims).toContain("listRelationshipClaimsForPerson");
    expect(review).toContain("getAuthenticationSession");
    expect(review).toContain("reviewRelationshipClaim");
  });

  it("fails closed without a validated session and delegates input authority to strict repository boundaries", () => {
    const claims = source(claimsRoutePath);
    const review = source(reviewRoutePath);

    expect(claims).toMatch(/if\s*\(!session\)/);
    expect(claims).toContain("401");
    expect(review).toMatch(/if\s*\(!session\)/);
    expect(review).toContain("401");

    for (const serverOwnedField of [
      "personId:",
      "userId:",
      "reviewedBy:",
      "verificationStatus:",
      "authority:",
    ]) {
      expect(claims).not.toContain(serverOwnedField);
      expect(review).not.toContain(serverOwnedField);
    }
  });

  it("does not serialize protected auth, credential, evidence, or organization payloads", () => {
    const claims = source(claimsRoutePath);
    const review = source(reviewRoutePath);
    const combined = `${claims}\n${review}`;

    for (const forbidden of [
      "passwordHash",
      "sessionId:",
      "licenseNumber",
      "credentialNumber",
      "evidenceBody",
      "organization: {",
      "providerCredential",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });
});
