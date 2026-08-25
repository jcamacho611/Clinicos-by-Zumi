import { describe, expect, it } from "vitest";
import { resolveEscalationWaiting } from "@/lib/safety/escalation-waiting";

const NOW = new Date("2026-08-25T12:00:00.000Z");

function minutesAgo(minutes: number) {
  return new Date(NOW.getTime() - minutes * 60_000);
}

describe("escalation waiting", () => {
  it("reports an urgent escalation as overdue once nobody has picked it up in time", () => {
    const waiting = resolveEscalationWaiting({
      status: "open",
      riskLevel: "URGENT",
      createdAt: minutesAgo(20),
      now: NOW,
    });

    expect(waiting.state).toBe("overdue");
    expect(waiting.waitingMinutes).toBe(20);
    expect(waiting.sentence).toContain("Nobody has picked this up yet");
  });

  it("does not call an urgent escalation overdue while it is still inside the window", () => {
    const waiting = resolveEscalationWaiting({
      status: "open",
      riskLevel: "URGENT",
      createdAt: minutesAgo(5),
      now: NOW,
    });

    expect(waiting.state).toBe("waiting");
    expect(waiting.sentence).toBe("Waiting 5 minutes.");
  });

  it("gives lower-risk work longer before it counts as overdue", () => {
    const at90 = { status: "open", createdAt: minutesAgo(90), now: NOW } as const;

    expect(resolveEscalationWaiting({ ...at90, riskLevel: "URGENT" }).state).toBe("overdue");
    expect(resolveEscalationWaiting({ ...at90, riskLevel: "NEEDS_PROVIDER" }).state).toBe("overdue");
    expect(resolveEscalationWaiting({ ...at90, riskLevel: "NEEDS_STAFF" }).state).toBe("waiting");
    expect(resolveEscalationWaiting({ ...at90, riskLevel: "NORMAL" }).state).toBe("waiting");
  });

  it("stops counting against an escalation someone already picked up", () => {
    // Otherwise the queue reports a problem that was already dealt with.
    for (const status of ["acknowledged", "resolved", "reopened"]) {
      const waiting = resolveEscalationWaiting({
        status,
        riskLevel: "URGENT",
        createdAt: minutesAgo(600),
        now: NOW,
      });
      expect(waiting.state, status).toBe("acknowledged");
      expect(waiting.sentence).toBe("Someone has picked this up.");
    }
  });

  it("reads as time rather than as a number someone has to convert", () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [0, "less than a minute"],
      [1, "1 minute"],
      [45, "45 minutes"],
      [60, "1 hour"],
      [61, "1 hour 1 minute"],
      [150, "2 hours 30 minutes"],
    ];

    for (const [minutes, expected] of cases) {
      const waiting = resolveEscalationWaiting({
        status: "open",
        riskLevel: "NORMAL",
        createdAt: minutesAgo(minutes),
        now: NOW,
      });
      expect(waiting.sentence, `${minutes}m`).toContain(expected);
    }
  });

  it("treats an unknown risk level as needing attention rather than ignoring it", () => {
    const waiting = resolveEscalationWaiting({
      status: "open",
      riskLevel: "SOMETHING_NEW",
      createdAt: minutesAgo(120),
      now: NOW,
    });

    expect(waiting.allowedMinutes).toBe(60);
    expect(waiting.state).toBe("overdue");
  });

  it("accepts a serialized timestamp, because that is what the workspace DTO carries", () => {
    const waiting = resolveEscalationWaiting({
      status: "open",
      riskLevel: "URGENT",
      createdAt: minutesAgo(30).toISOString(),
      now: NOW,
    });

    expect(waiting.state).toBe("overdue");
    expect(waiting.waitingMinutes).toBe(30);
  });

  it("never claims anyone was contacted or that a response is coming", () => {
    for (const status of ["open", "acknowledged"]) {
      const sentence = resolveEscalationWaiting({
        status,
        riskLevel: "URGENT",
        createdAt: minutesAgo(45),
        now: NOW,
      }).sentence;

      expect(sentence).not.toMatch(/\b(notified|alerted|contacted|on the way|responding)\b/i);
    }
  });
});
