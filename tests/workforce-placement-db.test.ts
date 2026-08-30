import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { GridCompositionComponent } from "@/lib/grid/composition-engine";
import {
  approvePlacementParty,
  createPlacementRecord,
  getPlacementRecordWithProgress,
  recordPlacementHours,
  recordPlacementHumanEvaluation,
} from "@/lib/workforce/placement-repository";

const suffix = "workforce_placement_20260830";
const personId = `person_${suffix}`;
let placementId: string;

function components(): GridCompositionComponent[] {
  return [
    {
      slotKey: "student",
      resourceId: personId,
      resourceKind: "person",
      participantId: personId,
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["learner relationship active"],
    },
    {
      slotKey: "school",
      resourceId: "school_resource_1",
      resourceKind: "organization",
      organizationId: "school_resource_1",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["school relationship active"],
    },
    {
      slotKey: "preceptor",
      resourceId: "provider_preceptor_1",
      resourceKind: "professional",
      participantId: "person_preceptor_1",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["preceptor eligibility verified"],
    },
    {
      slotKey: "site",
      resourceId: "location_site_1",
      resourceKind: "location",
      organizationId: "clinic_site_1",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["site capacity approved for discovery"],
    },
    {
      slotKey: "time",
      resourceId: "placement_window_1",
      resourceKind: "time_window",
      eligibilityVerified: true,
      authorizationVerified: true,
      availabilityVerified: true,
      evidence: ["placement capacity available"],
    },
  ];
}

beforeAll(async () => {
  await db.person.create({
    data: {
      id: personId,
      displayName: "Jordan Lee",
      primaryEmail: `${suffix}@example.test`,
      sourceType: "test",
    },
  });
});

afterAll(async () => {
  await db.workforcePlacement.deleteMany({ where: { learnerPersonId: personId } });
  await db.person.deleteMany({ where: { id: personId } });
});

describe("persisted clinical placement lifecycle", () => {
  it("persists a composition-ready placement as matched, not approved", async () => {
    const created = await createPlacementRecord({
      learnerPersonId: personId,
      educationEnrollmentId: "education_enrollment_1",
      gridDemandId: "grid_demand_placement_1",
      components: components(),
      requiredHours: 120,
      sourceType: "edu_grid_match",
      sourceReference: "grid_demand_placement_1",
    });
    placementId = created.id;

    expect(created).toMatchObject({
      learnerPersonId: personId,
      educationEnrollmentId: "education_enrollment_1",
      status: "matched",
      schoolApproved: false,
      siteApproved: false,
      preceptorApproved: false,
      completedHours: 0,
      professionalAuthorityGranted: false,
    });
    expect(created.progress.compositionReady).toBe(true);
    expect(created.progress.approved).toBe(false);
    expect(created.progress.completed).toBe(false);
  });

  it("requires separate school, site, and preceptor approvals before placement is approved", async () => {
    await approvePlacementParty(placementId, "school", "school_approval_evidence_1");
    await approvePlacementParty(placementId, "site", "site_approval_evidence_1");

    let current = await getPlacementRecordWithProgress(placementId);
    expect(current?.progress.approved).toBe(false);
    expect(current?.progress.blockers).toContain("preceptor_approval_required");

    await approvePlacementParty(placementId, "preceptor", "preceptor_approval_evidence_1");
    current = await getPlacementRecordWithProgress(placementId);

    expect(current?.status).toBe("approved");
    expect(current?.progress.approved).toBe(true);
    expect(current?.progress.completed).toBe(false);
    expect(current?.professionalAuthorityGranted).toBe(false);
  });

  it("tracks hours and human evaluation separately, and completion still requires external professional verification", async () => {
    await recordPlacementHours(placementId, {
      completedHours: 120,
      evidenceReference: "hours_evidence_120",
    });

    let current = await getPlacementRecordWithProgress(placementId);
    expect(current?.progress.completed).toBe(false);
    expect(current?.progress.blockers).toContain("human_evaluation_required");

    await recordPlacementHumanEvaluation(placementId, "human_evaluation_1");
    current = await getPlacementRecordWithProgress(placementId);

    expect(current?.status).toBe("completed");
    expect(current?.progress.completed).toBe(true);
    expect(current?.progress.requiresExternalProfessionalVerification).toBe(true);
    expect(current?.professionalAuthorityGranted).toBe(false);
  });

  it("keeps the five placement resource anchors and approval evidence traceable", async () => {
    const current = await getPlacementRecordWithProgress(placementId);
    expect(current).toMatchObject({
      learnerPersonId: personId,
      schoolResourceId: "school_resource_1",
      preceptorResourceId: "provider_preceptor_1",
      siteResourceId: "location_site_1",
      timeResourceId: "placement_window_1",
      schoolApprovalEvidence: "school_approval_evidence_1",
      siteApprovalEvidence: "site_approval_evidence_1",
      preceptorApprovalEvidence: "preceptor_approval_evidence_1",
      hoursEvidenceReference: "hours_evidence_120",
      humanEvaluationReference: "human_evaluation_1",
      professionalAuthorityGranted: false,
    });
  });
});
