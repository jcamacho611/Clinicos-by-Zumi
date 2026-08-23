import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatZumiGovernedContext,
  rankZumiGovernedContext,
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

  it("does not expose authority or scope promotion through the ordinary user memory API", () => {
    const route = readFileSync("src/app/api/zumi/memory/route.ts", "utf8");
    expect(route).not.toContain("authority:");
    expect(route).not.toContain("scope:");
    expect(route).not.toContain("organization_memory");
    expect(route).not.toContain("institutional_memory");
  });

  it("requires the gateway to keep governed knowledge separate from live authority", () => {
    const gateway = readFileSync("src/features/zumi/gateway.ts", "utf8");
    expect(gateway).toContain("retrieveZumiOrganizationKnowledgeContext");
    expect(gateway).toContain("operational authority");
    expect(gateway).toContain("organizationKnowledgeIds");
  });
});
