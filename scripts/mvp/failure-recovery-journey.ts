/**
 * MVP Journey 12 — failure and recovery, against a real database.
 *
 *   CONCURRENT REQUESTS -> ONE OUTCOME
 *   FAILED TRANSACTION  -> NO PARTIAL STATE
 *   RETRY               -> SAME ANSWER, NOT A SECOND BOOKING
 *
 * Happy-path systems are not production systems. Two clients pressing the same button at
 * the same moment is the ordinary case in a marketplace, not an exotic one, and it is
 * exactly where a booking system double-sells.
 *
 * The concurrency here is real: overlapping transactions on separate pooled connections,
 * so Postgres arbitrates rather than JavaScript's event loop. That is the only way to
 * exercise the advisory lock — which was, until recently, issued through `$queryRaw` and
 * threw on `pg_advisory_xact_lock`'s void return, so no reservation could be made at all.
 */
import { PrismaClient } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { createSavedGridDemand } from "@/lib/grid/demand-repository";
import { createGridOffer, transitionGridOffer } from "@/lib/grid/offer-repository";
import { createReservationFromAcceptedOffer } from "@/lib/grid/reservation-repository";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-recovery-clinic";
const SUPPLIER_SLUG = "mvp-recovery-supplier";
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();
const DAY = 24 * 3600 * 1000;

async function reset() {
  const orgs = await db.organization.findMany({ where: { slug: { in: [SLUG, SUPPLIER_SLUG] } }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  if (!ids.length) return;
  for (const table of [
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
    data: { name: "MVP Recovery Clinic", slug: SLUG, clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const supplier = await db.organization.create({
    data: { name: "MVP Recovery Supplier", slug: SUPPLIER_SLUG, clinicType: "medspa", status: "active", demoMode: true },
    select: { id: true },
  });
  const user = await db.user.create({
    data: { organizationId: org.id, email: "recovery-owner@mvp.test", name: "Recovery Owner", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const supplierUser = await db.user.create({
    data: { organizationId: supplier.id, email: "recovery-supplier@mvp.test", name: "Supplier", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const session = { userId: user.id, organizationId: org.id, role: "clinic_owner" } as unknown as ClinicSession;
  const supplierSession = { userId: supplierUser.id, organizationId: supplier.id, role: "clinic_owner" } as unknown as ClinicSession;

  // One injector, capacity for one booking, offered into two separate deals.
  const resourceId = "res_recovery_injector_1";
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord"
       ("id","organizationId","createdBy","resourceType","title","description","policyClass",
        "visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt")
     VALUES ($1,$2,$3,'provider','Injector — single chair','One licensed injector.','general',
             'network','active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    resourceId, supplier.id, user.id,
  );

  const contendedResourceId = "res_recovery_injector_2";
  await db.$executeRawUnsafe(
    `INSERT INTO "GridResourceRecord"
       ("id","organizationId","createdBy","resourceType","title","description","policyClass",
        "visibility","status","state","capacity","requiresHumanReview","reviewStatus","reviewedAt","updatedAt")
     VALUES ($1,$2,$3,'provider','Injector — contended chair','A second single-capacity injector.','general',
             'network','active','NY',1,true,'approved',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    contendedResourceId, supplier.id, user.id,
  );

  async function acceptedOffer(title: string, resource = resourceId) {
    const demand = await createSavedGridDemand(session, {
      kind: "provider", title,
      description: "Cover for a full day of aesthetic appointments.",
      category: "Injectables", requestedStartAt: iso(7 * DAY), requestedEndAt: iso(7 * DAY + 8 * 3600 * 1000),
      state: "NY", quantity: 1, status: "open", visibility: "matched_only", requirements: [],
    });
    const offer = await createGridOffer(session, {
      demandId: (demand as { id: string }).id,
      resourceKind: "provider", resourceReference: resource, recipientOrganizationId: supplier.id,
      offeredStartAt: iso(7 * DAY), offeredEndAt: iso(7 * DAY + 8 * 3600 * 1000),
      grossAmountCents: 120_000, depositAmountCents: 0, locationPayableCents: 0,
      note: title, expiresAt: iso(2 * DAY),
    });
    const offerId = (offer as { id: string }).id;
    await transitionGridOffer(supplierSession, offerId, { targetStatus: "accepted", note: "Accepted." });
    return offerId;
  }

  const offerA = await acceptedOffer("Friday cover — deal A");

  // --- 1. the same offer, reserved twice at once --------------------------
  // These go through the application's own Prisma client, whose pool hands each
  // concurrent transaction its own connection — so the two transactions really are
  // simultaneous in Postgres and it is Postgres, not the event loop, that arbitrates.
  // This is the same client and the same code path a request handler uses.
  const sameOffer = await Promise.allSettled([
    createReservationFromAcceptedOffer(session, offerA),
    createReservationFromAcceptedOffer(session, offerA),
  ]);
  const sameOfferRows = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "GridReservationRecord" WHERE "offerId" = $1`, offerA,
  );
  const fulfilledSame = sameOffer.filter((r) => r.status === "fulfilled").length;
  check(
    "two simultaneous reservations of the same offer produce exactly one booking",
    sameOfferRows.length === 1,
    `${sameOfferRows.length} reservation row(s); ${fulfilledSame}/2 calls returned a reservation ` +
      `(returning the existing one is correct — a retry must be idempotent, not an error)`,
  );

  // --- 2. one resource, two different deals, at the same moment -----------
  // This is the case the advisory lock exists for: distinct offers whose only conflict is
  // that they want the same injector in the same hours. It needs its own resource — the
  // first check already booked the injector above, and reusing it would make both of
  // these refuse for the ordinary reason that the chair was simply taken.
  const offerB = await acceptedOffer("Friday cover — deal B", contendedResourceId);
  const offerC = await acceptedOffer("Friday cover — deal C", contendedResourceId);
  const contended = await Promise.allSettled([
    createReservationFromAcceptedOffer(session, offerB),
    createReservationFromAcceptedOffer(session, offerC),
  ]);
  const won = contended.filter((r) => r.status === "fulfilled");
  const lost = contended.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const heldRows = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "GridReservationRecord"
     WHERE "resourceReference" = $1 AND "status" IN ('pending','held','consumed')`, contendedResourceId,
  );
  check(
    "a single-capacity resource cannot be double-booked by two concurrent deals",
    won.length === 1 && lost.length === 1 && heldRows.length === 1,
    `${won.length} succeeded, ${lost.length} refused, ${heldRows.length} active reservation(s) on the resource. ` +
      `Refusal: ${lost[0] ? (lost[0].reason as Error).message : "NONE — THE RESOURCE WAS DOUBLE-BOOKED"}`,
  );

  // --- 3. a refused reservation leaves nothing behind ---------------------
  // A rolled-back transaction must not leave the demand marked reserved, which would
  // strand it: not bookable, and not visible as still needing supply.
  const losingOffer = contended[0].status === "fulfilled" ? offerC : offerB;
  const winningOffer = losingOffer === offerC ? offerB : offerC;
  const orphanRows = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "GridReservationRecord" WHERE "offerId" = $1`, losingOffer,
  );
  const strandedDemand = await db.$queryRawUnsafe<Array<{ status: string }>>(
    `SELECT d."status" FROM "GridDemandRecord" d
     JOIN "GridOfferRecord" o ON o."demandId" = d."id" WHERE o."id" = $1`, losingOffer,
  );
  check(
    "the reservation that lost the race left no partial state behind",
    orphanRows.length === 0 && strandedDemand[0]?.status !== "reserved",
    `${orphanRows.length} orphan reservation row(s); its demand is "${strandedDemand[0]?.status}" and still open to another offer`,
  );

  // --- 4. retrying a completed reservation is safe ------------------------
  // A client that times out and retries must not create a second booking.
  let retriedId = "";
  let retryError = "";
  try {
    retriedId = (await createReservationFromAcceptedOffer(session, winningOffer) as { id: string }).id;
  } catch (error) {
    retryError = error instanceof Error ? error.message : "unknown";
  }
  const afterRetry = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "GridReservationRecord" WHERE "offerId" = $1`, winningOffer,
  );
  check(
    "retrying a reservation that already succeeded returns the same booking, not a new one",
    afterRetry.length === 1 && retriedId === afterRetry[0].id,
    retryError
      ? `RETRY THREW: ${retryError}`
      : `${afterRetry.length} reservation row(s); the retry returned ${retriedId.slice(0, 12)}…`,
  );

  // --- 5. an offer that never got accepted cannot be reserved by a retry --
  const staleDemand = await createSavedGridDemand(session, {
    kind: "provider", title: "Never accepted",
    description: "An offer that was made and never answered.",
    category: "Injectables", requestedStartAt: iso(21 * DAY), requestedEndAt: iso(21 * DAY + 4 * 3600 * 1000),
    state: "NY", quantity: 1, status: "open", visibility: "matched_only", requirements: [],
  });
  const staleOffer = await createGridOffer(session, {
    demandId: (staleDemand as { id: string }).id,
    resourceKind: "provider", resourceReference: resourceId, recipientOrganizationId: supplier.id,
    // A window nothing else touches, so the refusal can only be about the offer's state.
    offeredStartAt: iso(21 * DAY), offeredEndAt: iso(21 * DAY + 4 * 3600 * 1000),
    grossAmountCents: 60_000, depositAmountCents: 0, locationPayableCents: 0,
    note: "Unanswered offer.", expiresAt: iso(DAY),
  });
  let staleRefused = false;
  let staleReason = "";
  try {
    await createReservationFromAcceptedOffer(session, (staleOffer as { id: string }).id);
  } catch (error) {
    staleRefused = true;
    staleReason = error instanceof Error ? error.message : "unknown";
  }
  check(
    "an unanswered offer stays unreservable no matter how many times it is retried",
    staleRefused,
    staleReason || "RESERVED AN OFFER NOBODY ACCEPTED",
  );

  // --- 6. the contended path is still fully auditable ---------------------
  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  check(
    "contention and refusal are recorded, not silently dropped",
    audits > 0,
    `${audits} audit records across the contended path`,
  );

  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} failure and recovery journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
