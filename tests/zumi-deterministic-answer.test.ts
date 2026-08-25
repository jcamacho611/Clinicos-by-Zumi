import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { answerDeterministically } from "@/features/zumi/deterministic-answer";
import { resolveZumiWorkspaceIntelligence } from "@/features/zumi/workspace-intelligence";
import { zumiPresenceSchema } from "@/features/zumi/presence";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

/**
 * Zumi with no inference provider configured.
 *
 * Every question used to return 503, including "hi". Conversation and navigation are the
 * parts people rely on most and both are answerable from state Klinikos already owns, so
 * they are answered — honestly labelled as not model-generated.
 */

function sessionFor(role: ClinicRole = "clinic_owner"): ClinicSession {
  return {
    sessionId: "s1", userId: "u1", organizationId: "org-1", organizationName: "Northgate",
    organizationSlug: "northgate", email: "owner@example.test", name: "Nadja Owner",
    role, demo: true, expiresAt: Date.now() + 60_000,
  };
}

function ask(question: string, role: ClinicRole = "clinic_owner") {
  const session = sessionFor(role);
  const presence = zumiPresenceSchema.parse({ pathname: "/dashboard" });
  return answerDeterministically({ question, session, workspace: resolveZumiWorkspaceIntelligence(session, presence) });
}

describe("Zumi answers without a model provider", () => {
  it("greets a person by name instead of rejecting the turn", () => {
    // "hi" is two characters. The request schema required three, so every greeting came
    // back as "Invalid request."
    const answer = ask("hi");
    expect(answer.answer).toContain("Nadja");
    expect(answer.answer).toMatch(/work on\?$/);
  });

  it("keeps an acknowledgment short instead of answering a question nobody asked", () => {
    expect(ask("ok").answer).toBe("Got it.");
    expect(ask("thanks!").answer).toBe("Any time. What next?");
  });

  it("points an operational lookup at the surface that holds the answer", () => {
    const intake = ask("who hasn't completed intake tomorrow?");
    expect(intake.destinations[0].href).toBe("/forms");
    // It says where the list lives; it never claims to have counted anything.
    expect(intake.answer).not.toMatch(/\d+\s+(patients?|people)/);
  });

  it("routes a real journey through the route catalog", () => {
    const coverage = ask("find coverage for Saturday");
    expect(coverage.routeId).toBeTruthy();
    expect(coverage.destinations.some((destination) => destination.href.startsWith("/grid"))).toBe(true);
  });

  it("says it does not know rather than inventing an interpretation", () => {
    const answer = ask("xyzzy");
    expect(answer.answer).toContain("not sure what you need yet");
    expect(answer.routeId).toBeNull();
  });

  it("never labels a deterministic reply as model-generated", () => {
    for (const question of ["hi", "what referrals are stuck?", "xyzzy", "find coverage for Saturday"]) {
      expect(ask(question).modelGenerated).toBe(false);
    }
  });

  it("only offers destinations the role can actually open", () => {
    // A contractor is an external Grid participant with no clinic-data permission. An
    // answer that sends them to /forms or /billing would be a menu that lies.
    for (const question of ["who hasn't completed intake tomorrow?", "what money are we leaving on the table?", "hi"]) {
      for (const destination of ask(question, "contractor").destinations) {
        expect(["/patients", "/forms", "/billing", "/front-desk", "/referrals", "/tasks"], `contractor was offered ${destination.href}`)
          .not.toContain(destination.href);
      }
    }
  });

  it("claims no action and offers only links the person clicks themselves", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/features/zumi/deterministic-answer.ts"), "utf8");
    // This path must never assert that something was sent, scheduled, paid or recorded.
    expect(source).not.toMatch(/\b(I sent|I scheduled|I paid|I recorded|I've sent|has been sent)\b/i);
    expect(source).not.toContain("db.");
  });
});

describe("the route degrades instead of going dark", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "src/app/api/zumi/route.ts"), "utf8");
  const gateway = fs.readFileSync(path.join(process.cwd(), "src/features/zumi/gateway.ts"), "utf8");

  it("accepts a one-character turn", () => {
    expect(route).toContain("z.string().trim().min(1).max(8_000)");
  });

  it("answers deterministically when no provider is configured", () => {
    expect(route).toContain('result.reason === "provider_unavailable"');
    expect(route).toContain("answerDeterministically");
    expect(route).toContain("intelligenceAvailable: false");
  });

  it("still refuses the decisions that are decisions, not gaps", () => {
    // Rate limit, entitlement, permission and the kill switch must keep refusing; only a
    // missing provider falls through to a deterministic answer.
    expect(route).not.toMatch(/reason === "(permission_denied|entitlement_required|prohibited)"[\s\S]{0,80}answerDeterministically/);
  });

  it("survives an unreachable database while recalling memory", () => {
    // Promise.all rejects on first failure, so an optional memory lookup used to take the
    // whole conversation down with a 500.
    expect(gateway).toMatch(/retrieveZumiMemoryContext\([\s\S]{0,120}\.catch\(/);
    expect(gateway).toContain('return { text: "", memoryIds: [] as string[] };');
  });
});

describe("Living Home and the Zumi conversation answer the same way", () => {
  const livingHome = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/living-home.tsx"), "utf8");
  const pathsRoute = fs.readFileSync(path.join(process.cwd(), "src/app/api/paths/route.ts"), "utf8");

  it("shares one surface lookup instead of keeping a second, worse copy", () => {
    // These were independent. Living Home's version met an unmatched sentence with
    // "I need the outcome rather than the topic", so the most prominent input in the
    // product gave a worse answer than the API did for the same question.
    //
    // Living Home used to call the shared lookup itself, in the browser. It now asks the
    // server, which calls the same function — so the two answers are not merely similar,
    // they come from one execution path. Assert that convergence where it now lives.
    expect(pathsRoute).toContain("resolveSurfaceLookup");
    expect(livingHome).toContain('outcome === "surface"');
    expect(livingHome).not.toContain("I can route this, but I need the outcome rather than the topic");
  });

  it("keeps the surface lookup and its access check out of the browser", () => {
    // The lookup decides which surfaces a role may be sent to, so running it client-side
    // made the browser the authority on its own access. It also shipped the full lookup
    // table. Neither belongs in a bundle the user controls.
    expect(livingHome).not.toContain('from "@/features/zumi/deterministic-answer"');
    expect(livingHome).not.toContain('from "@/lib/orchestration/intent-engine"');
    expect(pathsRoute).toContain("session.role");
  });

  it("offers the surface as a control rather than naming it in prose", () => {
    expect(livingHome).toContain("surfaceAnswer.href");
    expect(livingHome).toContain("Open {surfaceAnswer.label}");
  });

  it("clears the previous answer when a new turn starts", () => {
    // Otherwise a stale destination sits under an unrelated question.
    expect(livingHome).toContain("setSurfaceAnswer(null)");
  });
});
