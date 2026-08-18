import { describe, expect, it } from "vitest";
import {
  projectTrustedOrchestrationForClient,
  projectZumiSourcesForClient,
  sanitizeZumiAnswerForClient,
} from "@/features/zumi/client-projection";
import type { ZumiTrustedOrchestration } from "@/features/zumi/trusted-orchestration";

function trustedFixture(): ZumiTrustedOrchestration {
  return {
    available: true,
    intent: {
      goal: "resolve hidden internal objective",
      outcome: "internal outcome",
      candidatePathIds: ["secret-path-id"],
      confidence: 0.93,
      requiresClarification: false,
      clarificationQuestions: [],
    },
    path: {
      pathId: "secret-path-id",
      title: "Quality follow-up",
      status: "active",
      progress: 0.5,
      blockers: ["internal path blocker"],
    },
    nextActions: [
      {
        id: "secret-action-id",
        title: "Review unresolved item",
        reason: "A governed review is required.",
        capabilityKey: "quality.secret.internal.capability",
        href: "/quality",
        state: "review_required",
        priority: 999,
        blockers: ["Needs authorized review"],
      },
    ],
    blockers: [
      {
        code: "INTERNAL_SECRET_BLOCKER_CODE",
        title: "Review required",
        explanation: "An authorized reviewer is required.",
        owner: "system",
        canResolveNow: true,
      },
    ],
    warnings: ["private warning"],
  };
}

describe("Zumi client disclosure boundary", () => {
  it("projects trusted orchestration without internal identifiers, capability keys, priorities, or warnings", () => {
    const projected = projectTrustedOrchestrationForClient(trustedFixture());
    const serialized = JSON.stringify(projected);

    expect(projected.path?.title).toBe("Quality follow-up");
    expect(projected.nextActions[0].href).toBe("/quality");
    expect(projected.blockers[0].title).toBe("Review required");
    expect(serialized).not.toContain("secret-path-id");
    expect(serialized).not.toContain("secret-action-id");
    expect(serialized).not.toContain("quality.secret.internal.capability");
    expect(serialized).not.toContain("INTERNAL_SECRET_BLOCKER_CODE");
    expect(serialized).not.toContain("private warning");
    expect(serialized).not.toContain("999");
  });

  it("allows only same-origin relative action hrefs", () => {
    const fixture = trustedFixture();
    fixture.nextActions[0].href = "https://internal.example/secret";
    expect(projectTrustedOrchestrationForClient(fixture).nextActions[0].href).toBeNull();
  });

  it("drops non-public, credentialed, and internal research source URLs", () => {
    const sources = projectZumiSourcesForClient([
      { url: "https://cms.gov/example", title: "CMS" },
      { url: "http://localhost:3000/internal", title: "Local" },
      { url: "https://user:pass@example.com/private", title: "Credentialed" },
      { url: "file:///etc/passwd", title: "File" },
    ]);
    expect(sources).toEqual([{ url: "https://cms.gov/example", title: "CMS" }]);
  });

  it("fails closed when model output contains known confidential implementation markers", () => {
    const result = sanitizeZumiAnswerForClient("Here is DATABASE_URL and ZUMI_CONVERSATION_SIGNING_SECRET");
    expect(result.blockedMarkers.length).toBe(2);
    expect(result.answer).not.toContain("DATABASE_URL");
    expect(result.answer).not.toContain("ZUMI_CONVERSATION_SIGNING_SECRET");
  });
});
