import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("verified paid first login", () => {
  it("does not let the onboarding query string create setup-complete truth", () => {
    const page = read("src/app/(platform)/dashboard/page.tsx");

    expect(page).toContain("getClinicLaunchBriefing");
    expect(page).toContain("launchRequested && launchBriefing?.verifiedFirstLogin");
    expect(page).toContain("onboardingComplete={verifiedFirstLogin}");
    expect(page).not.toContain('onboardingComplete={query.onboarding === "complete"}');
  });

  it("derives first-login readiness from paid subscription and persisted paid activation state", () => {
    const repository = read("src/lib/commercial/clinic-launch-briefing.ts");

    expect(repository).toContain('FROM "subscriptions"');
    expect(repository).toContain('subscription.status === "active"');
    expect(repository).toContain("subscription.paymentConfirmedAt");
    expect(repository).toContain('onboarding.mode === "paid_activation"');
    expect(repository).toContain('"commercial_access", "organization", "owner", "location", "workspace"');
    expect(repository).toContain("verifiedFirstLogin: paidAccess && paidWorkspaceCompleted");
  });

  it("shows a truthful owner launch briefing and real next destinations", () => {
    const component = read("src/components/commercial/clinic-first-login-launch.tsx");

    expect(component).toContain("Paid access and the owner workspace are verified from server-owned records.");
    expect(component).toContain("The URL did not create this state.");
    expect(component).toContain("Production mode still off");
    expect(component).toContain('href="/front-desk"');
    expect(component).toContain('href="/integrations"');
    expect(component).toContain('href="/settings"');
    expect(component).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
