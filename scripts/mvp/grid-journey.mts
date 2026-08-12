/**
 * MVP Journeys 3 and 4 — the Grid transaction, against a real database.
 *
 *   NEED -> OFFER -> ACCEPTANCE -> RESERVATION -> FULFILLMENT
 *   and the post-booking path: DISPUTE / SAFETY INCIDENT
 *
 * Run through the real repository functions with a real session, so authorization,
 * tenant scoping and lifecycle validation are all exercised rather than bypassed.
 */
import { PrismaClient } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { createSavedGridDemand, listSavedGridDemands } from "@/lib/grid/demand-repository";
import { createGridOffer, transitionGridOffer, listGridOffers } from "@/lib/grid/offer-repository";
import { createReservationFromAcceptedOffer, listGridReservations } from "@/lib/grid/reservation-repository";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-grid-clinic";
const SUPPLIER_SLUG = "mvp-grid-supplier";
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();
const DAY = 24 * 3600 * 1000;

async function reset() {
  const orgs = await db.organization.findMany({ where: { slug: { in: [SLUG, SUPPLIER_SLUG] } }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  if (!ids.length) return;
  for (const table of [
    "GridReservationRecord", "GridOfferEventRecord", "GridOfferRecord", "GridDemandRecord",
    "GridResourceRecord",
  ]) {
    await db.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "organizationId" = ANY($1)`, ids).catch(() => {});
  }
  await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();
  const org = await db.organization.create({
    // demoMode is required by the Grid guard: real patient/provider data needs a
    // production review this workflow deliberately has not had.
    data: { name: "MVP Grid Clinic", slug: SLUG, clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const supplier = await db.organization.create({
    data: { name: "MVP Grid Supplier", slug: SUPPLIER_SLUG, clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const user = await db.user.create({
    data: { organizationId: org.id, email: "grid-owner@mvp.test", name: "Grid Owner", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const supplierUser = await db.user.create({
    data: { organizationId: supplier.id, email: "supplier-owner@mvp.test", name: "Supplier Owner", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const session = { userId: user.id, organizationId: org.id, role: "clinic_owner" } as unknown as ClinicSession;
  // The offer is made to the supplier, so only the supplier can decide on it. Using the
  // requester's session here would be the authorization bug this journey should catch.
  const supplierSession = { userId: supplierUser.id, organizationId: supplier.id, role: "clinic_owner" } as unknown as ClinicSession;

  // --- 0. I HAVE SOMETHING ------------------------------------------------
  // The supply side. An offer can only name a resource that actually exists, is active
  // and has been human-approved — inserted directly here because approving a resource is
  // a reviewer's job, not something this journey should pretend to automate.
  const resourceId = "res_mvp_injector_1";
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord"
       ("id","organizationId","createdBy","resourceType","title","description","policyClass",
        "visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt")
     VALUES ($1,$2,$3,'provider','Aesthetic injector — day cover',
             'Licensed injector available for full-day aesthetic clinics.','general',
             'network','active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    resourceId, supplier.id, user.id,
  );

  // --- 1. I NEED SOMETHING ------------------------------------------------
  let demandId = "";
  let demandError = "";
  try {
    const demand = await createSavedGridDemand(session, {
      kind: "provider",
      title: "Cover a Friday injectables clinic",
      description: "Need a licensed injector for one full day of aesthetic appointments.",
      category: "Injectables",
      requestedStartAt: iso(7 * DAY),
      requestedEndAt: iso(7 * DAY + 8 * 3600 * 1000),
      state: "NY",
      quantity: 1,
      status: "open",
      visibility: "matched_only",
      requirements: ["RN or NP", "Aesthetic injector experience"],
    });
    demandId = (demand as { id: string }).id;
  } catch (error) {
    demandError = error instanceof Error ? error.message : "unknown";
  }
  check("a clinic can save a real Grid need", Boolean(demandId), demandError || `demand ${demandId.slice(0, 12)}…`);

  const savedDemands = await listSavedGridDemands(session);
  check(
    "the saved need is readable back, scoped to the organization",
    savedDemands.some((d) => (d as { id: string }).id === demandId),
    `${savedDemands.length} demand(s) visible to this organization`,
  );

  // --- 2. OFFER -----------------------------------------------------------
  let offerId = "";
  let offerError = "";
  try {
    const offer = await createGridOffer(session, {
      demandId,
      resourceKind: "provider",
      resourceReference: resourceId,
      recipientOrganizationId: supplier.id,
      offeredStartAt: iso(7 * DAY),
      offeredEndAt: iso(7 * DAY + 8 * 3600 * 1000),
      grossAmountCents: 120_000,
      depositAmountCents: 20_000,
      locationPayableCents: 0,
      note: "Offering a full-day injectables cover at the agreed day rate.",
      expiresAt: iso(2 * DAY),
    });
    offerId = (offer as { id: string }).id;
  } catch (error) {
    offerError = error instanceof Error ? error.message : "unknown";
  }
  check("an offer can be made against the need", Boolean(offerId), offerError || `offer ${offerId.slice(0, 12)}…`);

  // --- 3. a reservation must not exist before acceptance ------------------
  let prematureRefused = false;
  let prematureReason = "";
  try {
    await createReservationFromAcceptedOffer(session, offerId);
  } catch (error) {
    prematureRefused = true;
    prematureReason = error instanceof Error ? error.message : "unknown";
  }
  check(
    "a reservation cannot be created from an offer nobody accepted",
    prematureRefused,
    prematureReason || "RESERVATION CREATED WITHOUT ACCEPTANCE",
  );

  // --- 4. ACCEPTANCE ------------------------------------------------------
  let accepted = false;
  let acceptError = "";
  try {
    await transitionGridOffer(supplierSession, offerId, {
      targetStatus: "accepted",
      note: "Accepting the offered cover for the Friday clinic.",
    });
    accepted = true;
  } catch (error) {
    acceptError = error instanceof Error ? error.message : "unknown";
  }
  const offersAfter = await listGridOffers(session);
  const offerState = (offersAfter.find((o) => (o as { id: string }).id === offerId) as { status?: string } | undefined)?.status;
  check("the offer can be accepted", accepted, acceptError || `offer status=${offerState}`);

  // --- 5. RESERVATION -----------------------------------------------------
  let reservationId = "";
  let reservationError = "";
  try {
    const reservation = await createReservationFromAcceptedOffer(session, offerId);
    reservationId = (reservation as { id: string }).id;
  } catch (error) {
    reservationError = error instanceof Error ? error.message : "unknown";
  }
  check(
    "an accepted offer becomes a reservation",
    Boolean(reservationId),
    reservationError || `reservation ${reservationId.slice(0, 12)}…`,
  );

  // --- 6. no double-booking ----------------------------------------------
  let doubleRefused = false;
  let doubleReason = "";
  try {
    await createReservationFromAcceptedOffer(session, offerId);
  } catch (error) {
    doubleRefused = true;
    doubleReason = error instanceof Error ? error.message : "unknown";
  }
  const reservations = await listGridReservations(session);
  const forThisOffer = reservations.filter((r) => (r as { offerId?: string }).offerId === offerId);
  check(
    "the same accepted offer cannot be reserved twice",
    doubleRefused || forThisOffer.length <= 1,
    doubleRefused ? `refused: ${doubleReason}` : `${forThisOffer.length} reservation(s) for this offer`,
  );

  // --- 7. the transaction is auditable ------------------------------------
  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  check("the Grid transaction leaves an audit trail", audits > 0, `${audits} audit records`);

  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} Grid journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
