import { describe, expect, it } from "vitest";
import { actorContextFromSession } from "@/lib/orchestration/actor-context";
import type { ClinicSession } from "@/lib/auth/types";

function session(role: ClinicSession["role"]): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-1",
    organizationName: "Clinic One",
    organizationSlug: "clinic-one",
    email: "user@example.com",
    name: "Test User",
    role,
    demo: false,
    expiresAt: Date.now() + 60_000,
  };
}

describe("actorContextFromSession", () => {
  it("keeps actor and organization scope fixed to the authenticated session", () => {
    expect(actorContextFromSession(session("provider"), "grid")).toMatchObject({
      actorId: "user-1",
      userId: "user-1",
      organizationId: "org-1",
      contextKind: "grid",
      roleKeys: ["provider"],
    });
  });

  it("adds owner and admin policy aliases without widening organization scope", () => {
    expect(actorContextFromSession(session("clinic_owner")).roleKeys).toEqual(["clinic_owner", "owner"]);
    expect(actorContextFromSession(session("administrator")).roleKeys).toEqual(["administrator", "admin"]);
  });
});
