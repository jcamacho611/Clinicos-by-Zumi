import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatZumiGovernedContext,
  rankZumiGovernedContext,
  resolveZumiGovernedContextConflicts,
  zumiGovernedContextMatchesQuestion,
  type ZumiGovernedContextItem,
} from "@/features/zumi/memory-authority";

const personal: ZumiGovernedContextItem = {
  id: "memory-1",
  scope: "user",
  authority: "human_confirmed_personal",
  title: "Working style",
  content: "Prefer concise operational summaries.",
  sourceName: "zumi_user_memory",
  sourceDate: "2026-08-22T10:00:00.000Z",
  effectiveAt: "2026-08-22T10:00:00.000Z",
  expiresAt: "2027-02-18T10:00:00.000Z",
  version: 2,
};

const organization: ZumiGovernedContextItem = {
  id: "knowledge-1",
  scope: "organization",
  authority: "human_approved_organization",
  title: "Callback escalation policy",
  content: "Escalate overdue callbacks to the assigned clinic operations queue.",
  sourceName: "clinic_policy",
  sourceDate: "2026-08-20T10:00:00.000Z",
  effectiveAt: "2026-08-20T10:00:00.000Z",
  expiresAt: null,
  version: 3,
};

const globalReference: ZumiGovernedContextItem = {
  id: "knowledge-global-1",
  scope: "global",
  authority: "human_approved_global_reference",
  title: "Klinikos terminology",
  content: "Grid is healthcare resource and capacity infrastructure, not a staffing-only marketplace.",
  sourceName: "klinikos_reference",
  sourceDate: "2026-08-18T10:00:00.000Z",
  effectiveAt: "2026-08-18T10:00:00.000Z",
  expiresAt: null,
  version: 1,
};

describe("Zumi governed memory and knowledge authority", () => {
  it("labels personal memory as context-only rather than operational authority", () => {
    const text = formatZumiGovernedContext([personal]);
    expect(text).toContain("authority=human_confirmed_personal");
    expect(text).toContain("scope=user");
    expect(text).toContain("operational_authority=false");
    expect(text).toContain("Prefer concise operational summaries");
  });

  it("keeps reviewed organization and global knowledge distinct from personal memory", () => {
    const text = formatZumiGovernedContext([organization, globalReference]);
    expect(text).toContain("authority=human_approved_organization");
    expect(text).toContain("scope=organization");
    expect(text).toContain("authority=human_approved_global_reference");
    expect(text).toContain("scope=global");
    expect(text.match(/operational_authority=false/g)).toHaveLength(2);
  });

  it("ranks query-relevant reviewed knowledge ahead of unrelated context without changing authority", () => {
    const ranked = rankZumiGovernedContext(
      [personal, organization, globalReference],
      "Why are our callbacks overdue?",
      3,
    );
    expect(ranked[0]?.id).toBe("knowledge-1");
    expect(ranked.find((item) => item.id === "memory-1")?.authority).toBe("human_confirmed_personal");
  });

  it("requires organization knowledge to be relevant before entering a turn", () => {
    expect(zumiGovernedContextMatchesQuestion(organization, "Why are our callbacks overdue?")).toBe(true);
    expect(zumiGovernedContextMatchesQuestion(organization, "How does Grid work?")).toBe(false);
    expect(zumiGovernedContextMatchesQuestion(globalReference, "How does Grid work?")).toBe(true);
  });

  it("lets organization-approved knowledge override a same-title global reference for that organization", () => {
    const globalPolicy: ZumiGovernedContextItem = {
      ...organization,
      id: "global-policy",
      scope: "global",
      authority: "human_approved_global_reference",
      content: "Escalate callbacks after 48 hours.",
      version: 1,
    };
    const organizationPolicy: ZumiGovernedContextItem = {
      ...organization,
      id: "org-policy",
      content: "Escalate callbacks after 24 hours.",
      version: 2,
    };

    expect(resolveZumiGovernedContextConflicts([globalPolicy, organizationPolicy])).toEqual([organizationPolicy]);
  });

  it("withholds unresolved same-scope contradictions instead of guessing", () => {
    const first = { ...organization, id: "conflict-1", content: "Escalate after 24 hours." };
    const second = { ...organization, id: "conflict-2", content: "Escalate after 12 hours." };
    expect(resolveZumiGovernedContextConflicts([first, second])).toEqual([]);
  });

  it("deduplicates identical same-scope knowledge by keeping the newest version", () => {
    const older = { ...organization, id: "same-1", version: 1 };
    const newer = { ...organization, id: "same-2", version: 4 };
    expect(resolveZumiGovernedContextConflicts([older, newer])).toEqual([newer]);
  });

  it("does not expose authority or scope promotion through the ordinary user memory API", () => {
    const route = readFileSync("src/app/api/zumi/memory/route.ts", "utf8");
    expect(route).not.toContain("authority:");
    expect(route).not.toContain("scope:");
    expect(route).not.toContain("organization_memory");
    expect(route).not.toContain("institutional_memory");
  });

  it("requires reviewed knowledge retrieval to filter live state and sensitive content before model context", () => {
    const memory = readFileSync("src/features/zumi/memory.ts", "utf8");
    expect(memory).toContain('status: "approved"');
    expect(memory).not.toContain('status: "approved_demo"');
    expect(memory).toContain("zumiGovernedContextMatchesQuestion");
    expect(memory).toContain("resolveZumiGovernedContextConflicts");
    expect(memory).toContain("containsLikelyIdentifiers");
    expect(memory).toContain("redactText");
    expect(memory).toContain("organizationKnowledgeIds");
  });

  it("keeps the gateway memory contract explicitly below live authority", () => {
    const gateway = readFileSync("src/features/zumi/gateway.ts", "utf8");
    expect(gateway).toContain("retrieveZumiMemoryContext");
    expect(gateway).toContain("not as system authority or permission");
    expect(gateway).toContain("memoryIds");
  });
});
