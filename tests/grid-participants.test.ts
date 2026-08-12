import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canTransitionGridParticipant,
  gridParticipantIsTerminal,
  gridParticipantMayTransact,
  gridParticipantStateForProvider,
  gridParticipantStates,
  gridParticipantSubjectIsWellFormed,
} from "@/lib/grid/participants";

const schema = () => readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
const migration = () =>
  readFileSync(join(process.cwd(), "prisma/migrations/20260812110000_grid_participant/migration.sql"), "utf8");

describe("one person, many participations", () => {
  // The property this abstraction exists for. `User.organizationId` is a required scalar
  // and `Provider` sits inside one organization, so neither can express a clinician who
  // works with two clinics. GridParticipant can.
  it("does not make userId unique, so one human may participate under several sponsors", () => {
    const block = schema().slice(schema().indexOf("model GridParticipant"), schema().indexOf("model GridParticipant") + 2600);
    expect(block).toContain("userId                String?");
    expect(block).not.toContain("userId                String?  @unique");
    expect(block).not.toMatch(/@@unique\(\[userId\]/);
  });

  it("scopes a participation to the sponsor accountable for it", () => {
    const block = schema().slice(schema().indexOf("model GridParticipant"), schema().indexOf("model GridParticipant") + 2600);
    expect(block).toContain("sponsorOrganizationId String");
    expect(block).toContain("@@index([sponsorOrganizationId, status])");
  });

  it("allows a subject only once per sponsor", () => {
    // Many sponsors, yes. Twice under the same sponsor, no.
    const block = schema().slice(schema().indexOf("model GridParticipant"), schema().indexOf("model GridParticipant") + 2600);
    expect(block).toContain("@@unique([providerId, sponsorOrganizationId]");
    expect(block).toContain("@@unique([subjectOrganizationId, sponsorOrganizationId]");
    expect(block).toContain("@@unique([facilityId, sponsorOrganizationId]");
  });

  it("lets an organization and a facility participate as themselves", () => {
    expect(gridParticipantSubjectIsWellFormed({ kind: "organization", subjectOrganizationId: "org_1" })).toBe(true);
    expect(gridParticipantSubjectIsWellFormed({ kind: "facility", facilityId: "fac_1" })).toBe(true);
    expect(gridParticipantSubjectIsWellFormed({ kind: "person", providerId: "prv_1" })).toBe(true);
  });

  it("refuses a participant that is not the kind of thing it claims to be", () => {
    expect(gridParticipantSubjectIsWellFormed({ kind: "person", subjectOrganizationId: "org_1" })).toBe(false);
    expect(gridParticipantSubjectIsWellFormed({ kind: "person", providerId: "prv_1", facilityId: "fac_1" })).toBe(false);
    expect(gridParticipantSubjectIsWellFormed({ kind: "person" })).toBe(false);
    expect(gridParticipantSubjectIsWellFormed({ kind: "spaceship", providerId: "prv_1" })).toBe(false);
  });

  it("enforces the same shape in the database, not only in TypeScript", () => {
    expect(migration()).toContain("grid_participants_kind_subject_check");
    expect(migration()).toContain("grid_participants_status_check");
  });
});

describe("participant states are explicit and truthful", () => {
  it("permits transacting only when verified or active", () => {
    for (const state of gridParticipantStates) {
      expect(gridParticipantMayTransact(state)).toBe(["verified", "active"].includes(state));
    }
  });

  it("does not treat verification as activation", () => {
    // A verified participant can be held back without losing the verification a person
    // already granted them.
    expect(canTransitionGridParticipant("verified", "active")).toBe(true);
    expect(canTransitionGridParticipant("verified", "restricted")).toBe(true);
  });

  it("makes revocation and closure final", () => {
    // A marketplace where a revoked participant can quietly return has no revocation.
    expect(gridParticipantIsTerminal("revoked")).toBe(true);
    expect(gridParticipantIsTerminal("closed")).toBe(true);
    for (const state of gridParticipantStates) {
      expect(canTransitionGridParticipant("revoked", state)).toBe(false);
      expect(canTransitionGridParticipant("closed", state)).toBe(false);
    }
  });

  it("keeps restriction and suspension recoverable", () => {
    expect(canTransitionGridParticipant("restricted", "active")).toBe(true);
    expect(canTransitionGridParticipant("suspended", "active")).toBe(true);
  });

  it("never lets an unreviewed participant jump straight to verified", () => {
    expect(canTransitionGridParticipant("created", "verified")).toBe(false);
    expect(canTransitionGridParticipant("created", "active")).toBe(false);
    expect(canTransitionGridParticipant("profile_incomplete", "verified")).toBe(false);
    expect(canTransitionGridParticipant("in_review", "verified")).toBe(true);
  });

  it("refuses a state nobody declared", () => {
    expect(canTransitionGridParticipant("created", "wizard")).toBe(false);
    expect(canTransitionGridParticipant("wizard", "active")).toBe(false);
  });
});

describe("mapping existing providers into participations", () => {
  it("carries each provider verification status to the state that grants the same", () => {
    expect(gridParticipantStateForProvider("verified")).toBe("verified");
    expect(gridParticipantStateForProvider("submitted")).toBe("in_review");
    expect(gridParticipantStateForProvider("needs_review")).toBe("in_review");
    expect(gridParticipantStateForProvider("rejected")).toBe("revoked");
    expect(gridParticipantStateForProvider("suspended")).toBe("suspended");
    expect(gridParticipantStateForProvider("draft")).toBe("profile_incomplete");
  });

  it("grants nothing for a status it does not recognise", () => {
    // The safe direction when two vocabularies disagree.
    expect(gridParticipantMayTransact(gridParticipantStateForProvider("something_new"))).toBe(false);
    expect(gridParticipantStateForProvider("")).toBe("created");
  });

  it("backfills existing contractors so the abstraction describes the running marketplace", () => {
    const sql = migration();
    expect(sql).toContain('INSERT INTO "grid_participants"');
    expect(sql).toContain("FROM \"providers\" p");
    expect(sql).toContain("ON CONFLICT DO NOTHING");
  });

  it("keeps the migration additive", () => {
    const sql = migration();
    expect(/DROP\s+(TABLE|COLUMN)|TRUNCATE|DELETE FROM/i.test(sql)).toBe(false);
  });
});
