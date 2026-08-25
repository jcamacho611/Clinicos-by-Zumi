import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { escalation: { findFirst: (...args: unknown[]) => findFirst(...args), create: (...args: unknown[]) => create(...args) } },
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
});

describe("urgent signal escalation", () => {
  it("opens an urgent review a person is responsible for", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "esc-1" });

    const outcome = await recordUrgentSignalEscalation(session, "life_threatening");

    expect(outcome).toEqual({ recorded: true, escalationId: "esc-1", alreadyOpen: false });

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

    expect(outcome).toEqual({ recorded: true, escalationId: "esc-existing", alreadyOpen: true });
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

describe("what Klinikos says it did", () => {
  it("never claims a person was contacted", () => {
    for (const outcome of [
      { recorded: true, escalationId: "e", alreadyOpen: false },
      { recorded: true, escalationId: "e", alreadyOpen: true },
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
    const sentence = describeUrgentHandoff({ recorded: true, escalationId: "e", alreadyOpen: false });
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
