/**
 * MVP Journey 1b — paid clinic activation and resumable onboarding.
 *
 * Runs through the real server repositories against PostgreSQL:
 *   server-owned plan checkout -> manual payment evidence -> paid subscription ->
 *   signed activation -> resumable non-secret onboarding -> owner workspace.
 */
import { PrismaClient } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { createClinicPlanCheckout, reconcileClinicPlanCheckout, getClinicActivationPreview, completeClinicActivation } from "@/lib/commercial/clinic-provisioning";
import { getClinicActivationDraft, saveClinicActivationDraft } from "@/lib/commercial/clinic-activation-draft";
import { getClinicLaunchBriefing } from "@/lib/commercial/clinic-launch-briefing";

process.env.KLINIKOS_GODADDY_CORE_PAYLINK ||= "https://pay.godaddy.com/securepaylink/mvp-core-test";
process.env.NEXT_PUBLIC_APP_URL ||= "http://localhost:3000";
process.env.AUTH_SECRET ||= "mvp-activation-journey-secret-at-least-32-characters";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];
const run = Date.now().toString(36);
const clinicName = `MVP Activation Clinic ${run}`;
const ownerEmail = `owner-${run}@mvp-activation.test`;
const platformSlug = `mvp-activation-platform-${run}`;

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

async function main() {
  const platform = await db.organization.create({
    data: { name: "MVP Activation Operator", slug: platformSlug, clinicType: "platform", status: "active", demoMode: false },
  });
  const operator = await db.user.create({
    data: { organizationId: platform.id, email: `operator-${run}@mvp-activation.test`, name: "MVP Operator", roleKey: "clinic_owner" },
  });
  const session: ClinicSession = {
    sessionId: `mvp-${run}`,
    userId: operator.id,
    organizationId: platform.id,
    organizationName: platform.name,
    organizationSlug: platform.slug,
    email: operator.email,
    name: operator.name,
    role: "clinic_owner",
    demo: false,
    expiresAt: Date.now() + 60_000,
  };

  let intentId = "";
  let clinicOrganizationId = "";

  try {
    const checkout = await createClinicPlanCheckout(session, { clinicName, email: ownerEmail, productKey: "clinic_core" });
    intentId = checkout.id;
    const intentBeforePayment = await db.$queryRaw<Array<{ organizationId: string | null; productKey: string; amountCents: number | null; status: string }>>`
      SELECT "organizationId", "productKey", "amountCents", "status"
      FROM "commercial_checkout_intents"
      WHERE "id" = ${checkout.id}
    `;
    check(
      "checkout exists before a clinic workspace and uses the server-owned Core amount",
      intentBeforePayment[0]?.organizationId === null && intentBeforePayment[0]?.productKey === "clinic_core" && intentBeforePayment[0]?.amountCents === 99500,
      `organization=${intentBeforePayment[0]?.organizationId ?? "none"} product=${intentBeforePayment[0]?.productKey} amount=${intentBeforePayment[0]?.amountCents}`,
    );

    const reconciled = await reconcileClinicPlanCheckout(session, checkout.id);
    clinicOrganizationId = reconciled.organizationId;
    // Payment confirmation/provider/evidence are commercial extension columns added by
    // the commercial migration and intentionally read through the commercial SQL path,
    // the same path used by the production activation guard.
    const subscriptions = await db.$queryRaw<Array<{ planKey: string; status: string; paymentConfirmedAt: Date | null; paymentProvider: string | null; paymentEvidenceId: string | null }>>`
      SELECT "planKey", "status", "paymentConfirmedAt", "paymentProvider", "paymentEvidenceId"
      FROM "subscriptions"
      WHERE "organizationId" = ${clinicOrganizationId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const subscription = subscriptions[0];
    check(
      "manual reconciliation activates paid access but remains processor-unverified evidence",
      Boolean(subscription?.paymentConfirmedAt) && subscription?.status === "active" && subscription?.planKey === "clinic_core" && subscription?.paymentProvider === "godaddy" && Boolean(subscription?.paymentEvidenceId),
      `subscription=${subscription?.planKey} status=${subscription?.status} paymentConfirmed=${Boolean(subscription?.paymentConfirmedAt)} provider=${subscription?.paymentProvider} evidence=${Boolean(subscription?.paymentEvidenceId)}`,
    );

    const preActivationLaunch = await getClinicLaunchBriefing(clinicOrganizationId);
    check(
      "paid subscription alone cannot claim the owner workspace finished activation",
      preActivationLaunch.paidAccess === true && preActivationLaunch.verifiedFirstLogin === false,
      `paidAccess=${preActivationLaunch.paidAccess} verifiedFirstLogin=${preActivationLaunch.verifiedFirstLogin}`,
    );

    const token = new URL(reconciled.activationUrl).searchParams.get("token") ?? "";
    const preview = await getClinicActivationPreview(token);
    check(
      "the signed activation binds organization, buyer email, and paid plan",
      preview.organizationName === clinicName && preview.email === ownerEmail && preview.productKey === "clinic_core" && preview.alreadyActivated === false,
      `${preview.organizationName} · ${preview.email} · ${preview.productKey}`,
    );

    await saveClinicActivationDraft(token, {
      ownerName: "Jordan Ellis",
      clinicType: "Primary care",
      locationName: "Main clinic",
      city: "Brooklyn",
      state: "NY",
      timezone: "America/New_York",
      teamSize: "6-15",
      primaryGoal: "Control follow-up and appointment readiness",
      currentSystems: "Existing EHR and phone vendor",
      migrationExpectation: "needs_review",
      communicationsState: "existing_vendor",
    });
    const resumed = await getClinicActivationDraft(token);
    const intentAfterDraft = await db.$queryRaw<Array<{ metadata: unknown }>>`
      SELECT "metadata" FROM "commercial_checkout_intents" WHERE "id" = ${checkout.id}
    `;
    const metadataText = JSON.stringify(intentAfterDraft[0]?.metadata ?? {});
    check(
      "non-secret onboarding progress survives a reload and stores no password",
      resumed?.city === "Brooklyn" && resumed?.teamSize === "6-15" && !metadataText.toLowerCase().includes("password"),
      `resumedCity=${resumed?.city} resumedTeam=${resumed?.teamSize} passwordStored=${metadataText.toLowerCase().includes("password")}`,
    );

    const workspace = await completeClinicActivation({
      token,
      ownerName: "Jordan Ellis",
      password: "Strong-Clinic-2026",
      clinicType: "Primary care",
      locationName: "Main clinic",
      city: "Brooklyn",
      state: "NY",
      timezone: "America/New_York",
      teamSize: "6-15",
      primaryGoal: "Control follow-up and appointment readiness",
      currentSystems: "Existing EHR and phone vendor",
      migrationExpectation: "needs_review",
      communicationsState: "existing_vendor",
      acceptTerms: true,
      syntheticDataOnly: true,
    }, { ipAddress: "127.0.0.1", userAgent: "mvp-activation-journey" });
    const [owner, organization, onboardingSetting, launchBriefing] = await Promise.all([
      db.user.findUnique({ where: { email: ownerEmail }, select: { organizationId: true, roleKey: true, authCredential: { select: { id: true } } } }),
      db.organization.findUnique({ where: { id: clinicOrganizationId }, select: { demoMode: true, clinicType: true } }),
      db.setting.findFirst({ where: { organizationId: clinicOrganizationId, key: "onboarding.profile" }, select: { value: true } }),
      getClinicLaunchBriefing(clinicOrganizationId),
    ]);
    check(
      "activation creates one owner account in the paid organization with persisted setup",
      workspace.identity.organizationId === clinicOrganizationId && owner?.organizationId === clinicOrganizationId && owner?.roleKey === "clinic_owner" && Boolean(owner.authCredential) && organization?.demoMode === false && Boolean(onboardingSetting),
      `ownerOrgMatches=${owner?.organizationId === clinicOrganizationId} role=${owner?.roleKey} credential=${Boolean(owner?.authCredential)} demoMode=${organization?.demoMode}`,
    );
    check(
      "completed paid activation yields a verified first-login briefing without inventing production PHI approval",
      launchBriefing.verifiedFirstLogin === true
        && launchBriefing.paidAccess === true
        && launchBriefing.planKey === "clinic_core"
        && launchBriefing.primaryGoal === "Control follow-up and appointment readiness"
        && launchBriefing.productionPatientDataEnabled === false
        && launchBriefing.pendingConnections > 0,
      `verified=${launchBriefing.verifiedFirstLogin} plan=${launchBriefing.planKey} goal=${launchBriefing.primaryGoal} phi=${launchBriefing.productionPatientDataEnabled} pendingConnections=${launchBriefing.pendingConnections}`,
    );

    let replayRefused = false;
    try {
      await completeClinicActivation({
        token,
        ownerName: "Jordan Ellis",
        password: "Strong-Clinic-2026",
        clinicType: "Primary care",
        locationName: "Main clinic",
        city: "Brooklyn",
        state: "NY",
        timezone: "America/New_York",
        teamSize: "6-15",
        primaryGoal: "Control follow-up",
        currentSystems: "Existing EHR",
        migrationExpectation: "needs_review",
        communicationsState: "existing_vendor",
        acceptTerms: true,
        syntheticDataOnly: true,
      }, {});
    } catch {
      replayRefused = true;
    }
    check("the same activation cannot create a second owner workspace", replayRefused, `replayRefused=${replayRefused}`);

    const audits = await db.auditLog.count({ where: { organizationId: clinicOrganizationId, action: { in: ["commercial.manual_payment_reconciled", "organization.paid_activation_completed"] } } });
    check("paid activation leaves commercial and workspace audit evidence", audits >= 2, `${audits} activation audit records`);
  } finally {
    if (intentId) await db.$executeRaw`DELETE FROM "commercial_checkout_intents" WHERE "id" = ${intentId}`.catch(() => undefined);
    if (clinicOrganizationId) await db.organization.delete({ where: { id: clinicOrganizationId } }).catch(() => undefined);
    await db.organization.delete({ where: { id: platform.id } }).catch(() => undefined);
    await db.$disconnect();
  }

  const passed = results.filter((result) => result.pass).length;
  console.log(`\n${passed}/${results.length} paid activation journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
