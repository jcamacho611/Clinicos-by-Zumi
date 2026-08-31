import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  acceptPlacementHours,
  activateClinicalPlacement,
  assignClinicalPlacement,
  attestPlacementHours,
  createClinicalPlacementRecord,
  decidePlacementApproval,
  getClinicalPlacementProgress,
  submitPlacementHours,
} from "@/lib/edu/clinical-placement-repository";

const suffix = "clinical_placement_persistence_20260831";
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
let learnerRelationshipId = "";
let preceptorRelationshipId = "";

beforeAll(async () => {
  await db.person.createMany({
    data: [
      {
        id: learnerPersonId,
        displayName: "Learner One",
        primaryEmail: `learner-${suffix}@example.test`,
      },
      {
        id: preceptorPersonId,
        displayName: "Preceptor One",
        primaryEmail: `preceptor-${suffix}@example.test`,
      },
      {
        id: approverPersonId,
        displayName: "Approver One",
        primaryEmail: `approver-${suffix}@example.test`,
      },
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

  const learnerRelationship = await db.personRelationship.create({
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
  learnerRelationshipId = learnerRelationship.id;

  const preceptorRelationship = await db.personRelationship.create({
    data: {
      personId: preceptorPersonId,
      relationshipType: "professional",
      organizationId: siteOrganizationId,
      verificationState: "verified",
      domainKind: "placement_preceptor",
      domainRecordId: preceptorPersonId,
      sourceType: "placement_preflight",
      sourceReference: `preceptor-trace://${preceptorPersonId}`,
    },
  });
  preceptorRelationshipId = preceptorRelationship.id;
});

afterAll(async () => {
  await db.$executeRawUnsafe(`DELETE FROM "placement_hour_events" WHERE "placementId" IN (SELECT "id" FROM "education_placements" WHERE "learnerPersonId" = $1)`, learnerPersonId);
  await db.$executeRawUnsafe(`DELETE FROM "education_placements" WHERE "learnerPersonId" = $1`, learnerPersonId);
  await db.personRelationship.deleteMany({
    where: { personId: { in: [learnerPersonId, preceptorPersonId, approverPersonId] } },
  });
  await db.educationEnrollment.deleteMany({ where: { id: enrollmentId } });
  await db.educationCohort.deleteMany({ where: { id: cohortId } });
  await db.educationCourse.deleteMany({ where: { id: courseId } });
  await db.educationProgram.deleteMany({ where: { id: programId } });
  await db.educationInstitution.deleteMany({ where: { id: institutionId } });
  await db.location.deleteMany({ where: { id: siteLocationId } });
  await db.organization.deleteMany({ where: { id: siteOrganizationId } });
  await db.person.deleteMany({
    where: { id: { in: [learnerPersonId, preceptorPersonId, approverPersonId] } },
  });
});

describe("durable clinical placement persistence", () => {
  it("binds placement to the durable learner Person and existing EDU/site context without creating authority", async () => {
    const placement = await createClinicalPlacementRecord({
      learnerPersonId,
      learnerRelationshipId,
      enrollmentId,
      institutionId,
      programId,
      preceptorPersonId,
      preceptorRelationshipId,
      siteOrganizationId,
      siteLocationId,
      gridDemandId: "grid-demand-placement-1",
      gridOfferId: "grid-offer-placement-1",
      gridCompositionId: "grid-composition-placement-1",
      requiredMinutes: 120 * 60,
      plannedStartAt: new Date("2026-09-01T08:00:00.000Z"),
      plannedEndAt: new Date("2026-12-15T17:00:00.000Z"),
      matchedAt: new Date("2026-08-31T13:00:00.000Z"),
    });

    expect(placement).toMatchObject({
      learnerPersonId,
      enrollmentId,
      institutionId,
      preceptorPersonId,
      siteOrganizationId,
      siteLocationId,
      status: "matched",
      approvals: {
        school: "pending",
        site: "pending",
        preceptor: "pending",
        learner: "pending",
      },
      grantsProfessionalAuthority: false,
      grantsClinicalAuthority: false,
      grantsLicensure: false,
    });
  });

  it("keeps Grid match separate from four governed approvals and assignment", async () => {
    const progress = await getClinicalPlacementProgress({ learnerPersonId });

    await expect(
      assignClinicalPlacement({
        placementId: progress.placement.id,
        assignedByPersonId: approverPersonId,
        assignedAt: new Date("2026-08-31T13:10:00.000Z"),
      }),
    ).rejects.toThrow(/school, site, preceptor, and learner approvals are required/i);

    for (const approvalType of ["school", "site", "preceptor", "learner"] as const) {
      await decidePlacementApproval({
        placementId: progress.placement.id,
        approvalType,
        decision: approvalType === "preceptor" || approvalType === "learner" ? "accepted" : "approved",
        decidedByPersonId:
          approvalType === "preceptor"
            ? preceptorPersonId
            : approvalType === "learner"
              ? learnerPersonId
              : approverPersonId,
        evidenceReference: `placement-evidence://${approvalType}`,
        decidedAt: new Date("2026-08-31T13:20:00.000Z"),
      });
    }

    const assigned = await assignClinicalPlacement({
      placementId: progress.placement.id,
      assignedByPersonId: approverPersonId,
      assignedAt: new Date("2026-08-31T13:30:00.000Z"),
    });

    expect(assigned.status).toBe("approved");
    expect(assigned.assignedAt).toEqual(new Date("2026-08-31T13:30:00.000Z"));

    const afterApproval = await getClinicalPlacementProgress({ placementId: progress.placement.id });
    expect(afterApproval.approvals).toEqual({
      school: "approved",
      site: "approved",
      preceptor: "accepted",
      learner: "accepted",
    });
    expect(afterApproval.canActivate).toBe(true);
    expect(afterApproval.grantsProfessionalAuthority).toBe(false);
  });

  it("does not allow supervised time before the approved placement is active", async () => {
    const progress = await getClinicalPlacementProgress({ learnerPersonId });

    await expect(
      submitPlacementHours({
        placementId: progress.placement.id,
        learnerPersonId,
        serviceDate: new Date("2026-09-01T00:00:00.000Z"),
        minutes: 480,
        activity: "Primary care clinical shift",
        sourceType: "learner_report",
        sourceReference: "placement-hours://shift-1",
        occurredAt: new Date("2026-09-01T22:00:00.000Z"),
      }),
    ).rejects.toThrow(/placement must be active before hours can be submitted/i);

    const active = await activateClinicalPlacement({
      placementId: progress.placement.id,
      activatedByPersonId: approverPersonId,
      startedAt: new Date("2026-09-01T08:00:00.000Z"),
    });

    expect(active.status).toBe("active");
    expect(active.actualStartAt).toEqual(new Date("2026-09-01T08:00:00.000Z"));
  });

  it("derives accepted minutes from append-only reported → attested → accepted event history", async () => {
    const progress = await getClinicalPlacementProgress({ learnerPersonId });

    const reported = await submitPlacementHours({
      placementId: progress.placement.id,
      learnerPersonId,
      serviceDate: new Date("2026-09-01T00:00:00.000Z"),
      minutes: 480,
      activity: "Primary care clinical shift",
      sourceType: "learner_report",
      sourceReference: "placement-hours://shift-1",
      occurredAt: new Date("2026-09-01T22:00:00.000Z"),
    });

    let current = await getClinicalPlacementProgress({ placementId: progress.placement.id });
    expect(current.submittedMinutes).toBe(480);
    expect(current.attestedMinutes).toBe(0);
    expect(current.acceptedMinutes).toBe(0);

    const attested = await attestPlacementHours({
      eventId: reported.id,
      preceptorPersonId,
      evidenceReference: "placement-hours://preceptor-attestation-1",
      occurredAt: new Date("2026-09-02T09:00:00.000Z"),
    });
    expect(attested.supersedesEventId).toBe(reported.id);

    current = await getClinicalPlacementProgress({ placementId: progress.placement.id });
    expect(current.submittedMinutes).toBe(480);
    expect(current.attestedMinutes).toBe(480);
    expect(current.acceptedMinutes).toBe(0);

    const accepted = await acceptPlacementHours({
      eventId: attested.id,
      acceptedByPersonId: approverPersonId,
      evidenceReference: "placement-hours://institution-acceptance-1",
      occurredAt: new Date("2026-09-02T12:00:00.000Z"),
    });
    expect(accepted.supersedesEventId).toBe(attested.id);

    current = await getClinicalPlacementProgress({ placementId: progress.placement.id });
    expect(current.acceptedMinutes).toBe(480);
    expect(current.remainingMinutes).toBe(120 * 60 - 480);
    expect(current.hourEvents).toHaveLength(3);
    expect(current.hourEvents.map((event) => event.status)).toEqual([
      "reported",
      "attested",
      "accepted",
    ]);
    expect(current.hourEvents.map((event) => event.id)).toEqual([
      reported.id,
      attested.id,
      accepted.id,
    ]);
    expect(current.grantsProfessionalAuthority).toBe(false);
    expect(current.grantsClinicalAuthority).toBe(false);
    expect(current.grantsLicensure).toBe(false);
  });
});
