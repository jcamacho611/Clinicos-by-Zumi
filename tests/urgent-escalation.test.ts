import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();
const findUsers = vi.fn();
const countUsers = vi.fn();
const notifyMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    escalation: { findFirst: (...args: unknown[]) => findFirst(...args), create: (...args: unknown[]) => create(...args) },
    user: { findMany: (...args: unknown[]) => findUsers(...args), count: (...args: unknown[]) => countUsers(...args) },
    notification: { createMany: (...args: unknown[]) => notifyMany(...args) },
  },
}));

const { describeUrgentHandoff, recordUrgentSignalEscalation, URGENT_SIGNAL_SOURCE_TYPE } =
  await import("@/lib/safety/urgent-escalation-repository");

const session = {
  sessionId: "s1",
  userId: "user-1",
  organizationId: "org-1",
  organizationName: "Northgate",
  organizationSlug: "northgate",
  email: "owner@example.test",
  name: "Nadja Owner",
  role: "clinic_owner",
  demo: true,
  expiresAt: Date.now() + 60_000,
} as Parameters<typeof recordUrgentSignalEscalation>[0];

beforeEach(() => {
  findFirst.mockReset();
  create.mockReset();
  findUsers.mockReset();
  notifyMany.mockReset();
  countUsers.mockReset();
  findUsers.mockResolvedValue([{ id: "owner-1" }, { id: "provider-1" }]);
  countUsers.mockResolvedValue(2);
  notifyMany.mockResolvedValue({ count: 2 });
});

describe("urgent signal escalation", () => {
  it("opens an urgent review a person is responsible for", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    const outcome = await recordUrgentSignalEscalation(session, "life_threatening");

    expect(outcome).toEqual({ recorded: true, escalationId: "esc-1", alreadyOpen: false, visibleToSomeone: true });

    const written = create.mock.calls[0][0].data;
    expect(written.organizationId).toBe("org-1");
    expect(written.sourceType).toBe(URGENT_SIGNAL_SOURCE_TYPE);
    expect(written.riskLevel).toBe("URGENT");
    expect(written.requiresHumanReview).toBe(true);
    expect(written.status).toBe("open");
  });

  it("asserts no patient, because the person typing may not be the person in difficulty", () => {
    // Guessing a patient attaches an emergency to the wrong chart.
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    return recordUrgentSignalEscalation(session, "life_threatening").then(() => {
      expect(create.mock.calls[0][0].data.patientId).toBeNull();
    });
  });

  it("records that a signal happened, not what was said", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    await recordUrgentSignalEscalation(session, "self_harm");
    const written = create.mock.calls[0][0].data;

    // The model has no field designed for patient-typed prose. Nothing written here
    // should be able to carry a sentence someone typed.
    expect(written.category).toBe("self_harm");
    expect(Object.values(written)).not.toContainEqual(expect.stringContaining("kill myself"));
    expect(written.resolution).toBeUndefined();
  });

  it("joins an escalation already open instead of burying the queue", async () => {
    // Someone in distress may send several messages. One open item, not five.
    findFirst.mockResolvedValue({ id: "esc-existing" });

    const outcome = await recordUrgentSignalEscalation(session, "life_threatening");

    expect(outcome).toEqual({ recorded: true, escalationId: "esc-existing", alreadyOpen: true, visibleToSomeone: true });
    expect(create).not.toHaveBeenCalled();
  });

  /**
   * The rule that matters most: a database problem must never be able to withhold
   * "call 911".
   */
  it("never throws when the database is unreachable", async () => {
    findFirst.mockRejectedValue(new Error("connection refused"));

    await expect(recordUrgentSignalEscalation(session, "life_threatening")).resolves.toEqual({
      recorded: false,
      reason: "unavailable",
    });
  });
});

describe("reaching someone who is not looking at the queue", () => {
  it("notifies active owners and providers about a life-threatening signal", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    await recordUrgentSignalEscalation(session, "life_threatening");

    expect(findUsers.mock.calls[0][0].where.roleKey.in).toEqual(["clinic_owner", "provider"]);
    expect(findUsers.mock.calls[0][0].where.status).toBe("active");
    expect(notifyMany).toHaveBeenCalledTimes(1);
    expect(notifyMany.mock.calls[0][0].data).toHaveLength(2);
  });

  it("carries no name, no patient, and nothing that was typed", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    await recordUrgentSignalEscalation(session, "life_threatening");
    const notification = notifyMany.mock.calls[0][0].data[0];

    expect(notification.body).not.toContain("Nadja");
    expect(notification.body).toContain("nobody has been contacted");
    expect(notification.title).not.toMatch(/\b(?:alerted|notified|on the way)\b/i);
  });

  /**
   * A deliberate exception, not an oversight. The person typing is a member of staff,
   * and broadcasting that a named colleague may be suicidal has employment and stigma
   * consequences nobody consented to. The escalation still exists and still surfaces.
   */
  it("does not broadcast a self-harm signal to every owner and provider", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    const outcome = await recordUrgentSignalEscalation(session, "self_harm");

    expect(outcome).toMatchObject({ recorded: true });
    expect(create).toHaveBeenCalledTimes(1);
    expect(notifyMany).not.toHaveBeenCalled();
  });

  it("does not re-notify when joining an escalation already open", async () => {
    findFirst.mockResolvedValue({ id: "esc-existing" });

    await recordUrgentSignalEscalation(session, "life_threatening");

    expect(notifyMany).not.toHaveBeenCalled();
  });

  it("still reports the escalation as recorded when notification fails", async () => {
    // The escalation already exists by then. Reporting it as unrecorded would be worse.
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });
    notifyMany.mockRejectedValue(new Error("notification table unavailable"));

    await expect(recordUrgentSignalEscalation(session, "life_threatening")).resolves.toEqual({
      recorded: true,
      escalationId: "esc-1",
      alreadyOpen: false,
      visibleToSomeone: true,
    });
  });
});

describe("an escalation nobody can see", () => {
  /**
   * Created by restricting who may see a self-harm signal. A record with no audience is
   * not a handoff, and telling the person a review exists would be true and useless.
   */
  it("checks only the restricted roles for a self-harm signal", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    await recordUrgentSignalEscalation(session, "self_harm");

    expect(countUsers.mock.calls[0][0].where.roleKey.in).toEqual([
      "clinic_owner",
      "administrator",
      "provider",
    ]);
  });

  it("does not restrict the check for a life-threatening signal, which the whole queue can see", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    await recordUrgentSignalEscalation(session, "life_threatening");

    expect(countUsers.mock.calls[0][0].where.roleKey).toBeUndefined();
    expect(countUsers.mock.calls[0][0].where.status).toBe("active");
  });

  it("stops promising a review when nobody at the clinic can open it", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });
    countUsers.mockResolvedValue(0);

    const outcome = await recordUrgentSignalEscalation(session, "self_harm");

    expect(outcome).toMatchObject({ recorded: true, visibleToSomeone: false });
    const sentence = describeUrgentHandoff(outcome);
    expect(sentence).toContain("nobody at this clinic is set up to see it");
    expect(sentence).toContain("Tell someone directly");
  });

  it("assumes someone can see it when the check itself fails", async () => {
    // This only decides how confidently Klinikos describes the handoff. A database
    // hiccup should not become an alarming claim about the clinic's setup.
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });
    countUsers.mockRejectedValue(new Error("unavailable"));

    await expect(recordUrgentSignalEscalation(session, "self_harm")).resolves.toMatchObject({
      visibleToSomeone: true,
    });
  });
});

describe("what Klinikos says it did", () => {
  it("never claims a person was contacted", () => {
    for (const outcome of [
      { recorded: true, escalationId: "e", alreadyOpen: false, visibleToSomeone: true },
      { recorded: true, escalationId: "e", alreadyOpen: true, visibleToSomeone: true },
      { recorded: true, escalationId: "e", alreadyOpen: false, visibleToSomeone: false },
      { recorded: false, reason: "unavailable" },
    ] as const) {
      const sentence = describeUrgentHandoff(outcome);
      expect(sentence).not.toMatch(/\b(?:we|staff|someone|a nurse|a doctor) (?:have|has) been (?:alerted|notified|contacted)\b/i);
      expect(sentence).not.toMatch(/\bhelp is on the way\b/i);
    }
  });

  it("says plainly when no review was opened, and tells the person what to do instead", () => {
    const sentence = describeUrgentHandoff({ recorded: false, reason: "unavailable" });
    expect(sentence).toContain("could not open a review");
    expect(sentence).toContain("tell someone directly");
  });

  it("distinguishes a queue item from a human response", () => {
    const sentence = describeUrgentHandoff({ recorded: true, escalationId: "e", alreadyOpen: false, visibleToSomeone: true });
    expect(sentence).toContain("queue item, not a person who has been contacted");
  });
});

describe("the authenticated surfaces open the review", () => {
  const pathsRoute = readFileSync(join(process.cwd(), "src/app/api/paths/route.ts"), "utf8");
  const authedZumi = readFileSync(join(process.cwd(), "src/app/api/zumi/route.ts"), "utf8");
  const publicZumi = readFileSync(join(process.cwd(), "src/app/api/zumi/public/route.ts"), "utf8");

  it("records an escalation from Living Home and the authenticated conversation", () => {
    expect(pathsRoute).toContain("recordUrgentSignalEscalation(session, urgent.category)");
    expect(authedZumi).toContain("recordUrgentSignalEscalation(session, urgent.category)");
  });

  it("does not attempt one from the public conversation", () => {
    // An anonymous visitor belongs to no clinic. There is no organization to open a
    // review in, and inventing one would put an emergency in a stranger's queue.
    expect(publicZumi).not.toContain("recordUrgentSignalEscalation");
  });
});
