import { describe, expect, it } from "vitest";

import {
  canManageWorkforceSession,
  canSubmitWorkforceSurveyKind,
  canVerifyWorkforceAttendance,
  isVerifiedAttendanceRecord,
  summarizeAttendanceRecords,
} from "@/lib/edu/workforce-delivery-records";

describe("workforce delivery record policy", () => {
  it("limits session management to instructors and admins", () => {
    expect(canManageWorkforceSession("edu_admin")).toBe(true);
    expect(canManageWorkforceSession("edu_instructor")).toBe(true);
    expect(canManageWorkforceSession("edu_assistant")).toBe(false);
    expect(canManageWorkforceSession("edu_student")).toBe(false);
    expect(canManageWorkforceSession("edu_observer")).toBe(false);
  });

  it("limits final attendance verification to instructors and admins", () => {
    expect(canVerifyWorkforceAttendance("edu_admin")).toBe(true);
    expect(canVerifyWorkforceAttendance("edu_instructor")).toBe(true);
    expect(canVerifyWorkforceAttendance("edu_assistant")).toBe(false);
  });

  it("does not let a learner impersonate instructor or employer feedback", () => {
    expect(canSubmitWorkforceSurveyKind("edu_student", "participant")).toBe(true);
    expect(canSubmitWorkforceSurveyKind("edu_student", "follow_up")).toBe(true);
    expect(canSubmitWorkforceSurveyKind("edu_student", "instructor")).toBe(false);
    expect(canSubmitWorkforceSurveyKind("edu_student", "employer")).toBe(false);
    expect(canSubmitWorkforceSurveyKind("edu_instructor", "instructor")).toBe(true);
    expect(canSubmitWorkforceSurveyKind("edu_admin", "employer")).toBe(true);
  });

  it("does not treat unverified presence as verified attendance", () => {
    expect(isVerifiedAttendanceRecord({ status: "present", verifiedAt: null })).toBe(false);
    expect(isVerifiedAttendanceRecord({ status: "unverified", verifiedAt: new Date("2026-09-30T12:00:00Z") })).toBe(false);
    expect(isVerifiedAttendanceRecord({ status: "present", verifiedAt: new Date("2026-09-30T12:00:00Z") })).toBe(true);
    expect(isVerifiedAttendanceRecord({ status: "partial", verifiedAt: new Date("2026-09-30T12:00:00Z") })).toBe(true);
  });

  it("summarizes only explicit verified attendance evidence", () => {
    expect(summarizeAttendanceRecords([
      { status: "present", verifiedAt: new Date("2026-09-30T12:00:00Z") },
      { status: "partial", verifiedAt: new Date("2026-09-30T12:01:00Z") },
      { status: "absent", verifiedAt: new Date("2026-09-30T12:02:00Z") },
      { status: "present", verifiedAt: null },
    ])).toEqual({ records: 4, verifiedAttended: 2, verifiedAbsent: 1, unverified: 1 });
  });
});
