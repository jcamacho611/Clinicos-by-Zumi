import { describe, expect, it } from "vitest";
import { appointmentEndFromDuration, createAppointmentSchema, intervalsOverlap } from "@/lib/appointment-create-rules";

describe("native appointment creation rules", () => {
  it("accepts a tenant-safe appointment request and rejects malformed timestamps", () => {
    expect(createAppointmentSchema.safeParse({
      patientId: "patient-1",
      providerId: "provider-1",
      locationId: "location-1",
      appointmentTypeId: "type-1",
      startsAt: "2026-08-18T14:00:00.000Z",
      telemedicine: false,
      notes: "Follow-up",
    }).success).toBe(true);

    expect(createAppointmentSchema.safeParse({ patientId: "patient-1", startsAt: "tomorrow morning" }).success).toBe(false);
  });

  it("derives the end time from server-owned duration", () => {
    const start = new Date("2026-08-18T14:00:00.000Z");
    expect(appointmentEndFromDuration(start, 45).toISOString()).toBe("2026-08-18T14:45:00.000Z");
  });

  it("rejects nonsensical appointment durations", () => {
    const start = new Date("2026-08-18T14:00:00.000Z");
    expect(() => appointmentEndFromDuration(start, 0)).toThrow(/between 5 and 480/i);
    expect(() => appointmentEndFromDuration(start, 481)).toThrow(/between 5 and 480/i);
  });

  it("detects true overlaps but allows back-to-back appointments", () => {
    expect(intervalsOverlap(
      "2026-08-18T14:00:00.000Z",
      "2026-08-18T14:30:00.000Z",
      "2026-08-18T14:15:00.000Z",
      "2026-08-18T14:45:00.000Z",
    )).toBe(true);

    expect(intervalsOverlap(
      "2026-08-18T14:00:00.000Z",
      "2026-08-18T14:30:00.000Z",
      "2026-08-18T14:30:00.000Z",
      "2026-08-18T15:00:00.000Z",
    )).toBe(false);
  });
});
