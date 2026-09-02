import { describe, expect, it, vi } from "vitest";
import type { PersonAccountSession } from "@/lib/auth/account-types";
import type { CareerArtifactView } from "@/lib/career/career-artifact-repository";
import type {
  WorkforcePlacementInput,
  WorkforceRelationshipInput,
} from "@/lib/workforce/person-workforce-projection";
import {
  loadPersonWorkforceProjectionWith,
  type PersonWorkforceProjectionDataSource,
} from "@/lib/workforce/person-workforce-projection-loader";

const session: PersonAccountSession = {
  sessionId: "session_1",
  accountId: "account_1",
  personId: "person_1",
  email: "learner@example.com",
  displayName: "Learner One",
  expiresAt: 1_900_000_000,
};

const careerArtifact: CareerArtifactView = {
  id: "career_1",
  personId: "person_1",
  artifactType: "resume",
  artifactVersion: 2,
  supersedesArtifactId: "career_0",
  sourceType: "resume_upload",
  sourceReference: "private://resume/person_1/source.pdf",
  sourceChecksumSha256: "a".repeat(64),
  claimState: "claimed",
  verificationState: "unverified",
  claims: {
    education: [{ school: "Example University" }],
    experience: [{ employer: "Example Clinic" }],
    skills: ["patient intake"],
    careerGoals: ["Registered nurse"],
    locationPreferences: ["New York"],
    availabilityPreferences: ["weekdays"],
  },
  parser: null,
  parsedAt: new Date("2026-09-01T00:00:00.000Z"),
  humanConfirmedAt: new Date("2026-09-01T01:00:00.000Z"),
  humanConfirmedBy: "person_1",
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-01T01:00:00.000Z"),
  grantsAuthority: false,
};

const relationships: WorkforceRelationshipInput[] = [
  {
    id: "rel_edu",
    relationshipType: "learner",
    status: "active",
    verificationState: "verified",
    domainKind: "education_enrollment",
    domainRecordId: "enrollment_1",
  },
];

const placement: WorkforcePlacementInput = {
  status: "active",
  approvals: {
    school: "approved",
    site: "approved",
    preceptor: "accepted",
    learner: "accepted",
  },
  requiredMinutes: 12_000,
  acceptedMinutes: 6_000,
  remainingMinutes: 6_000,
  hoursComplete: false,
};

function source(overrides: Partial<PersonWorkforceProjectionDataSource> = {}): PersonWorkforceProjectionDataSource {
  return {
    findAccount: vi.fn(async () => ({
      id: "account_1",
      personId: "person_1",
      status: "active",
      emailVerifiedAt: null,
    })),
    findLatestCareerArtifact: vi.fn(async () => careerArtifact),
    listRelationships: vi.fn(async () => relationships),
    findPlacementProgress: vi.fn(async () => placement),
    ...overrides,
  };
}

describe("persisted Person workforce projection loader", () => {
  it("derives all workforce state from the server-owned Account/Person session", async () => {
    const dataSource = source();

    const projection = await loadPersonWorkforceProjectionWith(dataSource, session);

    expect(dataSource.findAccount).toHaveBeenCalledWith("account_1");
    expect(dataSource.findLatestCareerArtifact).toHaveBeenCalledWith("person_1");
    expect(dataSource.listRelationships).toHaveBeenCalledWith("person_1");
    expect(dataSource.findPlacementProgress).toHaveBeenCalledWith("person_1");
    expect(projection.career.state).toBe("human_confirmed_claims");
    expect(projection.education.emailVerificationRequiredBeforeClaim).toBe(false);
    expect(projection.placement?.acceptedMinutes).toBe(6_000);
    expect(projection.work.canMatch).toBe(false);
  });

  it("reads email verification from persisted Account truth rather than session/browser claims", async () => {
    const verifiedSource = source({
      findAccount: vi.fn(async () => ({
        id: "account_1",
        personId: "person_1",
        status: "active",
        emailVerifiedAt: new Date("2026-09-01T02:00:00.000Z"),
      })),
      listRelationships: vi.fn(async () => []),
      findPlacementProgress: vi.fn(async () => null),
    });

    const projection = await loadPersonWorkforceProjectionWith(verifiedSource, session);

    expect(projection.education).toEqual({
      relationshipState: "not_linked",
      emailVerificationRequiredBeforeClaim: false,
      grantsAuthority: false,
    });
    expect(projection.work.canMatch).toBe(false);
  });

  it("fails closed when the persisted Account does not belong to the session Person", async () => {
    const mismatched = source({
      findAccount: vi.fn(async () => ({
        id: "account_1",
        personId: "person_other",
        status: "active",
        emailVerifiedAt: null,
      })),
    });

    await expect(loadPersonWorkforceProjectionWith(mismatched, session)).rejects.toThrow(
      "Person Account context does not match the authenticated Person.",
    );
    expect(mismatched.findLatestCareerArtifact).not.toHaveBeenCalled();
    expect(mismatched.listRelationships).not.toHaveBeenCalled();
    expect(mismatched.findPlacementProgress).not.toHaveBeenCalled();
  });

  it("fails closed for missing or inactive persisted Accounts", async () => {
    await expect(
      loadPersonWorkforceProjectionWith(source({ findAccount: vi.fn(async () => null) }), session),
    ).rejects.toThrow("Active Person Account context was not found.");

    await expect(
      loadPersonWorkforceProjectionWith(
        source({
          findAccount: vi.fn(async () => ({
            id: "account_1",
            personId: "person_1",
            status: "disabled",
            emailVerifiedAt: null,
          })),
        }),
        session,
      ),
    ).rejects.toThrow("Active Person Account context was not found.");
  });

  it("treats no current placement as ordinary state, not as invented completion", async () => {
    const noPlacement = source({ findPlacementProgress: vi.fn(async () => null) });

    const projection = await loadPersonWorkforceProjectionWith(noPlacement, session);

    expect(projection.placement).toBeNull();
    expect(projection.work.canMatch).toBe(false);
    expect(projection.nextAction.pathId).toBe("student-clinical-placement");
  });
});
