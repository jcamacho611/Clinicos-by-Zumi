import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Free entry must not promise more than the substrate delivers.
 *
 * The free-entry law is VISITOR → FREE ACCOUNT → ONE PERSON IDENTITY → ...
 *
 * The account work landed the Person/Account/Credential/Session models and the session
 * cookie, but nothing in src/ used them, so the front door had to point at `/grid/join`
 * — a real free entry, but a Grid-specific one that creates a participant rather than
 * the one Klinikos identity.
 *
 * That integration now exists: `/signup` creates Person and Account in one transaction
 * and signs the person in. The front door points there, and the copy still may not
 * describe a free account as verified, eligible or authorized — overclaiming is how
 * "free" quietly becomes "verified" in a reader's head.
 */

const gateway = readFileSync("src/components/marketing/public-living-gateway.tsx", "utf8");
const stage = readFileSync("src/components/marketing/public-living-universe-stage.tsx", "utf8");

describe("public free entry stays truthful about what it creates", () => {
  it("sends free entry to the one Person account, not a Grid-specific funnel", () => {
    // A door that opens onto nothing is worse than no door, so this asserts the route
    // and its handler both exist rather than trusting the href.
    expect(existsSync("src/app/signup/page.tsx"), "/signup page missing").toBe(true);
    expect(existsSync("src/app/api/account/signup/route.ts"), "signup API missing").toBe(true);

    for (const source of [gateway, stage]) {
      expect(source).toContain('href="/signup"');
    }
  });

  it("creates the account through the canonical substrate, not a second identity", () => {
    const repository = readFileSync("src/lib/auth/person-account-repository.ts", "utf8");
    // One transaction: a failure must not leave a Person who cannot sign in, or an
    // Account with no Person behind it.
    expect(repository).toContain("db.$transaction");
    expect(repository).toContain("tx.person.create");
    expect(repository).toContain("tx.account.create");
    // Free entry grants authentication and nothing else.
    for (const forbidden of ["organizationMembership", "providerCredential", "locationAssignment"]) {
      expect(repository, `signup grants ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("does not claim free entry creates a verified or universal identity", () => {
    const overclaims = [
      /one Klinikos identity/i,
      /your (?:verified|universal) (?:identity|profile)/i,
      /\bget verified\b/i,
      /\bverified (?:account|professional) (?:in|within) (?:minutes|seconds)\b/i,
    ];
    for (const source of [gateway, stage]) {
      for (const pattern of overclaims) {
        expect(source, `overclaims free entry: ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("says plainly that joining is not a credential", () => {
    expect(stage).toMatch(/not a credential/i);
  });
});
