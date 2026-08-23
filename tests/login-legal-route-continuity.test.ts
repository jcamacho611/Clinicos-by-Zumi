import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const loginRoute = readFileSync(join(process.cwd(), "src/app/api/auth/login/route.ts"), "utf8");

describe("login legal-route continuity", () => {
  it("keeps the universal entry ceremony and identity binding authoritative when enabled", () => {
    expect(loginRoute).toContain("isEntryGateEnforcementEnabled");
    expect(loginRoute).toContain("readAcceptedEntryProof");
    expect(loginRoute).toContain("bindEntryAcceptanceToIdentity");
    expect(loginRoute).toContain("revokeClinicSession(session)");
  });

  it("preserves the existing authenticated global-Terms gate when universal entry is disabled", () => {
    expect(loginRoute).toContain("if (!entryGateEnabled)");
    expect(loginRoute).toContain("resolvePostLoginRedirect");
    expect(loginRoute).toContain("isLegalGateEnforcementEnabled");
    expect(loginRoute).toContain("getLegalConfigurationStatus");
    expect(loginRoute).toContain("hasCurrentAgreementAcceptance");
    expect(loginRoute).toContain("buildGlobalAgreement");
    expect(loginRoute).toContain("const { session, token } = await createClinicSession");
  });

  it("fails closed when legacy agreement evidence cannot be verified", () => {
    expect(loginRoute).toContain("agreementAccepted = false");
    expect(loginRoute).toContain("legalConfigurationReady: legalStatus?.ready ?? true");
    expect(loginRoute).not.toContain("redirectTo: safeReturnTo(parsed.data.returnTo)");
  });
});
