import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const loginRoute = readFileSync("src/app/api/auth/login/route.ts", "utf8");
const loginPage = readFileSync("src/app/login/page.tsx", "utf8");
const signupForm = readFileSync("src/app/signup/signup-form.tsx", "utf8");
const logoutRoute = readFileSync("src/app/api/auth/logout/route.ts", "utf8");
const signupPage = readFileSync("src/app/signup/page.tsx", "utf8");
const signupRoute = readFileSync("src/app/api/account/signup/route.ts", "utf8");
const signupRelease = readFileSync("src/lib/auth/member-signup-release.ts", "utf8");
const memberPage = readFileSync("src/app/member/page.tsx", "utf8");
const accountSession = readFileSync("src/lib/auth/account-session.ts", "utf8");

describe("person-account login continuity", () => {
  it("preserves organization-bound clinic login before person-account fallback", () => {
    const clinicAttempt = loginRoute.indexOf("authenticateCredentials");
    const personAttempt = loginRoute.indexOf("authenticatePersonAccount");
    expect(clinicAttempt).toBeGreaterThan(-1);
    expect(personAttempt).toBeGreaterThan(clinicAttempt);
    expect(loginRoute).toContain("hasClinicIdentity");
  });

  it("issues the person session through its separate signed token rail", () => {
    expect(loginRoute).toContain("signAccountSessionToken");
    expect(loginRoute).not.toContain("person.sessionId, accountSessionCookieOptions()");
  });

  it("does not continue a person principal into an organization-only route", () => {
    expect(loginRoute).toContain("safePersonReturnTo");
  });

  it("clears the other principal cookie whenever login switches identity rails", () => {
    expect(loginRoute).toContain('response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, ""');
    expect(loginRoute).toContain('response.cookies.set(SESSION_COOKIE_NAME, ""');
  });

  it("guards both cookie-setting endpoints against cross-origin mutation and caching", () => {
    for (const source of [loginRoute, signupRoute]) {
      expect(source).toContain("evaluateSameOriginMutation(request)");
      expect(source).toContain('"Cache-Control", "no-store"');
    }
  });

  it("uses the shared trusted-proxy boundary for login client addresses", () => {
    expect(loginRoute).toContain("loginClientIpAddress(request)");
    expect(loginRoute).not.toContain('request.headers.get("x-forwarded-for")');
  });

  it("lands a newly authenticated person in the person-level Living Universe", () => {
    expect(signupForm).toContain('returnTo ?? "/member"');
    expect(signupForm).toContain("encodeURIComponent(returnTo)");
    expect(loginPage).toContain("getPersonAccountSession");
    expect(loginPage).toContain('redirect(safePersonReturnTo(requestedReturnTo) ?? "/member")');
    expect(loginPage).toContain("/signup?returnTo=");
  });

  it("preserves a governed path through a closed signup gate and the existing-member sign-in route", () => {
    const paramsRead = signupPage.indexOf("const params = await searchParams");
    const releaseGate = signupPage.indexOf("!memberSignup.enabled");
    expect(paramsRead).toBeGreaterThan(-1);
    expect(releaseGate).toBeGreaterThan(paramsRead);
    expect(signupPage).toContain("<SignupReleaseGate returnTo={returnTo}");
    expect(signupPage).toContain("encodeURIComponent(returnTo)");
  });

  it("preserves only a catalog-backed member path through anonymous login", () => {
    const paramsRead = memberPage.indexOf("const params = await searchParams");
    const sessionRequired = memberPage.indexOf("requirePersonAccountSession(memberReturnTo)");
    expect(paramsRead).toBeGreaterThan(-1);
    expect(sessionRequired).toBeGreaterThan(paramsRead);
    expect(accountSession).toContain("safeMemberReturnTo");
    expect(accountSession).toContain("encodeURIComponent(returnTo)");
  });

  it("does not create a second free identity while a clinic principal is active", () => {
    expect(signupPage).toContain("getAuthenticationSession");
    expect(signupPage).toContain("safeClinicReturnTo");
  });

  it("keeps public account creation behind an explicit deployment release gate", () => {
    expect(signupPage).toContain("getMemberSignupReleaseState");
    expect(signupRoute).toContain("getMemberSignupReleaseState");
    expect(signupRelease).toContain("VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED = true");
    expect(signupRelease).toContain("productionApproved === true");
    expect(signupPage).toMatch(/production-approved terms, privacy notice, legal configuration, and versioned acceptance evidence/i);
  });

  it("revokes and clears both independent session rails on logout", () => {
    expect(logoutRoute).toContain("evaluateSameOriginMutation(request)");
    expect(logoutRoute).toContain("revokePersonAccountSession");
    expect(logoutRoute).toContain("ACCOUNT_SESSION_COOKIE_NAME");
    expect(logoutRoute).toContain("SESSION_COOKIE_NAME");
  });

  it("does not falsely claim a lost signup response means no account was created", () => {
    expect(signupForm).not.toContain("Your account was not created");
    expect(signupForm).toMatch(/may have received|try signing in/i);
  });
});
