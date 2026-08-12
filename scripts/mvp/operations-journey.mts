/**
 * MVP Journey 2 — the clinic operations loop, against a real database.
 *
 *   PATIENT -> APPOINTMENT -> MISSING REQUIREMENT -> DETECTION -> INTERNAL TASK
 *   -> EXTERNAL FOLLOW-UP PREPARED -> TRUTHFUL CONNECTOR STATE -> RESOLUTION
 *
 * The property that matters most here is the one the constitution calls Article 9: a
 * database write is not a real-world outcome. With no messaging connector configured,
 * a patient message must read as prepared or waiting — never as sent.
 */
import { PrismaClient } from "@prisma/client";
import { runFollowUpSweep, listOperationalActions, patientMessageDeliverability } from "@/lib/operations/followup-service";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-ops-clinic";

async function reset() {
  const orgs = await db.organization.findMany({ where: { slug: SLUG }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  if (!ids.length) return;
  // operational_actions is a raw-SQL table with no Prisma model.
  await db.$executeRawUnsafe(`DELETE FROM "operational_actions" WHERE "organizationId" = ANY($1)`, ids);
  await db.task.deleteMany({ where: { organizationId: { in: ids } } }).catch(() => {});
  await db.appointment.deleteMany({ where: { organizationId: { in: ids } } });
  await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
  await db.patient.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();
  const org = await db.organization.create({
    data: { name: "MVP Ops Clinic", slug: SLUG, clinicType: "medspa", status: "active" },
    select: { id: true, name: true },
  });
  const patient = await db.patient.create({
    data: {
      organizationId: org.id, mrn: "MRN-OPS-1", firstName: "Ops", lastName: "Patient",
      dateOfBirth: new Date("1988-05-05"), status: "active",
    },
    select: { id: true },
  });

  // An appointment tomorrow with intake incomplete and insurance unverified: exactly the
  // condition the loop exists to notice.
  const startsAt = new Date(Date.now() + 24 * 3600 * 1000);
  await db.appointment.create({
    data: {
      organizationId: org.id, patientId: patient.id, startsAt,
      endsAt: new Date(startsAt.getTime() + 3600 * 1000),
      status: "CONFIRMED", formsComplete: false, insuranceVerified: false,
    },
  });

  // --- 1. detection --------------------------------------------------------
  const sweep = await runFollowUpSweep(org.id);
  check(
    "an at-risk appointment is detected deterministically",
    sweep.risksDetected > 0,
    `risks=${sweep.risksDetected} executed=${sweep.actionsExecuted} awaitingYou=${sweep.actionsAwaitingYou} blocked=${sweep.actionsBlocked}`,
  );

  // --- 2. the loop produced real work -------------------------------------
  const actions = await listOperationalActions(org.id);
  check(
    "detection produces operational actions scoped to this organization",
    actions.length > 0,
    `${actions.length} actions: ${[...new Set(actions.map((a) => a.actionKind))].join(", ")}`,
  );

  // --- 3. no connector means nothing may claim to be sent -----------------
  const deliverability = patientMessageDeliverability({});
  const messages = actions.filter((a) => a.actionKind === "patient_message");
  const internal = actions.filter((a) => a.actionKind === "internal_task");
  // An internal task that executed is a truthful claim: a Task row really was created.
  // A patient message is the one that must not overclaim while no rail exists.
  const messageOverclaims = messages.some((a) => /^(sent|delivered|executed)$/i.test(String(a.state)));
  check(
    "with no messaging connector, no patient message claims to have been sent",
    !deliverability.deliverable && !messageOverclaims,
    `deliverable=${deliverability.deliverable} reason=${"reason" in deliverability ? deliverability.reason : "n/a"} ` +
      `messages=[${messages.map((a) => a.state).join(", ")}] internal=[${internal.map((a) => a.state).join(", ")}]`,
  );

  // --- 4. rerunning must not duplicate work -------------------------------
  const before = actions.length;
  await runFollowUpSweep(org.id);
  const afterActions = await listOperationalActions(org.id);
  check(
    "re-running the sweep does not duplicate actions",
    afterActions.length === before,
    `${before} before, ${afterActions.length} after a second sweep`,
  );

  // --- 5. resolving the underlying cause clears the work ------------------
  await db.appointment.updateMany({
    where: { organizationId: org.id },
    data: { formsComplete: true, insuranceVerified: true },
  });
  await runFollowUpSweep(org.id);
  const resolved = await listOperationalActions(org.id);
  const openAfterFix = resolved.filter((a) => !["resolved_by_source", "dismissed", "executed"].includes(String(a.state)));
  check(
    "resolving the real-world cause closes the action",
    openAfterFix.length < before,
    `${before} open before the fix, ${openAfterFix.length} open after`,
  );

  // --- 6. the loop is auditable -------------------------------------------
  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  check(
    "the loop leaves an audit trail",
    audits > 0,
    `${audits} audit records — the loop creates tasks and prepares patient messages, both of which are attributable actions under Article 8`,
  );

  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} operations journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
