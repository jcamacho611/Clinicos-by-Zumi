import { describe, expect, it } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";
import { zumiPresenceSchema } from "@/features/zumi/presence";
import { resolveZumiWorkspaceIntelligence } from "@/features/zumi/workspace-intelligence";
import { projectWorkspaceIntelligenceForClient } from "@/features/zumi/client-projection";

const owner: ClinicSession = {
  sessionId: "session-1",
  userId: "user-1",
  organizationId: "org-1",
  organizationName: "Clinic",
  organizationSlug: "clinic",
  name: "Owner User",
  email: "owner@example.test",
  role: "clinic_owner",
  demo: false,
  expiresAt: Date.now() + 60_000,
};

describe("Zumi workspace intelligence", () => {
  it("understands Billing as Money and keeps the prompt outcome-oriented", () => {
    const workspace = resolveZumiWorkspaceIntelligence(
      owner,
      zumiPresenceSchema.parse({ pathname: "/billing", surface: "platform" }),
    );
    expect(workspace.surfaceKey).toBe("billing");
    expect(workspace.title).toBe("Money");
    expect(workspace.prompt.toLowerCase()).toContain("money");
    expect(workspace.suggestedQuestions.some((question) => question.toLowerCase().includes("blocking revenue"))).toBe(true);
  });

  it("understands Grid without forcing marketplace taxonomy", () => {
    const workspace = resolveZumiWorkspaceIntelligence(
      owner,
      zumiPresenceSchema.parse({ pathname: "/grid", surface: "grid" }),
    );
    expect(workspace.surfaceKey).toBe("grid");
    expect(workspace.prompt).toBe("What do you need or have?");
    expect(workspace.suggestedQuestions.some((question) => question.includes("I need"))).toBe(true);
  });

  it("only returns role-authorized navigation selected through the shared navigation contract", () => {
    const workspace = resolveZumiWorkspaceIntelligence(
      owner,
      zumiPresenceSchema.parse({ pathname: "/dashboard", surface: "platform" }),
    );
    expect(workspace.primaryDestinations.length).toBeLessThanOrEqual(5);
    expect(workspace.primaryDestinations.map((item) => item.label)).toContain("Money");
    expect(workspace.primaryDestinations.map((item) => item.label)).toContain("Grid");
  });

  it("projects only safe internal navigation to the browser", () => {
    const workspace = resolveZumiWorkspaceIntelligence(
      owner,
      zumiPresenceSchema.parse({ pathname: "/quality", surface: "platform" }),
    );
    const projected = projectWorkspaceIntelligenceForClient(workspace);
    for (const destination of [...projected.primaryDestinations, ...projected.relatedDestinations]) {
      expect(destination.href.startsWith("/")).toBe(true);
      expect(destination.href.startsWith("//")).toBe(false);
    }
    expect(projected.suggestedQuestions.length).toBeLessThanOrEqual(4);
  });
});
