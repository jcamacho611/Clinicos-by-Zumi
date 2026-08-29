import { describe, expect, it } from "vitest";
import {
  loadPersonContextInputByLegacyUserIdWith,
  type PersonContextDataSource,
} from "@/lib/identity/person-context-repository";

const personRow = {
  id: "person_1",
  displayName: "Jordan Lee",
  status: "active",
  memberships: [
    {
      id: "mem_a",
      personId: "person_1",
      organizationId: "org_a",
      legacyUserId: "user_a",
      membershipType: "organization_user",
      roleKey: "provider",
      status: "active",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
      locationAssignments: [
        {
          id: "loc_a",
          membershipId: "mem_a",
          locationId: "location_a",
          roleKey: "provider",
          professionKey: "rn",
          status: "active",
          effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
          effectiveTo: null,
        },
      ],
    },
    {
      id: "mem_b",
      personId: "person_1",
      organizationId: "org_b",
      legacyUserId: "user_b",
      membershipType: "organization_user",
      roleKey: "clinic_owner",
      status: "active",
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
      locationAssignments: [
        {
          id: "loc_b",
          membershipId: "mem_b",
          locationId: "location_b",
          roleKey: "clinic_owner",
          professionKey: null,
          status: "active",
          effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
          effectiveTo: null,
        },
      ],
    },
  ],
  relationships: [],
};

describe("Person context repository adoption", () => {
  it("loads one durable Person and all memberships by a legacy user anchor", async () => {
    const dataSource: PersonContextDataSource = {
      findPersonByLegacyUserId: async (legacyUserId) => {
        expect(legacyUserId).toBe("user_a");
        return personRow;
      },
    };

    const result = await loadPersonContextInputByLegacyUserIdWith(dataSource, "user_a");

    expect(result?.person).toEqual({
      id: "person_1",
      displayName: "Jordan Lee",
      status: "active",
    });
    expect(result?.memberships.map(({ organizationId }) => organizationId)).toEqual(["org_a", "org_b"]);
    expect(result?.locationAssignments.map(({ locationId }) => locationId)).toEqual([
      "location_a",
      "location_b",
    ]);
  });

  it("preserves only durable legacy User links and does not invent Patient, Provider, relationship, credential, or EDU links", async () => {
    const dataSource: PersonContextDataSource = {
      findPersonByLegacyUserId: async () => personRow,
    };

    const result = await loadPersonContextInputByLegacyUserIdWith(dataSource, "user_a");

    expect(result?.domainLinks).toEqual([
      { kind: "user", recordId: "user_a", organizationId: "org_a" },
      { kind: "user", recordId: "user_b", organizationId: "org_b" },
    ]);
    expect(result?.relationships).toEqual([]);
    expect(result?.evidence).toEqual([]);
  });

  it("returns null when the legacy user is not anchored to a Person instead of guessing by email or name", async () => {
    const dataSource: PersonContextDataSource = {
      findPersonByLegacyUserId: async () => null,
    };

    await expect(loadPersonContextInputByLegacyUserIdWith(dataSource, "missing_user")).resolves.toBeNull();
  });
});
