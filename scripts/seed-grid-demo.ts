/**
 * Populate the Grid transaction chain for the demo organizations.
 *
 * The chain — need → offer → acceptance → reservation → payment evidence →
 * fulfillment → financial obligation — is fully implemented, covered by unit tests, and
 * proven end to end by the Grid MVP journey. But the journey creates its own throwaway
 * organizations and deletes them when it finishes, so no demo organization has ever held
 * a single Grid record. Every Grid surface in this product has only ever been looked at
 * empty: six zeros and four "nothing yet" messages. A surface nobody has seen populated
 * is not a verified surface, and that is what this fixes.
 *
 * Everything goes through the real repositories, never a direct INSERT into the
 * transaction tables. That matters more than it looks: seeding states by hand would let
 * this script paint a Grid the product itself could never produce — an offer accepted by
 * the wrong party, a reservation without acceptance, a fulfilled booking with no payment
 * evidence — and the surface would render it happily. Driving the real state machine
 * means every state shown here is a state a real clinic can actually reach, and the seed
 * fails loudly if the chain regresses.
 *
 * The two resource rows are the exception and are inserted directly, matching the MVP
 * journey: resource review is a human governance action, not something a seed may grant
 * itself through a public API.
 *
 * All data is synthetic and belongs to organizations already marked demoMode. Nothing
 * here is a real provider, a real price, or a real settlement.
 *
 * One finding is worth naming, because it is a commercial blocker rather than a bug.
 * `allocateGridFinancialObligations` refuses to settle a fulfilled transaction unless an
 * active fee policy applies, and the product ships with none — so the Grid can transact
 * all the way through fulfillment and then cannot produce a single financial obligation.
 * The refusal is right: allocating money without a policy would mean inventing a platform
 * fee. But somebody has to decide what Klinikos actually charges, and until they do, the
 * money step is unreachable.
 *
 * This seed therefore writes a fee policy of ZERO — zero basis points, zero flat cents.
 * That is a deliberate choice over a plausible-looking demo rate. A seeded 5% would read,
 * to anyone shown this environment, as "Klinikos takes 5%", which is a price this project
 * has not set and which must not be fabricated. Zero claims nothing. The policy row is a
 * global one (fee scopes are platform-wide, not per-tenant), which is exactly why this
 * script refuses to run against any database containing a non-demo organization.
 */
import { PrismaClient } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { createSavedGridDemand } from "@/lib/grid/demand-repository";
import { createGridOffer, transitionGridOffer } from "@/lib/grid/offer-repository";
import { createReservationFromAcceptedOffer } from "@/lib/grid/reservation-repository";
import { recordManualGridReservationPayment } from "@/lib/grid/reservation-payment-repository";
import { transitionGridFulfillment } from "@/lib/grid/fulfillment-repository";
import { allocateGridFinancialObligations } from "@/lib/grid/financial-obligation-repository";

const db = new PrismaClient();

const BUYER_ORG = "org-bfm";
const SUPPLIER_ORG = "org-luxe";
const DAY = 24 * 3600 * 1000;
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();

/** Prefix every seeded row so a re-run can remove exactly what it made and nothing else. */
const SEED_PREFIX = "seed_grid_demo_";

function session(organizationId: string, userId: string): ClinicSession {
  return { userId, organizationId, role: "clinic_owner" } as unknown as ClinicSession;
}

async function ownerOf(organizationId: string) {
  const user = await db.user.findFirst({ where: { organizationId, roleKey: "clinic_owner" }, select: { id: true } });
  if (!user) throw new Error(`No clinic_owner for ${organizationId}. Run the main seed first.`);
  return user.id;
}

async function reset() {
  // Children before parents: the transaction tables are ordered by dependency, and the
  // demo rows are identified by the seed prefix so a real record is never touched.
  const resourceIds = [`${SEED_PREFIX}resource_provider`, `${SEED_PREFIX}resource_space`];
  await db.$executeRawUnsafe(
    `DELETE FROM "GridFinancialObligationRecord" WHERE "reservationId" IN (
       SELECT r."id" FROM "GridReservationRecord" r JOIN "GridOfferRecord" o ON o."id" = r."offerId"
       WHERE o."resourceReference" = ANY($1))`,
    resourceIds,
  ).catch(() => {});
  await db.$executeRawUnsafe(
    `DELETE FROM "GridFulfillmentEventRecord" WHERE "reservationId" IN (
       SELECT r."id" FROM "GridReservationRecord" r JOIN "GridOfferRecord" o ON o."id" = r."offerId"
       WHERE o."resourceReference" = ANY($1))`,
    resourceIds,
  ).catch(() => {});
  await db.$executeRawUnsafe(
    `DELETE FROM "GridReservationRecord" WHERE "offerId" IN (
       SELECT "id" FROM "GridOfferRecord" WHERE "resourceReference" = ANY($1))`,
    resourceIds,
  ).catch(() => {});
  await db.$executeRawUnsafe(
    `DELETE FROM "GridOfferEventRecord" WHERE "offerId" IN (
       SELECT "id" FROM "GridOfferRecord" WHERE "resourceReference" = ANY($1))`,
    resourceIds,
  ).catch(() => {});
  await db.$executeRawUnsafe(`DELETE FROM "GridOfferRecord" WHERE "resourceReference" = ANY($1)`, resourceIds).catch(() => {});
  await db.$executeRawUnsafe(`DELETE FROM "GridDemandRecord" WHERE "title" LIKE 'Synthetic ·%'`).catch(() => {});
  await db.$executeRawUnsafe(
    `DELETE FROM "GridResourceAvailabilityRecord" WHERE "resourceId" = ANY($1)`, resourceIds).catch(() => {});
  await db.$executeRawUnsafe(`DELETE FROM "GridResourceRecord" WHERE "id" = ANY($1)`, resourceIds).catch(() => {});
  await db.$executeRawUnsafe(`DELETE FROM "GridFeePolicyRecord" WHERE "id" = $1`, `${SEED_PREFIX}fee_policy_zero`).catch(() => {});
}

async function seedResource(id: string, ownerOrg: string, createdBy: string, type: "provider" | "space", title: string, description: string, policyClass: string, visibility: string) {
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord"
       ("id","organizationId","createdBy","resourceType","title","description","policyClass","visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    id, ownerOrg, createdBy, type, title, description, policyClass, visibility,
  );
}

/**
 * Refuse to touch a database that holds any real tenant.
 *
 * This seed writes a platform-wide fee policy, so running it somewhere real would set
 * Klinikos's fee on live transactions. Documenting "demo only" in a comment is not a
 * control; a check that stops the process is. Every organization present must be
 * demoMode, or nothing runs.
 */
async function requireDemoOnlyDatabase() {
  const real = await db.organization.findMany({ where: { demoMode: false }, select: { id: true, name: true }, take: 5 });
  if (real.length) {
    throw new Error(
      `Refusing to seed: this database contains ${real.length} non-demo organization(s) `
      + `(${real.map((organization) => organization.id).join(", ")}). `
      + `This seed writes a platform-wide Grid fee policy and must never run against real tenants.`,
    );
  }
}

async function seedZeroFeePolicy(createdBy: string) {
  await db.$executeRawUnsafe(
    `INSERT INTO "GridFeePolicyRecord" ("id","scopeKind","scopeValue","platformFeeBps","platformFeeFlatCents","status","createdBy","updatedAt")
     VALUES ($1,'default',NULL,0,0,'active',$2,CURRENT_TIMESTAMP)
     ON CONFLICT ("id") DO NOTHING`,
    `${SEED_PREFIX}fee_policy_zero`, createdBy,
  );
}

async function main() {
  await requireDemoOnlyDatabase();
  await reset();

  const buyerUser = await ownerOf(BUYER_ORG);
  const supplierUser = await ownerOf(SUPPLIER_ORG);
  const buyer = session(BUYER_ORG, buyerUser);
  const supplier = session(SUPPLIER_ORG, supplierUser);

  await seedZeroFeePolicy(supplierUser);

  const providerResource = `${SEED_PREFIX}resource_provider`;
  const spaceResource = `${SEED_PREFIX}resource_space`;

  await seedResource(providerResource, SUPPLIER_ORG, supplierUser, "provider",
    "Synthetic · nurse injector day cover",
    "Synthetic reviewed professional capacity for a full clinic day.",
    "general", "network");
  await seedResource(spaceResource, SUPPLIER_ORG, supplierUser, "space",
    "Synthetic · treatment room, Midtown",
    "Synthetic reviewed treatment room capacity for a defined window.",
    "healthcare_space", "public");

  const spaceStart = iso(10 * DAY);
  const spaceEnd = iso(10 * DAY + 5 * 3600 * 1000);
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceAvailabilityRecord" ("id","resourceId","startsAt","endsAt","capacity","status","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,1,'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    `${SEED_PREFIX}avail_space`, spaceResource, new Date(spaceStart), new Date(spaceEnd),
  );

  // 1. A need with nothing on it yet — the honest starting state.
  await createSavedGridDemand(buyer, {
    kind: "space", title: "Synthetic · overflow room for a Saturday clinic",
    description: "Synthetic demand for treatment room capacity during a weekend push.",
    category: "Clinical space", requestedStartAt: iso(21 * DAY), requestedEndAt: iso(21 * DAY + 6 * 3600 * 1000),
    state: "NY", quantity: 1, status: "open", visibility: "public",
    requirements: ["Treatment room", "Weekend access"],
  });

  // 2. A need with an offer waiting on the other party's decision.
  const pendingDemand = await createSavedGridDemand(buyer, {
    kind: "space", title: "Synthetic · treatment room, ten days out",
    description: "Synthetic demand matched against reviewed space capacity.",
    category: "Clinical space", requestedStartAt: spaceStart, requestedEndAt: spaceEnd,
    state: "NY", quantity: 1, status: "open", visibility: "public",
    requirements: ["Reviewed healthcare space"],
  }) as { id: string };

  await createGridOffer(buyer, {
    demandId: pendingDemand.id, resourceKind: "space", resourceReference: spaceResource,
    recipientOrganizationId: SUPPLIER_ORG, offeredStartAt: spaceStart, offeredEndAt: spaceEnd,
    grossAmountCents: 68_000, depositAmountCents: 12_000, locationPayableCents: 0,
    note: "Synthetic offer for the reviewed treatment room during the published window.",
    expiresAt: iso(2 * DAY),
  });

  // 3. A deal all the way through: accepted, reserved, paid, fulfilled, allocated.
  const settledDemand = await createSavedGridDemand(buyer, {
    kind: "provider", title: "Synthetic · cover a Friday clinic",
    description: "Synthetic demand for one full day of eligible clinical coverage.",
    category: "Clinical coverage", requestedStartAt: iso(7 * DAY), requestedEndAt: iso(7 * DAY + 8 * 3600 * 1000),
    state: "NY", quantity: 1, status: "open", visibility: "matched_only",
    requirements: ["Required professional credential", "Clinic eligibility review"],
  }) as { id: string };

  const settledOffer = await createGridOffer(buyer, {
    demandId: settledDemand.id, resourceKind: "provider", resourceReference: providerResource,
    recipientOrganizationId: SUPPLIER_ORG, offeredStartAt: iso(7 * DAY), offeredEndAt: iso(7 * DAY + 8 * 3600 * 1000),
    grossAmountCents: 120_000, depositAmountCents: 20_000, locationPayableCents: 0,
    note: "Synthetic offer for reviewed professional capacity at the agreed day rate.",
    expiresAt: iso(2 * DAY),
  }) as { id: string };

  // The counterparty accepts — not the buyer. The state machine enforces this, and the
  // seed uses the counterparty's session so it cannot pretend otherwise.
  await transitionGridOffer(supplier, settledOffer.id, {
    targetStatus: "accepted", note: "Synthetic acceptance of the offered professional coverage.",
  });

  const reservation = await createReservationFromAcceptedOffer(buyer, settledOffer.id) as { id: string };

  await recordManualGridReservationPayment(buyer, reservation.id, {
    externalReference: "SYNTHETIC-DEPOSIT-0001",
    note: "Synthetic manual deposit evidence. Not processor verification.",
  });

  for (const targetStatus of ["checked_in", "in_progress", "fulfilled"] as const) {
    await transitionGridFulfillment(supplier, reservation.id, {
      targetStatus, note: `Synthetic fulfillment record: ${targetStatus.replaceAll("_", " ")}.`,
    });
  }

  await allocateGridFinancialObligations(buyer, reservation.id);

  const counts = {
    demands: await db.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*)::bigint AS count FROM "GridDemandRecord"`),
    offers: await db.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*)::bigint AS count FROM "GridOfferRecord"`),
    reservations: await db.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*)::bigint AS count FROM "GridReservationRecord"`),
    obligations: await db.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*)::bigint AS count FROM "GridFinancialObligationRecord"`),
  };
  for (const [label, rows] of Object.entries(counts)) {
    console.log(`  ${label}: ${rows[0].count}`);
  }
  console.log("Grid demo data seeded through the real transaction chain.");
}

main()
  .catch((error) => {
    console.error("Grid demo seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
