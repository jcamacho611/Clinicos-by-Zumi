import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTOMATION_POLICY,
  detectRisks,
  detectRisksAcross,
  initialActionState,
  prepareActions,
  resolveAutomationLevel,
  riskKinds,
  streamForState,
  type AppointmentSnapshot,
} from "@/lib/operations/followup-rules";
import { outboundChannelStatus } from "@/lib/communications/outbound";
import { patientMessageDeliverability } from "@/lib/operations/followup-service";

const NOW = new Date("2026-08-12T14:00:00Z");
const inHours = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000);
const appointment = (overrides: Partial<AppointmentSnapshot> = {}): AppointmentSnapshot => ({
  id: "appt_1",
  patientId: "pat_1",
  startsAt: inHours(24),
  status: "CONFIRMED",
  formsComplete: true,
  insuranceVerified: true,
  ...overrides,
});

describe("appointment-risk detection", () => {
  it("detects separate actionable risks instead of one vague at-risk flag", () => {
    const risks = detectRisks(appointment({ status: "PENDING_CONFIRMATION", formsComplete: false, insuranceVerified: false }), NOW);
    expect(risks.map((risk) => risk.kind).sort()).toEqual(["insurance_unverified", "missing_forms", "unconfirmed"]);
  });

  it("leaves a confirmed prepared appointment alone", () => {
    expect(detectRisks(appointment(), NOW)).toEqual([]);
  });

  it("recovers recent no-shows but does not create stale work forever", () => {
    expect(detectRisks(appointment({ status: "NO_SHOW", startsAt: inHours(-48) }), NOW).map((risk) => risk.kind)).toEqual(["no_show_recovery"]);
    expect(detectRisks(appointment({ status: "NO_SHOW", startsAt: inHours(-400) }), NOW)).toEqual([]);
  });

  it("orders urgent work first", () => {
    const risks = detectRisksAcross([
      appointment({ id: "far", status: "PENDING_CONFIRMATION", startsAt: inHours(70) }),
      appointment({ id: "near", status: "PENDING_CONFIRMATION", startsAt: inHours(4) }),
    ], NOW);
    expect(risks[0]?.appointmentId).toBe("near");
  });

  it("has deliberate behavior for every AppointmentStatus value in the current Prisma schema", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const block = schema.match(/enum AppointmentStatus \{([^}]+)\}/);
    expect(block).toBeTruthy();
    const statuses = (block?.[1] ?? "").split("\n").map((entry) => entry.trim()).filter(Boolean);
    const open = new Set(["REQUESTED", "PENDING_CONFIRMATION", "CONFIRMED"]);

    for (const status of statuses) {
      const startsAt = status === "NO_SHOW" ? inHours(-48) : inHours(24);
      const raised = detectRisks(appointment({ status, startsAt, formsComplete: false }), NOW).length > 0;
      expect({ status, raised }).toEqual({ status, raised: open.has(status) || status === "NO_SHOW" });
    }
  });
});

describe("follow-up automation policy", () => {
  const risk = detectRisks(appointment({ status: "PENDING_CONFIRMATION" }), NOW)[0]!;
  const [task, message] = prepareActions(risk, "Dana Reyes", "Harbor Clinic");

  it("auto-executes only reversible internal work", () => {
    expect(task.kind).toBe("internal_task");
    expect(task.autoExecutable).toBe(true);
    expect(message.kind).toBe("patient_message");
    expect(message.autoExecutable).toBe(false);
    expect(DEFAULT_AUTOMATION_POLICY).toEqual({ internal_task: "auto_allowed", patient_message: "confirm_required" });
  });

  it("never permits a policy to make patient messaging unattended", () => {
    expect(resolveAutomationLevel("patient_message", { patient_message: "auto_allowed" })).toBe("confirm_required");
    expect(initialActionState(message, true, { patient_message: "auto_allowed" })).toBe("awaiting_confirmation");
  });

  it("records the honest state when a message cannot leave Klinikos", () => {
    expect(initialActionState(task, false)).toBe("executed");
    expect(initialActionState(message, false)).toBe("awaiting_connection");
    expect(streamForState("awaiting_connection")).toBe("blocked");
  });

  it("defines an explanation and action plan for every risk kind", () => {
    for (const kind of riskKinds) {
      const detected = { appointmentId: "a", patientId: "p", kind, startsAt: inHours(24), hoursUntil: 24, urgency: 50 };
      expect(prepareActions(detected, "Dana Reyes", "Harbor Clinic").length).toBeGreaterThan(0);
    }
  });
});

describe("outbound delivery truth", () => {
  it("does not mistake missing credentials for a working email sender", () => {
    expect(outboundChannelStatus("email", {})).toMatchObject({ deliverable: false, reason: "no_connector" });
  });

  it("does not mistake API credentials for PHI approval", () => {
    const status = outboundChannelStatus("email", { RESEND_API_KEY: "configured-for-test" });
    expect(status).toMatchObject({ deliverable: true, provider: "resend", connectorId: "resend" });
    expect(patientMessageDeliverability({ RESEND_API_KEY: "configured-for-test" })).toMatchObject({
      deliverable: false,
      reason: "phi_not_approved",
    });
  });
});
