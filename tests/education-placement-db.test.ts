import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  acceptPlacementHours,
  activateClinicalPlacement,
  assignClinicalPlacement,
  createClinicalPlacementRecord,
  decidePlacementApproval,
  getClinicalPlacementProgress,
  submitPlacementHours,
  attestPlacementHours,
} from "@/lib/edu/placement-repository";

const suffix = "placement_20260830";
const learnerPersonId = `person_learner_${suffix}`;
const preceptorPersonId = `person_preceptor_${suffix}`;
const approverPersonId = `person_approver_${suffix}`;
const institutionId = `edu_inst_${suffix}`;
const programId = `edu_program_${suffix}`;
const courseId = `edu_course_${suffix}`;
const cohortId = `edu_cohort_${suffix}`;
const enrollmentId = `edu_enrollment_${suffix}`;
const siteOrganizationId = `org_site_${suffix}`;
const siteLocationId = `location_site_${suffix}`;

beforeAll(async () => {
  await db.person.createMany({
    data: [
      { id: learnerPersonId, displayName: "Learner One", primaryEmail: `learner-${suffix}@example.test` },
      { id: preceptorPersonId, displayName: "Preceptor One", primaryEmail: `preceptor-${suffix}@example.test` },
      { id: approverPersonId, displayName: "Approver One", primaryEmail: `approver-${suffix}@example.test` },
    ],
    skipDuplicates: true,
  });

  await db.organization.create({
    data: {
      id: siteOrganizationId,
      name: "Placement Site",
      slug: `placement-site-${suffix}`,
      clinicType: "clinic",
    },
  });
  await db.location.create({
    data: {
      id: siteLocationId,
      organizationId: siteOrganizationId,
      name: "Placement Site Main",
    },
  });

  await db.educationInstitution.create({
    data: {
      id: institutionId,
      name: "Placement School",
      slug: `placement-school-${suffix}`,
      institutionType: "college",
    },
  });
  await db.educationProgram.create({
    data: {
      id: programId,
      institutionId,
      name: "Nursing Program",
      programType: "nursing",
    },
  });
  await db.educationCourse.create({
    data: {
      id: courseId,
      institutionId,
      programId,
      title: "Clinical Practicum",
      code: `CLIN-${suffix}`,
      status: "published",
    },
  });
  await db.educationCohort.create({
    data: {
      id: cohortId,
      institutionId,
      courseId,
      name: "Fall Placement Cohort",
      status: "open",
    },
  });
  await db.educationEnrollment.create({
    data: {
      id: enrollmentId,
      institutionId,
      cohortId,
      studentEmail: `learner-${suffix}@example.test`,
      studentDisplayName: "Learner One",
      status: "active",
    },
  });

  await db.personRelationship.create({
    data: {
      personId: learnerPersonId,
      relationshipType: "learner",
      verificationState: "verified",
      domainKind: "education_enrollment",
      domainRecordId: enrollmentId,
      sourceType: "education",
      sourceReference: enrollmentId,
    },
  });
});

afterAll(async () => {
  await db.placementHourEntry.deleteMany({ where: { placement: { learnerPersonId } } });
  await db.placementApproval.deleteMany({ where: { placement: { learnerPersonId } } });
  await db.educationPlacement.deleteMany({ where: { learnerPersonId } });
  await db.personRelationship.deleteMany({ where: { personId: { in: [learnerPersonId, preceptorPersonId, approverPersonId] } } });
  await db.educationEnrollment.deleteMany({ where: { id: enrollmentId } });
  await db.educationCohort.deleteMany({ where: { id: cohortId } });
  await db.educationCourse.deleteMany({ where: { id: courseId } });
  await db.educationProgram.deleteMany({ where: { id: programId } });
  await db.educationInstitution.deleteMany({ where: { id: institutionId } });
  await db.location.deleteMany({ where: { id: siteLocationId } });
  await db.organization.deleteMany({ where: { id: siteOrganizationId } });
  await db.person.deleteMany({ where: { id: { in: [learnerPersonId, preceptorPersonId, approverPersonId] } } });
});

describe("durable clinical placement lifecycle", () => {
  it("keeps Grid matching separate from school, site, and preceptor approval and assignment", async () => {
    const placement = await createClinicalPlacementRecord({
      learnerPersonId,
      enrollmentId,
      institutionId,
      programId,
      gridDemandId: "grid-demand-placement-1",
      requiredMinutes: 120 * 60,
      matchedPreceptorPersonId: preceptorPersonId,
      siteOrganizationId,
      siteLocationId,
      matchedAt: new Date("2026-08-30T13:00:00.000Z"),
    });

    expect(placement.status).toBe("matched");
    expect(placement.grantsProfessionalAuthority).toBe(false);

    await expect(
      assignClinicalPlacement({
        placementId: placement.id,
        assignedByPersonId: approverPersonId,
        assignedAt: new Date("2026-08-30T13:10:00.000Z"),
      }),
    ).rejects.toThrow("school, site, and preceptor approvals are required");

    for (const approvalType of ["school", "site", "preceptor"] as const) {
      await decidePlacementApproval({
        placementId: placement.id,
        approvalType,
        decision: "approved",
        decidedByPersonId: approvalType === "preceptor" ? preceptorPersonId : approverPersonId,
        evidenceReference: `placement-evidence://${approvalType}`,
        decidedAt: new Date("2026-08-30T13:20:00.000Z"),
      });
    }

    const assigned = await assignClinicalPlacement({
      placementId: placement.id,
      assignedByPersonId: approverPersonId,
      assignedAt: new Date("2026-08-30T13:30:00.000Z"),
    });
    expect(assigned.status).toBe("assigned");

    const progress = await getClinicalPlacementProgress(placement.id);
    expect(progress.approvals).toMatchObject({ school: "approved", site: "approved", preceptor: "approved" });
    expect(progress.canAssign).toBe(true);
    expect(progress.grantsProfessionalAuthority).toBe(false);
  });

  it("does not accept supervised hours before assignment becomes active", async () => {
    const placement = await db.educationPlacement.findFirstOrThrow({ where: { learnerPersonId } });

    await expect(
      submitPlacementHours({
        placementId: placement.id,
        learnerPersonId,
        serviceDate: new Date("2026-09-01T00:00:00.000Z"),
        minutes: 480,
        activity: "Primary care clinical shift",
        submittedAt: new Date("2026-09-01T22:00:00.000Z"),
      }),
    ).rejects.toThrow("placement must be active before hours can be submitted");

    await activateClinicalPlacement({
      placementId: placement.id,
      activatedByPersonId: approverPersonId,
      startedAt: new Date("2026-09-01T08:00:00.000Z"),
    });
  });

  it("counts only preceptor-attested and institution-accepted minutes toward completion", async () => {
    const placement = await db.educationPlacement.findFirstOrThrow({ where: { learnerPersonId } });

    const entry = await submitPlacementHours({
      placementId: placement.id,
      learnerPersonId,
      serviceDate: new Date("2026-09-01T00:00:00.000Z"),
      minutes: 480,
      activity: "Primary care clinical shift",
      submittedAt: new Date("2026-09-01T22:00:00.000Z"),
    });

    let progress = await getClinicalPlacementProgress(placement.id);
    expect(progress.submittedMinutes).toBe(480);
    expect(progress.acceptedMinutes).toBe(0);

    await attestPlacementHours({
      entryId: entry.id,
      preceptorPersonId,
      attestedAt: new Date("2026-09-02T09:00:00.000Z"),
    });
    progress = await getClinicalPlacementProgress(placement.id);
    expect(progress.attestedMinutes).toBe(480);
    expect(progress.acceptedMinutes).toBe(0);

    await acceptPlacementHours({
      entryId: entry.id,
      acceptedByPersonId: approverPersonId,
      acceptedAt: new Date("2026-09-02T12:00:00.000Z"),
    });
    progress = await getClinicalPlacementProgress(placement.id);
    expect(progress.acceptedMinutes).toBe(480);
    expect(progress.remainingMinutes).toBe(120 * 60 - 480);
    expect(progress.complete).toBe(false);
    expect(progress.grantsProfessionalAuthority).toBe(false);
  });
});
