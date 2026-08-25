import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  describeUrgentHandoff,
  recordUrgentSignalEscalation,
} from "@/lib/safety/urgent-escalation-repository";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import type { ClinicSession } from "@/lib/auth/types";

/**
 * The urgent-signal path, exercised against a real PostgreSQL database.
 *
 * Every other test for this code mocks the Prisma client. That covers query shape and
 * failure handling and proves nothing about what actually lands in a table — and the
 * parts most worth being sure of are exactly the parts a mock cannot show: that the
 * notification really reaches owners and providers and really does not reach a biller,
 * and that the role filter really hides a colleague's self-harm signal from the people
 * it is meant to hide it from.
 *
 * Skipped unless a disposable database is named, so the ordinary suite still runs with
 * no database at all.
 *
 *   createdb klinikos_verify
 *   npx prisma migrate deploy   # with DATABASE_URL pointing at it
 *   KLINIKOS_DISPOSABLE_DATABASE_URL=postgresql://…/klinikos_verify \
 *     npx vitest run tests/integration
 *
 * The variable is named for what it must be. This creates and deletes an organization
 * and its users, so pointing it at anything that matters would destroy real records —
 * the guard below refuses the most obvious ways to do that by accident, and cannot
 * catch every one.
 */
const disposableUrl = process.env.KLINIKOS_DISPOSABLE_DATABASE_URL;

function refuseNonDisposable(url: string) {
  const looksProduction = /prod|live|klinikos\.io|neon\.tech|amazonaws|render\.com|supabase/i.test(url);
  if (looksProduction) {
    throw new Error(
      "KLINIKOS_DISPOSABLE_DATABASE_URL looks like a hosted or production database. This test creates and deletes records. Point it at a throwaway local database.",
    );
  }
}

describe.skipIf(!disposableUrl)("urgent escalation against a real database", () => {
  it("writes, notifies and filters the way the mocked tests only assert", async () => {
    refuseNonDisposable(disposableUrl!);

    const failures: string[] = [];
    const check = (label: string, ok: boolean, detail = "") => {
      if (!ok) failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    };

    const org = await db.organization.create({
      data: { name: "Escalation Verify", slug: `verify-${Date.now()}`, clinicType: "primary_care" },
    });

    try {
      const stamp = Date.now();
      const [owner, provider, biller] = await Promise.all([
        db.user.create({ data: { organizationId: org.id, email: `owner-${stamp}@verify.test`, name: "Owner", roleKey: "clinic_owner" } }),
        db.user.create({ data: { organizationId: org.id, email: `prov-${stamp}@verify.test`, name: "Provider", roleKey: "provider" } }),
        db.user.create({ data: { organizationId: org.id, email: `bill-${stamp}@verify.test`, name: "Biller", roleKey: "biller" } }),
      ]);

      const session = (role: string, userId: string) =>
        ({
          sessionId: "s", userId, organizationId: org.id, organizationName: org.name,
          organizationSlug: org.slug, email: "x@verify.test", name: "Tester", role,
          demo: true, expiresAt: Date.now() + 60_000,
        }) as ClinicSession;

      // A life-threatening signal opens one urgent review and tells the people who can act.
      const lifeThreatening = await recordUrgentSignalEscalation(session("clinic_owner", owner.id), "life_threatening");
      check("life-threatening escalation recorded", lifeThreatening.recorded);
      check("reports a viewer exists", lifeThreatening.recorded && lifeThreatening.visibleToSomeone);

      const rows = await db.escalation.findMany({ where: { organizationId: org.id } });
      check("one escalation row", rows.length === 1, `got ${rows.length}`);
      check("risk level URGENT", rows[0]?.riskLevel === "URGENT", String(rows[0]?.riskLevel));
      check("status open", rows[0]?.status === "open");
      check("no patient asserted", rows[0]?.patientId === null);
      check("source is the person who typed", rows[0]?.sourceId === owner.id);

      const notified = await db.notification.findMany({ where: { organizationId: org.id, type: "urgent_signal" } });
      check("owner and provider notified", notified.length === 2, `got ${notified.length}`);
      check("biller not notified", !notified.some((entry) => entry.userId === biller.id));

      // A second message inside the window joins the open review rather than burying it.
      const repeat = await recordUrgentSignalEscalation(session("clinic_owner", owner.id), "life_threatening");
      check("repeat joins the open escalation", repeat.recorded && repeat.alreadyOpen);
      check("still one escalation row", (await db.escalation.count({ where: { organizationId: org.id } })) === 1);
      check("no re-notification", (await db.notification.count({ where: { organizationId: org.id, type: "urgent_signal" } })) === 2);

      // Self-harm is recorded and deliberately not broadcast.
      const selfHarm = await recordUrgentSignalEscalation(session("provider", provider.id), "self_harm");
      check("self-harm escalation recorded", selfHarm.recorded);
      check("self-harm row exists", (await db.escalation.count({ where: { organizationId: org.id, category: "self_harm" } })) === 1);
      check("self-harm did not broadcast", (await db.notification.count({ where: { organizationId: org.id, type: "urgent_signal" } })) === 2);

      // The part a mock cannot prove: who the query actually returns it to.
      const ownerView = await listCareCoordinationWorkspace(org.id, owner.id, "clinic_owner");
      const billerView = await listCareCoordinationWorkspace(org.id, biller.id, "biller");
      const noRoleView = await listCareCoordinationWorkspace(org.id, biller.id);
      const hasSelfHarm = (view: { escalations: Array<{ category: string }> }) =>
        view.escalations.some((entry) => entry.category === "self_harm");

      check("owner sees the self-harm escalation", hasSelfHarm(ownerView));
      check("biller does not", !hasSelfHarm(billerView));
      check("absent role fails closed", !hasSelfHarm(noRoleView));
      check(
        "biller still sees the life-threatening one",
        billerView.escalations.some((entry) => entry.category === "life_threatening"),
      );

      // Waiting is computed from real timestamps rather than a fixture.
      const waiting = ownerView.escalations[0]?.waiting;
      check("waiting computed", Boolean(waiting));
      check("a new urgent item is not yet overdue", waiting?.state === "waiting", waiting?.state);

      check(
        "handoff never claims contact",
        !/\b(?:alerted|notified)\b/i.test(describeUrgentHandoff(lifeThreatening)),
        describeUrgentHandoff(lifeThreatening),
      );

      expect(failures, `real-database checks failed:\n${failures.join("\n")}`).toEqual([]);
    } finally {
      // Cascades to users, escalations and notifications.
      await db.organization.delete({ where: { id: org.id } }).catch(() => undefined);
    }
  }, 120_000);
});
