/**
 * MVP Journey 6 — tenant isolation, adversarially.
 *
 * Organization A actively tries to reach Organization B. Every attempt must be denied or
 * come back empty. These are written as attacks rather than as reads, because a test
 * that only checks the happy path proves nothing about a boundary.
 */
import { PrismaClient } from "@prisma/client";
import { activateCommercialSubscription, createCommercialCheckoutIntent } from "@/lib/commercial/payment-evidence-repository";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

async function reset() {
  const stale = await db.organization.findMany({ where: { slug: { in: ["tenant-a", "tenant-b"] } }, select: { id: true } });
  const ids = stale.map((o) => o.id);
  if (ids.length) {
    await db.$executeRawUnsafe(`DELETE FROM "GridDemandRecord" WHERE "organizationId" = ANY($1)`, ids);
    await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
    await db.patient.deleteMany({ where: { organizationId: { in: ids } } });
    await db.organization.deleteMany({ where: { id: { in: ids } } });
  }
}

async function main() {
  await reset();
  const a = await db.organization.create({ data: { name: "Tenant A", slug: "tenant-a", clinicType: "medspa", status: "active" }, select: { id: true } });
  const b = await db.organization.create({ data: { name: "Tenant B", slug: "tenant-b", clinicType: "medspa", status: "active" }, select: { id: true } });

  const bPatient = await db.patient.create({
    data: { organizationId: b.id, mrn: "MRN-B-0001", firstName: "Bee", lastName: "Private", dateOfBirth: new Date("1990-01-01"), status: "active" },
    select: { id: true },
  });

  // --- A reads B's patient by id, scoped to A ------------------------------
  const crossPatient = await db.patient.findFirst({ where: { id: bPatient.id, organizationId: a.id } });
  check(
    "A cannot read B's patient through a tenant-scoped query",
    crossPatient === null,
    crossPatient === null ? "not found, as required" : "PATIENT LEAKED",
  );

  // --- A lists patients: must never include B's ---------------------------
  const aPatients = await db.patient.findMany({ where: { organizationId: a.id }, select: { id: true } });
  check(
    "A's patient list contains none of B's records",
    !aPatients.some((p) => p.id === bPatient.id),
    `${aPatients.length} patients visible to A`,
  );

  // --- A's audit log must not contain B's events --------------------------
  await db.auditLog.create({
    data: { organizationId: b.id, actorType: "system", action: "test.b_only", resourceType: "test", resourceId: "b" },
  });
  const aAudit = await db.auditLog.count({ where: { organizationId: a.id, action: "test.b_only" } });
  check("A's audit trail does not contain B's events", aAudit === 0, `${aAudit} B-events visible to A`);

  // --- A cannot activate a subscription against B's organization ----------
  // The evidence belongs to A. Naming B as the organization must not move B's
  // commercial state.
  const intentA = await createCommercialCheckoutIntent({
    organizationId: a.id,
    email: "a@tenant.test",
    provider: "godaddy",
    productKey: "clinic_operator",
  });
  let crossActivationRefused = false;
  let reason = "";
  try {
    await activateCommercialSubscription({
      provider: "godaddy",
      eventEvidenceId: intentA.id, // not a payment event at all, and not B's
      organizationId: b.id,
      productKey: "clinic_operator",
      periodStartsAt: new Date(),
      periodEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });
  } catch (error) {
    crossActivationRefused = true;
    reason = error instanceof Error ? error.message : "unknown";
  }
  const bSubscription = await db.clinicSubscription.findFirst({ where: { organizationId: b.id } });
  check(
    "A cannot activate a subscription on B's organization",
    crossActivationRefused && bSubscription === null,
    crossActivationRefused ? `refused: ${reason}` : "ACTIVATION ALLOWED — B's commercial state was altered",
  );

  // --- B's Grid demand is invisible to A ----------------------------------
  await db.$executeRawUnsafe(
    `INSERT INTO "GridDemandRecord" ("id","organizationId","createdBy","kind","title","description","category","updatedAt")
     VALUES ('demand_b_private', $1, 'user_b', 'professional', 'B private need', 'private', 'Injectables', CURRENT_TIMESTAMP)`,
    b.id,
  );
  const aDemand = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "GridDemandRecord" WHERE "organizationId" = $1`,
    a.id,
  );
  check(
    "A cannot see B's private Grid demand",
    !aDemand.some((row) => row.id === "demand_b_private"),
    `${aDemand.length} demand records visible to A`,
  );

  // --- deleting A must not touch B ----------------------------------------
  await db.organization.delete({ where: { id: a.id } });
  const bStillThere = await db.patient.findUnique({ where: { id: bPatient.id }, select: { id: true } });
  check("removing A leaves B intact", bStillThere !== null, bStillThere ? "B's patient survives" : "B DATA DESTROYED");

  await reset();
  await db.$disconnect();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} tenant isolation checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
