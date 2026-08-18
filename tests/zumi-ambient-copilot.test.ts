import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const shell = read("src/components/clinic/app-shell.tsx");
const presence = read("src/components/clinic/zumi-presence.tsx");
const navigation = read("src/lib/navigation.ts");
const expandedPage = read("src/app/(platform)/zumi/page.tsx");

describe("Zumi ambient copilot contract", () => {
  it("keeps Zumi out of the sidebar destination model", () => {
    expect(navigation).not.toContain('{ href: "/zumi", label: "Zumi"');
    expect(navigation).toContain('zumi: { title: "Conversation", eyebrow: "Zumi" }');
  });

  it("makes the global Zumi control send a typed prompt instead of only opening another surface", () => {
    expect(shell).toContain("function sendOrFocusZumi()");
    expect(shell).toContain('zumiPrompt.trim() ? "Send to Zumi" : "Focus Zumi chat"');
    expect(shell).toContain("onClick={sendOrFocusZumi}");
    expect(shell).not.toContain('aria-label="Open Zumi"');
  });

  it("uses one conversation component for compact and expanded modes", () => {
    expect(expandedPage).toContain('import { ZumiPresence }');
    expect(expandedPage).toContain('<ZumiPresence userName={session.name} />');
    expect(expandedPage).not.toContain("ZumiBrowserWorkspace");
  });

  it("keeps Zumi context-aware without advertising an intelligence subsystem to the user", () => {
    expect(presence).toContain("pathname,");
    expect(presence).toContain("pageTitle: document.title");
    expect(presence).toContain("recentConversation");
    expect(presence).not.toContain("Klinikos Intelligence");
    expect(presence).not.toContain("Open full Zumi conversation");
    expect(presence).toContain("With you across Klinikos");
  });
});
