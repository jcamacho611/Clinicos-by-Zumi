import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  const absolute = join(process.cwd(), relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

const accessPage = read("src/app/access/page.tsx");
const airlockPolicy = read("src/lib/legal/agreement-airlock.ts");
const airlockRoute = read("src/app/api/access/airlock/route.ts");
const loginPage = read("src/app/login/page.tsx");
const loginRoute = read("src/app/api/auth/login/route.ts");
const identityPage = read("src/app/identity/create/page.tsx");
const identityRoute = read("src/app/api/identity/create/route.ts");
const publicGateway = read("src/components/marketing/public-living-gateway.tsx");
const publicContinuation = read("src/lib/distribution/public-continuation.ts");
const personalHome = read("src/app/home/page.tsx");

describe("Agreement Airlock entry order", () => {
  it("makes the public access surface the Agreement Airlock before authentication", () => {
    expect(accessPage).toContain("Agreement Airlock");
    expect(accessPage).toContain("Sign in");
    expect(accessPage).toContain("Create identity");
    expect(accessPage).not.toContain("Verify a work email");
    expect(accessPage).not.toContain("Private product access");
    expect(accessPage).not.toContain("/api/access/request-verification");
  });

  it("captures the universal legal disclosures without a role or module chooser", () => {
    for (const key of [
      "terms",
      "privacy",
      "acceptable_conduct",
      "confidentiality",
      "intellectual_property",
      "electronic_signature",
      "platform_disclosures",
    ]) {
      expect(airlockPolicy).toContain(`key: "${key}"`);
    }

    expect(airlockPolicy).toContain("does not create clinical authority");
    expect(airlockPolicy).toContain("professional credentials");
    expect(airlockPolicy).toContain("organization ownership");
    expect(airlockPolicy).toContain("Grid eligibility");
    expect(airlockPolicy).toContain("financial authority");
    expect(airlockPolicy).toContain("payment truth");
    expect(airlockPolicy).toContain("patient access");
    expect(accessPage.toLowerCase()).not.toContain("role picker");
    expect(accessPage.toLowerCase()).not.toContain("which klinikos module");
  });

  it("issues tamper-evident pre-auth acceptance evidence for the exact agreement version and hash", () => {
    expect(airlockPolicy).toContain("agreementSha256");
    expect(airlockPolicy).toContain("acceptedAt");
    expect(airlockPolicy).toContain("documentVersion");
    expect(airlockPolicy).toContain("documentSha256");
    expect(airlockPolicy).toContain("createHmac");
    expect(airlockRoute).toContain("issueAgreementAirlockPass");
    expect(airlockRoute).toContain("isSameOriginMutation");
    expect(airlockRoute).toContain("Cache-Control");
  });

  it("requires an Airlock pass at sign-in and binds it to authenticated identity before redirect", () => {
    expect(loginPage).toContain("requireAgreementAirlockPass");
    expect(loginPage).toContain("/access");
    expect(loginRoute).toContain("readAgreementAirlockPass");
    expect(loginRoute).toContain("bindAirlockAcceptanceToSession");

    const bind = loginRoute.indexOf("bindAirlockAcceptanceToSession");
    const response = loginRoute.indexOf("NextResponse.json", bind);
    expect(bind).toBeGreaterThan(-1);
    expect(response).toBeGreaterThan(bind);
  });

  it("routes every public protected-entry call through the Airlock instead of directly to clinic login", () => {
    expect(publicGateway).toContain('href="/access"');
    expect(publicGateway).not.toContain('href="/login"');
    expect(publicContinuation).toContain('return `/access?returnTo=${encodeURIComponent(returnTo)}`');
    expect(publicContinuation).not.toContain('return `/login?returnTo=${encodeURIComponent(returnTo)}`');
  });
});

describe("minimal universal identity after the Airlock", () => {
  it("offers name and email authentication without manufacturing organization or professional authority", () => {
    expect(identityPage).toContain("Name");
    expect(identityPage).toContain("Email");
    expect(identityPage).toContain("Continue securely");
    expect(identityPage).not.toContain("role");
    expect(identityPage).not.toContain("module");

    expect(identityRoute).toContain("createOrReuseUniversalPerson");
    expect(identityRoute).toContain("sendUniversalIdentityVerification");
    expect(identityRoute).not.toContain("roleKey");
    expect(identityRoute).not.toContain("organizationId");
    expect(identityRoute).not.toContain("OrganizationMembership");
    expect(identityRoute).not.toContain("entitlement");
  });

  it("preserves the same browser Zumi conversation into the personal experience without putting raw prompts in the URL", () => {
    expect(publicGateway).toContain('PUBLIC_THREAD_KEY = "klinikos.public.zumi.thread"');
    expect(publicGateway).toContain("window.sessionStorage.setItem(PUBLIC_THREAD_KEY");
    expect(publicGateway).toContain("window.sessionStorage.getItem(PUBLIC_THREAD_KEY");
    expect(personalHome).toContain("PublicLivingGateway");
    expect(personalHome).toContain("personalExperience");
    expect(publicGateway).not.toContain("encodeURIComponent(turn.prompt)");
  });
});
