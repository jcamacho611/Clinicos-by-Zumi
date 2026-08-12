/**
 * Grid acceptance scenarios A–F, run against the real database through the real
 * transactional path. Not the eligibility function in isolation — createGridRequest and
 * transitionGridRequest, the code a route actually calls.
 */
import { PrismaClient } from "@prisma/client";
import { createGridRequest, transitionGridRequest } from "./src/lib/repositories/grid-repository";
import type { ClinicSession } from "./src/lib/auth/types";

const db = new PrismaClient();
const YEAR = 365 * 24 * 3600 * 1000;
const soon = (ms: number) => new Date(Date.now() + ms);

let clinicOrg = "";
let providerOrg = "";
let admin = "";
let nyLocation = "";
let txLocation = "";
let facilityNY = "";

async function seed() {
  for (const slug of ["ga-clinic", "ga-provider"]) {
    const org = await db.organization.findUnique({ where: { slug }, select: { id: true } });
    if (org) await db.organization.delete({ where: { id: org.id } });
  }
  const clinic = await db.organization.create({ data: { name: "GA Clinic", slug: "ga-clinic", clinicType: "medspa", demoMode: true } });
  const provider = await db.organization.create({ data: { name: "GA Provider Co", slug: "ga-provider", clinicType: "medspa", demoMode: true } });
  clinicOrg = clinic.id;
  providerOrg = provider.id;

  const user = await db.user.create({ data: { organizationId: clinic.id, email: "ga-admin@example.test", name: "GA Admin", roleKey: "clinic_owner" } });
  admin = user.id;

  const ny = await db.location.create({ data: { organizationId: provider.id, name: "NY Suite", state: "NY", status: "active", marketplaceVisible: true } });
  const tx = await db.location.create({ data: { organizationId: provider.id, name: "TX Suite", state: "TX", status: "active", marketplaceVisible: true } });
  nyLocation = ny.id;
  txLocation = tx.id;
  const fNY = await db.facility.create({ data: { organizationId: provider.id, locationId: ny.id, name: "NY Facility", type: "clinic", status: "active" } });
  const fTX = await db.facility.create({ data: { organizationId: provider.id, locationId: tx.id, name: "TX Facility", type: "clinic", status: "active" } });
  facilityNY = fNY.id;
  return { fTX: fTX.id };
}

async function makeProvider(opts: {
  credentialState?: string; credentialExpiresIn?: number; providerType?: string;
  verificationStatus?: string; malpracticeExpiresIn?: number; facilityIds?: string[];
}) {
  const p = await db.provider.create({
    data: {
      organizationId: providerOrg,
      name: "GA Nurse", displayName: "GA Nurse", legalName: "GA Nurse RN",
      providerType: opts.providerType ?? "Registered Nurse",
      credential: "RN", engagementType: "independent_contractor",
      status: "active", verificationStatus: opts.verificationStatus ?? "verified",
      malpracticeVerificationStatus: "verified",
      malpracticeExpiration: soon(opts.malpracticeExpiresIn ?? YEAR),
    },
  });
  await db.providerCredential.create({
    data: {
      organizationId: providerOrg, providerId: p.id, type: "RN", number: "RN-1",
      state: opts.credentialState ?? "NY", status: "active", verificationStatus: "verified",
      expiresAt: soon(opts.credentialExpiresIn ?? YEAR),
    },
  });
  for (const facilityId of opts.facilityIds ?? [facilityNY]) {
    await db.providerFacilityPrivilege.create({
      data: { organizationId: providerOrg, providerId: p.id, facilityId, status: "active", expiresAt: soon(YEAR) },
    });
  }
  return p.id;
}

async function makeListing(providerId: string, activityKey: string | null, category = "IV Therapy") {
  const l = await db.gridServiceListing.create({
    data: {
      organizationId: providerOrg, providerId, serviceName: "GA Service", category,
      description: "acceptance", priceLowCents: 10000, priceHighCents: 20000,
      status: "active", requiresConsent: false, requiresDeposit: false,
    },
  });
  await db.gridServiceListing.update({ where: { id: l.id }, data: { activityKey } });
  return l.id;
}

const session = () => ({ userId: admin, organizationId: clinicOrg, role: "clinic_owner" }) as unknown as ClinicSession;

async function offer(input: Record<string, unknown>) {
  return createGridRequest(session(), {
    syntheticClientLabel: "Synthetic Client", syntheticClientReference: `GA-${Math.random().toString(36).slice(2, 8)}`,
    requestedStartAt: soon(7 * 24 * 3600 * 1000).toISOString(),
    locationType: "clinic_location", safetyFlags: [], requiredDocuments: [],
    consentStatus: "not_required", notes: "Acceptance scenario request.", ...input,
  });
}

function outcome(label: string, expectPass: boolean, error: unknown) {
  const passed = expectPass ? !error : Boolean(error);
  const detail = error instanceof Error ? error.message : "allowed";
  console.log(`  ${passed ? "PASS" : "FAIL"} — ${label}\n         ${detail.slice(0, 170)}`);
  return passed;
}

async function main() {
  const { fTX } = await seed();
  const results: boolean[] = [];

  // A — eligible NY RN, NY work, RN activity, payment condition satisfied.
  console.log("\nScenario A — eligible NY RN, NY work");
  const rnA = await makeProvider({});
  const listingA = await makeListing(rnA, "perform_rn_service");
  let requestA = "";
  try {
    const r = await offer({ serviceListingId: listingA, providerId: rnA, locationId: nyLocation });
    requestA = r.id;
    results.push(outcome("offer accepted", true, null));
  } catch (e) { results.push(outcome("offer accepted", true, e)); }

  // B — same RN, Texas work.
  console.log("\nScenario B — same RN, Texas work");
  const listingB = await makeListing(rnA, "perform_rn_service");
  try {
    await offer({ serviceListingId: listingB, providerId: rnA, locationId: txLocation });
    results.push(outcome("wrong jurisdiction refused", false, null));
  } catch (e) { results.push(outcome("wrong jurisdiction refused", false, e)); }

  // C — same RN asked to provide medical direction.
  console.log("\nScenario C — RN asked for medical direction");
  const listingC = await makeListing(rnA, "provide_medical_direction", "Medical Direction");
  try {
    await offer({ serviceListingId: listingC, providerId: rnA, locationId: nyLocation });
    results.push(outcome("scope of practice refused", false, null));
  } catch (e) { results.push(outcome("scope of practice refused", false, e)); }

  // D — credential expires halfway through a multi-day engagement.
  console.log("\nScenario D — credential lapses mid-engagement");
  const rnD = await makeProvider({ credentialExpiresIn: 10 * 24 * 3600 * 1000 });
  const listingD = await makeListing(rnD, "perform_rn_service");
  try {
    await offer({
      serviceListingId: listingD, providerId: rnD, locationId: nyLocation,
      requestedStartAt: soon(5 * 24 * 3600 * 1000).toISOString(),
      requestedEndAt: soon(30 * 24 * 3600 * 1000).toISOString(),
    });
    results.push(outcome("mid-engagement expiry refused", false, null));
  } catch (e) { results.push(outcome("mid-engagement expiry refused", false, e)); }

  // E — eligible, but payment condition unverified at confirmation.
  console.log("\nScenario E — payment condition unverified at confirmation");
  const providerSession = { userId: admin, organizationId: providerOrg, role: "clinic_owner" } as unknown as ClinicSession;
  const steps = ["accepted", "location_review", "credential_check", "confirmed"];
  let confirmError: unknown = null;
  for (const target of steps) {
    try {
      await transitionGridRequest(providerSession, requestA, { targetStatus: target, note: "Acceptance scenario transition." });
    } catch (e) { confirmError = e; break; }
  }
  results.push(outcome("confirmation blocked without payment", false, confirmError));

  // Then record the payment condition and confirm.
  console.log("\nScenario E2 — same booking confirms once payment is recorded");
  let confirmed = false;
  try {
    const r = await transitionGridRequest(providerSession, requestA, {
      targetStatus: "confirmed", note: "Payment condition recorded by administrator.", paymentStatus: "recorded",
    });
    confirmed = r.status === "confirmed";
    results.push(outcome("confirms with payment recorded", true, confirmed ? null : new Error("not confirmed")));
  } catch (e) { results.push(outcome("confirms with payment recorded", true, e)); }

  // F — suspend the provider, then attempt another confirmation.
  console.log("\nScenario F — eligibility re-decided at confirmation");
  const rnF = await makeProvider({});
  const listingF = await makeListing(rnF, "perform_rn_service");
  const reqF = await offer({ serviceListingId: listingF, providerId: rnF, locationId: nyLocation });
  await db.provider.update({ where: { id: rnF }, data: { verificationStatus: "suspended" } });
  let staleError: unknown = null;
  try {
    await transitionGridRequest(providerSession, reqF.id, { targetStatus: "accepted", note: "Attempting after suspension." });
  } catch (e) { staleError = e; }
  results.push(outcome("stale pass does not authorize", false, staleError));

  // G — a listing that never declared its activity.
  console.log("\nScenario G — undeclared activity");
  const rnG = await makeProvider({});
  const listingG = await makeListing(rnG, null, "Consultation");
  try {
    await offer({ serviceListingId: listingG, providerId: rnG, locationId: nyLocation });
    results.push(outcome("undeclared activity refused", false, null));
  } catch (e) { results.push(outcome("undeclared activity refused", false, e)); }

  // H — mobile work with no jurisdiction anywhere.
  console.log("\nScenario H — mobile work, jurisdiction unknown");
  const rnH = await makeProvider({});
  const listingH = await makeListing(rnH, "perform_rn_service");
  try {
    await offer({ serviceListingId: listingH, providerId: rnH, locationId: null, locationType: "mobile" });
    results.push(outcome("unknown jurisdiction fails closed", false, null));
  } catch (e) { results.push(outcome("unknown jurisdiction fails closed", false, e)); }

  console.log(`\n${results.filter(Boolean).length}/${results.length} scenarios passed`);
  console.log("fTX seeded:", Boolean(fTX));
  await db.organization.deleteMany({ where: { slug: { in: ["ga-clinic", "ga-provider"] } } });
  await db.$disconnect();
  process.exit(results.every(Boolean) ? 0 : 1);
}

main();
