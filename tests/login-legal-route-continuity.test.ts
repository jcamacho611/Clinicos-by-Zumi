import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const loginRoute = readFileSync(join(process.cwd(), "src/app/api/auth/login/route.ts"), "utf8");

describe("login → legal gate route continuity", () => {
  it("uses authenticated session and current legal truth to resolve the next route", () => {
    expect(loginRoute).toContain("resolvePostLoginRedirect");
    expect(loginRoute).toContain("isLegalGateEnforcementEnabled");
    expect(loginRoute).toContain("getLegalConfigurationStatus");
    expect(loginRoute).toContain("hasCurrentAgreementAcceptance");
    expect(loginRoute).toContain("buildGlobalAgreement");
    expect(loginRoute).toContain("const { session, token } = await createClinicSession");
  });

  it("fails closed when current agreement evidence cannot be verified", () => {
    expect(loginRoute).toContain("agreementAccepted = false");
    expect(loginRoute).toContain("legalConfigurationReady: legalStatus?.ready ?? true");
    expect(loginRoute).not.toContain("redirectTo: safeReturnTo(parsed.data.returnTo)");
  });
});
