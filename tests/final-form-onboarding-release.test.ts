import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const exists = (path: string) => existsSync(join(root, path));
const read = (path: string) => readFileSync(join(root, path), "utf8");

const authPagePath = "src/app/auth/page.tsx";
const authRouterPath = "src/components/auth/universal-entry-router.tsx";
const startPath = "src/app/start/page.tsx";
const syntheticOnboardingRoute = "src/app/api/onboarding/organizations/route.ts";
const activationPage = "src/app/activate/page.tsx";
const activationRoute = "src/app/api/onboarding/activate/route.ts";
const activationForm = "src/components/commercial/clinic-activation-form.tsx";
const salesRoute = "src/app/api/sales/reservations/route.ts";
const contractsPath = "src/lib/screen-experience-contracts.ts";

describe("final-form onboarding release", () => {
  it("provides the Universal Entry Router as a real public route", () => {
    expect(exists(authPagePath)).toBe(true);
    expect(exists(authRouterPath)).toBe(true);
    const page = read(authPagePath);
    const router = read(authRouterPath);
    expect(page).toContain("UniversalEntryRouter");
    expect(router).toContain('fetch("/api/zumi/public"');
    expect(router).toMatch(/What (?:needs to happen|are you trying to do)/i);
    expect(router).toMatch(/do not enter.*(?:PHI|patient)/i);
  });

  it("keeps the browser router presentation-only and free of proprietary/server authority", () => {
    const router = read(authRouterPath);
    expect(router).not.toMatch(/process\.env|DATABASE_URL|Prisma|@\/lib\/db/);
    expect(router).not.toMatch(/resolvePublicLivingIntent|path-resolution-rules|intent-catalog|company-control|funding|investor.*score/i);
    expect(router).not.toMatch(/passwordHash|paymentConfirmedAt|organizationId\s*:/);
    expect(router).toContain("protectedPublicContinuationHref");
  });

  it("turns the legacy start menu into a compatibility continuation instead of a product picker", () => {
    const source = read(startPath);
    expect(source).toContain('redirect("/auth")');
    expect(source).not.toContain("entryPaths");
    expect(source).not.toContain("Choose your entry");
    expect(source).not.toContain("text-cyan-300");
    expect(source).not.toContain("#e6c55b");
  });

  it("routes clinic-owner onboarding into the existing public commercial intake, not synthetic workspace creation", () => {
    const router = read(authRouterPath);
    expect(router).toContain('"/sales"');
    expect(router).not.toContain("/api/onboarding/organizations");

    const publicSales = read(salesRoute);
    expect(publicSales).toContain("createPublicDemoReservation");
    expect(publicSales).toContain("checkSalesIntakeRateLimit");
    expect(publicSales).toContain('"Cache-Control": "no-store"');
  });

  it("keeps direct workspace creation explicitly synthetic and disabled in production", () => {
    const source = read(syntheticOnboardingRoute);
    expect(source).toContain('process.env.NODE_ENV !== "production"');
    expect(source).toContain('KLINIKOS_SYNTHETIC_WORKSPACE_CREATION === "true"');
    expect(source).toContain("Direct workspace creation is not available");
  });

  it("preserves signed paid activation and does not let the browser assert commercial authority", () => {
    const page = read(activationPage);
    const route = read(activationRoute);
    expect(page).toContain("getClinicActivationPreview(token)");
    expect(page).toMatch(/signed Klinikos activation link/i);
    expect(route).toContain("completeClinicActivation");
    expect(route).not.toMatch(/paymentConfirmedAt\s*=|planKey\s*=|organizationId\s*=\s*parsed\.data/i);
  });

  it("never autosaves the activation password and keeps production PHI gated", () => {
    const form = read(activationForm);
    expect(form).toContain("function draftFromForm");
    const draftBody = form.slice(form.indexOf("function draftFromForm"), form.indexOf("export function ClinicActivationForm"));
    expect(draftBody).not.toContain("password:");
    expect(form).toMatch(/Password is never included in autosaved onboarding progress/i);
    expect(form).toMatch(/will not enter PHI|production patient-data use/i);
  });

  it("covers public acquisition and auth/signup with explicit privacy and authority contracts", () => {
    const contracts = read(contractsPath);
    expect(contracts).toContain('id: "public-discovery"');
    expect(contracts).toContain('id: "auth-signup"');
    expect(contracts).toContain('"phi"');
    expect(contracts).toContain('"passwords"');
    expect(contracts).toContain("authentication-establishes-session-not-professional-or-organization-authority");
    expect(contracts).toMatch(/\/auth\/\*/);
    expect(contracts).toMatch(/\/onboarding\*/);
  });
});
