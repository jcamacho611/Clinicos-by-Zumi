/**
 * MVP Journey 9 — a fresh deployment, against a genuinely empty database.
 *
 *   EMPTY DATABASE -> MIGRATIONS -> BOOT -> EMPTY STATE -> FIRST REAL WORK -> RESTART
 *
 * This is the journey that decides whether Klinikos can be deployed at all, and it has
 * failed before: nine migrations referenced Prisma model names instead of the mapped
 * table names, so every one of them was unusable against an empty database while every
 * unit test stayed green. Nothing here trusts the schema file — the assertions are made
 * against the database that `migrate deploy` actually produced.
 *
 * Run it against a scratch database. It creates and drops its own data but assumes the
 * DATABASE_URL it is given is disposable.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { runFollowUpSweep, listOperationalActions } from "@/lib/operations/followup-service";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-fresh-clinic";

function prisma(...args: string[]) {
  return execFileSync("npx", ["prisma", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

async function main() {
  const migrationsDir = join(process.cwd(), "prisma/migrations");
  const onDisk = readdirSync(migrationsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  // --- 1. every committed migration actually applied ----------------------
  const applied = await db.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"
  `;
  const finished = applied.filter((row) => row.finished_at && !row.rolled_back_at);
  const missing = onDisk.filter((name) => !finished.some((row) => row.migration_name === name));
  check(
    "every committed migration applied cleanly to an empty database",
    missing.length === 0 && finished.length === onDisk.length,
    missing.length ? `NEVER APPLIED: ${missing.join(", ")}` : `${finished.length} of ${onDisk.length} migrations applied, 0 rolled back`,
  );

  // --- 2. the migrations produced a real schema ----------------------------
  // Counting tables is weak on its own, so the tables the product cannot start without
  // are named explicitly.
  const tables = await db.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `;
  const names = new Set(tables.map((row) => row.table_name));
  const required = [
    "organizations", "users", "patients", "appointments", "audit_logs",
    "GridDemandRecord", "GridOfferRecord", "GridReservationRecord", "GridResourceRecord",
    "operational_actions",
  ];
  const absent = required.filter((table) => !names.has(table));
  check(
    "the schema the migrations built contains the tables the product cannot start without",
    absent.length === 0,
    absent.length ? `MISSING: ${absent.join(", ")}` : `${names.size} tables, including all ${required.length} checked by name`,
  );

  // --- 3. migrate deploy is idempotent ------------------------------------
  // A restart, a redeploy and a second replica all re-run this command.
  const second = prisma("migrate", "deploy");
  check(
    "re-running migrate deploy on an already-migrated database is a no-op",
    /No pending migrations|already in sync|successfully applied/i.test(second),
    second.trim().split("\n").filter(Boolean).slice(-1)[0] ?? "(no output)",
  );

  // --- 4. migration history is coherent, with nothing pending -------------
  const status = (() => {
    try { return prisma("migrate", "status"); } catch (error) {
      return (error as { stdout?: string }).stdout ?? "(status failed)";
    }
  })();
  check(
    "migration history has no failed, pending or unapplied entries",
    /Database schema is up to date/i.test(status) && !/failed|pending|not yet been applied/i.test(status),
    status.trim().split("\n").filter(Boolean).slice(-1)[0] ?? "(no output)",
  );

  // --- 5. an empty deployment reads as empty, not as broken ---------------
  // A fresh install has no data, and every list surface has to survive that. Counting
  // through the real client is what proves the columns exist as well as the tables.
  const emptyCounts = {
    organizations: await db.organization.count(),
    patients: await db.patient.count(),
    appointments: await db.appointment.count(),
    audit: await db.auditLog.count(),
  };
  const dirty = Object.entries(emptyCounts).filter(([, count]) => count > 0);
  check(
    "a fresh deployment starts genuinely empty and every core table is readable",
    dirty.length === 0,
    dirty.length ? `NOT EMPTY: ${dirty.map(([k, v]) => `${k}=${v}`).join(", ")}` : "organizations, patients, appointments and audit all readable and at zero",
  );

  // --- 6. the first real work of a new deployment succeeds -----------------
  // Migrations that apply but cannot carry a write are still a broken deployment.
  const org = await db.organization.create({
    data: { name: "MVP Fresh Clinic", slug: SLUG, clinicType: "medspa", status: "active" },
    select: { id: true },
  });
  const patient = await db.patient.create({
    data: {
      organizationId: org.id, mrn: "MRN-FRESH-1", firstName: "First", lastName: "Patient",
      dateOfBirth: new Date("1991-07-07"), status: "active",
    },
    select: { id: true },
  });
  const startsAt = new Date(Date.now() + 24 * 3600 * 1000);
  await db.appointment.create({
    data: {
      organizationId: org.id, patientId: patient.id, startsAt,
      endsAt: new Date(startsAt.getTime() + 3600 * 1000),
      status: "CONFIRMED", formsComplete: false, insuranceVerified: false,
    },
  });
  const sweep = await runFollowUpSweep(org.id);
  const actions = await listOperationalActions(org.id);
  check(
    "a brand-new deployment can take its first patient, appointment and operational work",
    sweep.risksDetected > 0 && actions.length > 0,
    `risks=${sweep.risksDetected} actions=${actions.length} (${[...new Set(actions.map((a) => a.actionKind))].join(", ")})`,
  );

  // --- 7. work written on a fresh schema is auditable ---------------------
  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  check(
    "the audit trail works on a schema built from migrations alone",
    audits > 0,
    `${audits} audit records written against the freshly migrated schema`,
  );

  // --- 8. a restart sees the same data ------------------------------------
  // A second client is what a restarted process, or a second replica, actually looks
  // like from the database's side.
  const afterRestart = new PrismaClient();
  const survived = await afterRestart.organization.findFirst({ where: { slug: SLUG }, select: { id: true } });
  const actionsAfterRestart = await listOperationalActions(org.id);
  await afterRestart.$disconnect();
  check(
    "a restart reconnects and finds the work still there",
    survived?.id === org.id && actionsAfterRestart.length === actions.length,
    `organization ${survived?.id === org.id ? "found" : "LOST"}, ${actionsAfterRestart.length} operational actions still present`,
  );

  // Leave the scratch database as we found it.
  await db.$executeRawUnsafe(`DELETE FROM "operational_actions" WHERE "organizationId" = $1`, org.id);
  await db.task.deleteMany({ where: { organizationId: org.id } }).catch(() => {});
  await db.appointment.deleteMany({ where: { organizationId: org.id } });
  await db.auditLog.deleteMany({ where: { organizationId: org.id } });
  await db.patient.deleteMany({ where: { organizationId: org.id } });
  await db.organization.deleteMany({ where: { id: org.id } });
  await db.$disconnect();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} fresh deploy journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
