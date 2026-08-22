import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { answerDeterministically } from "@/features/zumi/deterministic-answer";
import { resolveZumiWorkspaceIntelligence } from "@/features/zumi/workspace-intelligence";
import { zumiPresenceSchema } from "@/features/zumi/presence";
import { openZumiConversation, sealZumiConversation } from "@/features/zumi/conversation-state";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

const env = { AUTH_SECRET: "multi-turn-test-secret-not-a-real-secret" } as unknown as NodeJS.ProcessEnv;

function sessionFor(role: ClinicRole = "clinic_owner"): ClinicSession {
  return {
    sessionId: "s1", userId: "u1", organizationId: "org-1", organizationName: "Northgate",
    organizationSlug: "northgate", email: "owner@example.test", name: "Nadja Owner",
    role, demo: true, expiresAt: Date.now() + 60_000,
  };
}

function ask(question: string, thread: { topic?: string } | null = null, role: ClinicRole = "clinic_owner") {
  const session = sessionFor(role);
  const presence = zumiPresenceSchema.parse({ pathname: "/dashboard" });
  return answerDeterministically({
    question, session, thread,
    workspace: resolveZumiWorkspaceIntelligence(session, presence),
  });
}

describe("a follow-up stays on the thread", () => {
  it("keeps 'what about tomorrow?' on the topic it was already discussing", () => {
    // The trap: "tomorrow" also matches the schedule lookup. Answered as a fresh
    // question it silently changes subject, which is worse than not answering — the
    // person believes they were understood.
    const first = ask("who hasn't completed intake tomorrow?");
    expect(first.topic).toBe("intake");

    const followUp = ask("what about tomorrow?", { topic: first.topic });
    expect(followUp.destinations[0].href).toBe("/forms");
    expect(followUp.answer).toMatch(/still intake/i);
  });

  it("carries a short refinement rather than asking the person to restate everything", () => {
    for (const refinement of ["only the providers", "just the urgent ones", "and those?"]) {
      const answer = ask(refinement, { topic: "money" });
      expect(answer.destinations[0].href, `${refinement} lost the thread`).toBe("/billing");
    }
  });

  it("switches topic when the person genuinely changes subject", () => {
    const switched = ask("what money are we leaving on the table?", { topic: "intake" });
    expect(switched.topic).toBe("money");
    expect(switched.destinations[0].href).toBe("/billing");
  });

  it("says which thread it is still on, rather than answering silently", () => {
    // A follow-up resolved against the wrong topic and answered without saying so is
    // indistinguishable from being understood.
    expect(ask("what about tomorrow?", { topic: "referrals" }).answer).toMatch(/still follow-up/i);
  });

  it("does not treat a fresh question as a follow-up", () => {
    const fresh = ask("what referrals are stuck?", { topic: "intake" });
    expect(fresh.destinations[0].href).toBe("/referrals");
  });

  it("never resumes a thread into a surface the role cannot open", () => {
    // A contractor holds no clinic-data permission. A remembered topic must not become
    // a way around that.
    for (const topic of ["intake", "money", "today", "referrals", "tasks"]) {
      for (const destination of ask("what about tomorrow?", { topic }, "contractor").destinations) {
        expect(["/forms", "/billing", "/front-desk", "/referrals", "/tasks"], `contractor resumed into ${destination.href}`)
          .not.toContain(destination.href);
      }
    }
  });
});

describe("the conversation token carries a thread safely", () => {
  it("round-trips thread context without a provider response id", () => {
    // The deterministic path has no provider thread. Requiring responseId made every
    // deterministic follow-up look like a forged token.
    const token = sealZumiConversation(
      { responseId: "", organizationId: "org-1", userId: "u1", thread: { topic: "intake", surface: "/forms" } },
      env,
    );
    expect(token).toBeTruthy();
    const opened = openZumiConversation(token, { organizationId: "org-1", userId: "u1" }, env);
    expect(opened?.thread?.topic).toBe("intake");
  });

  it("refuses a thread token belonging to another account", () => {
    const token = sealZumiConversation(
      { responseId: "", organizationId: "org-1", userId: "u1", thread: { topic: "money" } },
      env,
    );
    expect(openZumiConversation(token, { organizationId: "org-2", userId: "u1" }, env)).toBeNull();
    expect(openZumiConversation(token, { organizationId: "org-1", userId: "u2" }, env)).toBeNull();
  });

  it("refuses an empty token rather than starting an anonymous thread", () => {
    const token = sealZumiConversation({ responseId: "", organizationId: "org-1", userId: "u1" }, env);
    // No responseId and no thread is not a conversation, and must not open one.
    expect(openZumiConversation(token, { organizationId: "org-1", userId: "u1" }, env)).toBeNull();
  });

  it("puts no patient data in a token that travels in a browser", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/features/zumi/conversation-state.ts"), "utf8");
    // The thread is product metadata only: which surface, which route, which topic.
    expect(source).toContain("No patient data, no counts, no names");
    for (const field of ["patientId", "patientName", "question", "answer", "transcript"]) {
      expect(source, `thread context carries ${field}`).not.toMatch(new RegExp(`thread[\\s\\S]{0,300}${field}`));
    }
  });

  it("bounds every thread field so a long conversation cannot grow the token", () => {
    const token = sealZumiConversation(
      { responseId: "", organizationId: "org-1", userId: "u1", thread: { surface: "/x".repeat(400), topic: "y".repeat(400) } },
      env,
    );
    const opened = openZumiConversation(token, { organizationId: "org-1", userId: "u1" }, env);
    expect(opened!.thread!.surface!.length).toBeLessThanOrEqual(120);
    expect(opened!.thread!.topic!.length).toBeLessThanOrEqual(40);
  });
});
