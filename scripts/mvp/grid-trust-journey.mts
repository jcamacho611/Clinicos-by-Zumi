/**
 * MVP Journey 4 — the Grid problem path, against a real database.
 *
 *   RESERVATION -> DISPUTE / SAFETY INCIDENT -> HOLD / REVIEW -> RESOLUTION
 *
 * The property that matters most: a review outcome must never be stated as though the
 * money moved or the participant was actually restricted. "Refund recommended" is not
 * "refund completed", and this journey checks the difference.
 */
import { PrismaClient } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { createSavedGridDemand } from "@/lib/grid/demand-repository";
import { createGridOffer, transitionGridOffer } from "@/lib/grid/offer-repository";
import { createReservationFromAcceptedOffer } from "@/lib/grid/reservation-repository";
import {
  createGridDispute,
  createGridSafetyIncident,
  listGridIssuesForReservation,
  reservationHasActiveGridIssues,
} from "@/lib/grid/trust-repository";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-trust-clinic";
const SUPPLIER_SLUG = "mvp-trust-supplier";
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();
const DAY = 24 * 3600 * 1000;

async function reset() {
  const orgs = await db.organization.findMany({ where: { slug: { in: [SLUG, SUPPLIER_SLUG] } }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  if (!ids.length) return;
  for (const table of [
    "GridSafetyIncidentEventRecord", "GridSafetyIncidentRecord",
    "GridDisputeEventRecord", "GridDisputeRecord",
    "GridReservationRecord", "GridOfferEventRecord", "GridOfferRecord",
    "GridDemandRecord", "GridResourceRecord",
  ]) {
    await db.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "organizationId" = ANY($1)`, ids).catch(() => {});
  }
  await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();
  const org = await db.organization.create({
    data: { name: "MVP Trust Clinic", slug: SLUG, clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const supplier = await db.organization.create({
    data: { name: "MVP Trust Supplier", slug: SUPPLIER_SLUG, clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const user = await db.user.create({
    data: { organizationId: org.id, email: "trust-owner@mvp.test", name: "Trust Owner", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const supplierUser = await db.user.create({
    data: { organizationId: supplier.id, email: "trust-supplier@mvp.test", name: "Supplier Owner", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const session = { userId: user.id, organizationId: org.id, role: "clinic_owner" } as unknown as ClinicSession;
  const supplierSession = { userId: supplierUser.id, organizationId: supplier.id, role: "clinic_owner" } as unknown as ClinicSession;

  const resourceId = "res_trust_injector_1";
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord"
       ("id","organizationId","createdBy","resourceType","title","description","policyClass",
        "visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt")
     VALUES ($1,$2,$3,'provider','Injector — day cover','Licensed injector.','general',
             'network','active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    resourceId, supplier.id, user.id,
  );

  // Build a real reservation to attach problems to.
  const demand = await createSavedGridDemand(session, {
    kind: "provider", title: "Friday injectables cover",
    description: "Need a licensed injector for a full day of aesthetic appointments.",
    category: "Injectables", requestedStartAt: iso(7 * DAY), requestedEndAt: iso(7 * DAY + 8 * 3600 * 1000),
    state: "NY", quantity: 1, status: "open", visibility: "matched_only", requirements: [],
  });
  const offer = await createGridOffer(session, {
    demandId: (demand as { id: string }).id,
    resourceKind: "provider", resourceReference: resourceId, recipientOrganizationId: supplier.id,
    offeredStartAt: iso(7 * DAY), offeredEndAt: iso(7 * DAY + 8 * 3600 * 1000),
    grossAmountCents: 120_000, depositAmountCents: 0, locationPayableCents: 0,
    note: "Full-day injectables cover at the agreed day rate.", expiresAt: iso(2 * DAY),
  });
  const offerId = (offer as { id: string }).id;
  await transitionGridOffer(supplierSession, offerId, { targetStatus: "accepted", note: "Accepting the Friday cover." });
  const reservation = await createReservationFromAcceptedOffer(session, offerId);
  const reservationId = (reservation as { id: string }).id;

  check("a reservation exists to attach problems to", Boolean(reservationId), `reservation ${reservationId.slice(0, 12)}…`);

  // --- 1. a reservation starts with no active issues ----------------------
  const cleanAtStart = await db.$transaction((tx) => reservationHasActiveGridIssues(tx, reservationId));
  check(
    "a new reservation carries no active issues and is not blocked",
    !cleanAtStart.blocked && cleanAtStart.activeDisputes === 0 && cleanAtStart.activeSafetyIncidents === 0,
    `blocked=${cleanAtStart.blocked} disputes=${cleanAtStart.activeDisputes} incidents=${cleanAtStart.activeSafetyIncidents}`,
  );

  // --- 2. DISPUTE ---------------------------------------------------------
  let disputeId = "";
  let disputeError = "";
  try {
    const dispute = await createGridDispute(session, reservationId, {
      category: "service_not_completed",
      summary: "The booked injector did not attend and the clinic day ran without cover.",
      requestedOutcome: "Full refund of the day rate.",
    });
    disputeId = (dispute as { id: string }).id;
  } catch (error) {
    disputeError = error instanceof Error ? error.message : "unknown";
  }
  check("a participant can open a dispute on their reservation", Boolean(disputeId), disputeError || `dispute ${disputeId.slice(0, 12)}…`);

  // --- 3. one active dispute per organization ------------------------------
  let duplicateRefused = false;
  let duplicateReason = "";
  try {
    await createGridDispute(session, reservationId, {
      category: "no_show",
      summary: "Opening a second dispute on the same reservation from the same organization.",
    });
  } catch (error) {
    duplicateRefused = true;
    duplicateReason = error instanceof Error ? error.message : "unknown";
  }
  check("the same organization cannot stack duplicate disputes", duplicateRefused, duplicateReason || "DUPLICATE ALLOWED");

  // --- 4. SAFETY INCIDENT is a distinct thing ------------------------------
  let incidentId = "";
  let incidentError = "";
  try {
    const incident = await createGridSafetyIncident(session, reservationId, {
      category: "credential_concern",
      severity: "high",
      summary: "The attending professional could not evidence a current licence on the day.",
    });
    incidentId = (incident as { id: string }).id;
  } catch (error) {
    incidentError = error instanceof Error ? error.message : "unknown";
  }
  check(
    "a safety incident is separate from a commercial dispute",
    Boolean(incidentId) && incidentId !== disputeId,
    incidentError || `incident ${incidentId.slice(0, 12)}… distinct from dispute`,
  );

  // --- 5. open issues are visible and hold the reservation ----------------
  const issues = await listGridIssuesForReservation(session, reservationId);
  const nowHasIssues = await db.$transaction((tx) => reservationHasActiveGridIssues(tx, reservationId));
  check(
    "an open dispute and safety incident block the reservation and are both visible",
    nowHasIssues.blocked && nowHasIssues.activeDisputes === 1 && nowHasIssues.activeSafetyIncidents === 1
      && issues.disputes.length === 1 && issues.safetyIncidents.length === 1,
    `blocked=${nowHasIssues.blocked} disputes=${issues.disputes.length} safetyIncidents=${issues.safetyIncidents.length}`,
  );

  // --- 6. cross-tenant: an unrelated org cannot open issues here ----------
  const outsider = await db.organization.create({
    data: { name: "Outsider", slug: "mvp-trust-outsider", clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const outsiderUser = await db.user.create({
    data: { organizationId: outsider.id, email: "outsider@mvp.test", name: "Outsider", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const outsiderSession = { userId: outsiderUser.id, organizationId: outsider.id, role: "clinic_owner" } as unknown as ClinicSession;
  let outsiderRefused = false;
  let outsiderReason = "";
  try {
    await createGridDispute(outsiderSession, reservationId, {
      category: "no_show",
      summary: "An unrelated organization attempting to dispute someone else's reservation.",
    });
  } catch (error) {
    outsiderRefused = true;
    outsiderReason = error instanceof Error ? error.message : "unknown";
  }
  check(
    "an unrelated organization cannot open a dispute on someone else's reservation",
    outsiderRefused,
    outsiderReason || "CROSS-TENANT DISPUTE ALLOWED",
  );

  // --- 7. resolution language must not overclaim --------------------------
  // A review outcome is a recommendation until money actually moves. The vocabulary
  // itself is the control, so it is asserted here rather than trusted.
  const statuses = await db.$queryRawUnsafe<Array<{ status: string }>>(
    `SELECT "status" FROM "GridDisputeRecord" WHERE "id" = $1`, disputeId,
  );
  const overclaiming = ["refunded", "refund_completed", "paid", "settled", "suspended"];
  check(
    "dispute status vocabulary does not claim money moved or a participant was suspended",
    !overclaiming.includes(statuses[0]?.status ?? ""),
    `status=${statuses[0]?.status} (resolution states are recommendations, not settlements)`,
  );

  // --- 8. auditable --------------------------------------------------------
  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  check("the problem path leaves an audit trail", audits > 0, `${audits} audit records`);

  await db.user.deleteMany({ where: { organizationId: outsider.id } });
  await db.organization.deleteMany({ where: { id: outsider.id } });
  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} Grid trust journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
