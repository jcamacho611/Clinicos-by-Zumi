import type { EduPlatformRole } from "@/lib/edu/edu-roles";
import type { WorkforceAttendanceStatus } from "@/lib/edu/workforce-delivery-evidence";

export type WorkforceSurveyKind = "participant" | "instructor" | "employer" | "follow_up";

export type WorkforceAttendanceRecordLike = {
  status: WorkforceAttendanceStatus;
  verifiedAt: Date | null;
};

export function canManageWorkforceSession(role: EduPlatformRole) {
  return role === "edu_admin" || role === "edu_instructor";
}

export function canVerifyWorkforceAttendance(role: EduPlatformRole) {
  return role === "edu_admin" || role === "edu_instructor";
}

export function canSubmitWorkforceSurveyKind(role: EduPlatformRole, kind: WorkforceSurveyKind) {
  if (role === "edu_admin") return true;
  if (role === "edu_instructor") return kind === "instructor";
  if (role === "edu_student") return kind === "participant" || kind === "follow_up";
  return false;
}

export function isVerifiedAttendanceRecord(record: WorkforceAttendanceRecordLike) {
  return record.verifiedAt !== null && (record.status === "present" || record.status === "partial");
}

export function summarizeAttendanceRecords(records: readonly WorkforceAttendanceRecordLike[]) {
  let verifiedAttended = 0;
  let verifiedAbsent = 0;
  let unverified = 0;

  for (const record of records) {
    if (isVerifiedAttendanceRecord(record)) {
      verifiedAttended += 1;
      continue;
    }
    if (record.verifiedAt !== null && (record.status === "absent" || record.status === "excused")) {
      verifiedAbsent += 1;
      continue;
    }
    unverified += 1;
  }

  return { records: records.length, verifiedAttended, verifiedAbsent, unverified };
}
