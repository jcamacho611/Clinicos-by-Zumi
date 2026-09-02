import { describe, expect, it } from "vitest";
import {
  personAccountSignupSchema,
  PERSON_ACCOUNT_SIGNUP_LAWS,
} from "@/lib/auth/person-account-signup";

/**
 * Free entry creates an authentication identity and nothing else.
 *
 * The canonical substrate already exists: Person is the lifelong identity, Account
 * proves authentication only, AccountCredential holds the hash, AccountSession holds
 * the session. What was missing was the integration — no code in src/ touched any of
 * them, so `/signup` did not exist and the front door had to point at a Grid-specific
 * funnel.
 *
 * This builds that integration on the existing models. It does not introduce another
 * Person, another membership model, or another authority rail, and the account it
 * creates confers no organization, professional, clinical, billing, Grid-eligibility or
 * patient authority whatsoever.
 */

describe("free person-account signup contract", () => {
  it("asks only for what an account actually needs", () => {
    const ok = personAccountSignupSchema.safeParse({
      email: "  Jane@Example.com ",
      displayName: "Jane Camacho",
      password: "a-long-enough-passphrase",
    });
    expect(ok.success).toBe(true);
    // Email is the account key, so it is normalised rather than stored as typed.
    expect(ok.success && ok.data.email).toBe("jane@example.com");
  });

  it("refuses the identifiers free entry must never collect", () => {
    // The Canon forbids collecting a Social Security number as blanket signup
    // information. Anything of that shape must not even be accepted into the payload.
    const withSsn = personAccountSignupSchema.safeParse({
      email: "jane@example.com",
      displayName: "Jane Camacho",
      password: "a-long-enough-passphrase",
      ssn: "123-45-6789",
    });
    expect(withSsn.success && "ssn" in withSsn.data).toBe(false);
  });

  it("requires a password long enough to be worth hashing", () => {
    for (const password of ["short", "1234567"]) {
      expect(personAccountSignupSchema.safeParse({
        email: "jane@example.com",
        displayName: "Jane Camacho",
        password,
      }).success).toBe(false);
    }
  });

  it("states plainly what the new account does not grant", () => {
    // These are shown to the person and asserted here so a future change cannot quietly
    // upgrade what "free" appears to mean.
    const stated = PERSON_ACCOUNT_SIGNUP_LAWS.join(" ");
    for (const word of ["verified", "eligible", "authorized"]) {
      expect(stated, `signup never says what "${word}" does not mean`).toContain(word);
    }
    expect(stated).not.toMatch(/\bgrants\b/i);
  });
});
