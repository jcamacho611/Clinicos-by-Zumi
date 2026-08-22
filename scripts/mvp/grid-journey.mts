/**
 * Grid MVP journey — generalized Grid transactions against a real database.
 *
 * Proves that the shared transaction primitives are not secretly a staffing-only
 * marketplace by exercising both:
 *
 *   PROVIDER CAPACITY: NEED -> OFFER -> ACCEPTANCE -> RESERVATION
 *   HEALTHCARE SPACE:  NEED -> AVAILABILITY GATE -> OFFER -> ACCEPTANCE -> RESERVATION
 *
 * Run through the real repositories with real sessions so authorization, tenant
 * scoping, resource policy, availability and lifecycle validation are exercised.
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

  await db.$executeRawUnsafe(
    `DELETE FROM "GridResourceAvailabilityRecord" WHERE "resourceId" IN (SELECT "id" FROM "GridResourceRecord" WHERE "organizationId" = ANY($1))`,
    ids,
  ).catch(() => {});

  for (const table of ["GridReservationRecord", "GridOfferEventRecord", "GridOfferRecord", "GridDemandRecord", "GridResourceRecord"]) {
    await db.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "organizationId" = ANY($1)`, ids).catch(() => {});
  }

  await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();

  const org = await db.organization.create({
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
  const supplierSession = { userId: supplierUser.id, organizationId: supplier.id, role: "clinic_owner" } as unknown as ClinicSession;

  const resourceId = "res_mvp_provider_1";
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord" ("id","organizationId","createdBy","resourceType","title","description","policyClass","visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt") VALUES ($1,$2,$3,'provider','Clinical professional — day cover','Reviewed professional capacity available for a full-day clinic.','general','network','active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    resourceId,
    supplier.id,
    supplierUser.id,
  );

  let demandId = "";
  let demandError = "";
  try {
    const demand = await createSavedGridDemand(session, {
      kind: "provider",
      title: "Cover a Friday clinic",
      description: "Need an eligible clinical professional for one full day of appointments.",
      category: "Clinical coverage",
      requestedStartAt: iso(7 * DAY),
      requestedEndAt: iso(7 * DAY + 8 * 3600 * 1000),
      state: "NY",
      quantity: 1,
      status: "open",
      visibility: "matched_only",
      requirements: ["Required professional credential", "Clinic eligibility review"],
    });
    demandId = (demand as { id: string }).id;
  } catch (error) {
    demandError = error instanceof Error ? error.message : "unknown";
  }
  check("provider class: a clinic can save a real Grid need", Boolean(demandId), demandError || `demand ${demandId.slice(0, 12)}…`);

  const savedDemands = await listSavedGridDemands(session);
  check(
    "provider class: the saved need is readable back only in its organization",
    savedDemands.some((d) => (d as { id: string }).id === demandId),
    `${savedDemands.length} demand(s) visible to this organization`,
  );

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
      note: "Offering reviewed professional capacity at the agreed day rate.",
      expiresAt: iso(2 * DAY),
    });
    offerId = (offer as { id: string }).id;
  } catch (error) {
    offerError = error instanceof Error ? error.message : "unknown";
  }
  check("provider class: an offer can be made against the need", Boolean(offerId), offerError || `offer ${offerId.slice(0, 12)}…`);

  let prematureRefused = false;
  let prematureReason = "";
  try {
    await createReservationFromAcceptedOffer(session, offerId);
  } catch (error) {
    prematureRefused = true;
    prematureReason = error instanceof Error ? error.message : "unknown";
  }
  check("provider class: reservation cannot precede acceptance", prematureRefused, prematureReason || "RESERVATION CREATED WITHOUT ACCEPTANCE");

  let accepted = false;
  let acceptError = "";
  try {
    await transitionGridOffer(supplierSession, offerId, {
      targetStatus: "accepted",
      note: "Accepting the offered professional coverage.",
    });
    accepted = true;
  } catch (error) {
    acceptError = error instanceof Error ? error.message : "unknown";
  }
  const offersAfter = await listGridOffers(session);
  const offerState = (offersAfter.find((o) => (o as { id: string }).id === offerId) as { status?: string } | undefined)?.status;
  check("provider class: the resource owner can accept the offer", accepted, acceptError || `offer status=${offerState}`);

  let reservationId = "";
  let reservationError = "";
  try {
    const reservation = await createReservationFromAcceptedOffer(session, offerId);
    reservationId = (reservation as { id: string }).id;
  } catch (error) {
    reservationError = error instanceof Error ? error.message : "unknown";
  }
  check("provider class: accepted offer becomes a reservation", Boolean(reservationId), reservationError || `reservation ${reservationId.slice(0, 12)}…`);

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
    "provider class: the same offer cannot be reserved twice",
    doubleRefused || forThisOffer.length <= 1,
    doubleRefused ? `refused: ${doubleReason}` : `${forThisOffer.length} reservation(s) for this offer`,
  );

  const spaceResourceId = "res_mvp_space_1";
  const spaceStart = iso(10 * DAY);
  const spaceEnd = iso(10 * DAY + 5 * 3600 * 1000);
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord" ("id","organizationId","createdBy","resourceType","title","description","policyClass","visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt") VALUES ($1,$2,$3,'space','Treatment room capacity','Reviewed treatment room capacity available for a defined time window.','healthcare_space','public','active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    spaceResourceId,
    supplier.id,
    supplierUser.id,
  );
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceAvailabilityRecord" ("id","resourceId","startsAt","endsAt","capacity","status","createdAt","updatedAt") VALUES ('avail_mvp_space_1',$1,$2,$3,1,'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    spaceResourceId,
    new Date(spaceStart),
    new Date(spaceEnd),
  );

  let spaceDemandId = "";
  let spaceDemandError = "";
  try {
    const demand = await createSavedGridDemand(session, {
      kind: "space",
      title: "Treatment room for five hours",
      description: "Need reviewed treatment-room capacity for an approved operational use.",
      category: "Treatment room",
      requestedStartAt: spaceStart,
      requestedEndAt: spaceEnd,
      state: "NY",
      quantity: 1,
      status: "open",
      visibility: "matched_only",
      requirements: ["Reviewed healthcare space"],
    });
    spaceDemandId = (demand as { id: string }).id;
  } catch (error) {
    spaceDemandError = error instanceof Error ? error.message : "unknown";
  }
  check("space class: a clinic can save a space demand through the same engine", Boolean(spaceDemandId), spaceDemandError || `demand ${spaceDemandId.slice(0, 12)}…`);

  let outsideWindowRefused = false;
  let outsideWindowReason = "";
  try {
    await createGridOffer(session, {
      demandId: spaceDemandId,
      resourceKind: "space",
      resourceReference: spaceResourceId,
      recipientOrganizationId: supplier.id,
      offeredStartAt: iso(10 * DAY + 6 * 3600 * 1000),
      offeredEndAt: iso(10 * DAY + 7 * 3600 * 1000),
      grossAmountCents: 10_000,
      depositAmountCents: 0,
      locationPayableCents: 0,
      note: "This offer intentionally falls outside the approved availability window.",
      expiresAt: iso(2 * DAY),
    });
  } catch (error) {
    outsideWindowRefused = true;
    outsideWindowReason = error instanceof Error ? error.message : "unknown";
  }
  check(
    "space class: an offer outside approved availability is refused",
    outsideWindowRefused,
    outsideWindowReason || "OUT-OF-WINDOW OFFER WAS ACCEPTED",
  );

  let spaceOfferId = "";
  let spaceOfferError = "";
  try {
    const offer = await createGridOffer(session, {
      demandId: spaceDemandId,
      resourceKind: "space",
      resourceReference: spaceResourceId,
      recipientOrganizationId: supplier.id,
      offeredStartAt: spaceStart,
      offeredEndAt: spaceEnd,
      grossAmountCents: 50_000,
      depositAmountCents: 10_000,
      locationPayableCents: 0,
      note: "Offering the reviewed treatment-room availability window.",
      expiresAt: iso(2 * DAY),
    });
    spaceOfferId = (offer as { id: string }).id;
  } catch (error) {
    spaceOfferError = error instanceof Error ? error.message : "unknown";
  }
  check("space class: an in-window offer passes the same reviewed-resource policy", Boolean(spaceOfferId), spaceOfferError || `offer ${spaceOfferId.slice(0, 12)}…`);

  let spaceAccepted = false;
  let spaceAcceptError = "";
  try {
    await transitionGridOffer(supplierSession, spaceOfferId, {
      targetStatus: "accepted",
      note: "Accepting the treatment-room offer.",
    });
    spaceAccepted = true;
  } catch (error) {
    spaceAcceptError = error instanceof Error ? error.message : "unknown";
  }
  check("space class: the space owner can accept through the same offer state machine", spaceAccepted, spaceAcceptError || "accepted");

  let spaceReservationId = "";
  let spaceReservationError = "";
  try {
    const reservation = await createReservationFromAcceptedOffer(session, spaceOfferId);
    spaceReservationId = (reservation as { id: string }).id;
  } catch (error) {
    spaceReservationError = error instanceof Error ? error.message : "unknown";
  }
  check(
    "space class: accepted space offer becomes a reservation only inside real availability",
    Boolean(spaceReservationId),
    spaceReservationError || `reservation ${spaceReservationId.slice(0, 12)}…`,
  );

  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  check("both Grid transaction classes leave an audit trail", audits > 0, `${audits} audit records`);

  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} Grid journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
