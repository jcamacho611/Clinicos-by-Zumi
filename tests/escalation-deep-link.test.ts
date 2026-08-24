import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const escalationFindMany = vi.fn();
const escalationCount = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    task: { findMany: () => Promise.resolve([]), count: () => Promise.resolve(0) },
    escalation: { findMany: (...a: unknown[]) => escalationFindMany(...a), count: (...a: unknown[]) => escalationCount(...a) },
  },
}));

const { getActionCenter } = await import("@/lib/home/action-center");

/**
 * A reviewer who clicks "urgent lab needs review" in the Action Center used to land on
 * /escalations and have to find the same row again by eye. These cover the handoff end
 * to end: the link has to carry the record, the page has to expose a matching anchor,
 * and arrival has to be visible for both navigation paths.
 *
 * The two halves live in different files and neither one is useful alone, so a test that
 * only checked the href would pass while the landing page had no such id.
 */
describe("escalation deep link handoff", () => {
  it("links the Action Center item at the specific escalation record", async () => {
    escalationFindMany.mockResolvedValue([{
      id: "esc-42",
      category: "urgent_lab_result",
      riskLevel: "URGENT",
      assignedTeam: "clinical_provider",
      createdAt: new Date("2026-06-15T09:00:00Z"),
      status: "open",
    }]);
    escalationCount.mockResolvedValue(1);

    const center = await getActionCenter({ organizationId: "org-1", userId: "u1", role: "clinic_owner" as ClinicRole });
    const item = (center.buckets ?? []).flatMap((bucket) => bucket.items).find((entry) => entry.id === "escalation-esc-42");

    expect(item).toBeDefined();
    expect(item?.href).toBe("/escalations#escalation-esc-42");
  });

  it("renders a matching anchor on the escalations page the link lands on", () => {
    const source = readFileSync("src/components/clinic/escalations-workspace-real.tsx", "utf8");

    // Same shape the href builds: `escalation-` + the record id.
    expect(source).toContain("id={`escalation-${item.id}`}");
    expect(source).toContain("klinikos-deep-target");
    // Without scroll margin the row lands under the sticky header.
    expect(source).toContain("scroll-mt-24");
  });

  it("marks arrival for client navigation, which :target alone does not cover", () => {
    const css = readFileSync("src/app/accessibility.css", "utf8");
    const marker = readFileSync("src/components/clinic/deep-target-marker.tsx", "utf8");

    // The App Router pushes state instead of doing a fragment navigation, so the
    // document's target element is never set and :target stays unmatched.
    expect(css).toContain(".klinikos-deep-target[data-klinikos-arrived]");
    expect(css).toContain(".klinikos-deep-target:target");
    expect(marker).toContain("data-klinikos-arrived");
    expect(marker).toContain("hashchange");

    // The marker must never leave two rows highlighted at once.
    expect(marker).toContain("removeAttribute");

    // Arrival is an outline plus a bar, not colour alone.
    expect(css).toContain("outline: 2px solid");
    expect(css).toMatch(/\[data-klinikos-arrived\]::before/);

    // Motion is a courtesy, never a requirement.
    expect(css).toContain("prefers-reduced-motion: no-preference");
  });
});
