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

  it("makes the persistent shell control send a typed prompt or open the mounted assistant", () => {
    expect(shell).toContain("function sendOrFocusZumi()");
    expect(shell).toContain('const shellControlLabel = zumiPrompt.trim() ? "Send message to Zumi" : "Open Zumi assistant"');
    expect(shell).toContain('aria-label="Message Zumi"');
    expect(shell).toContain('aria-controls="zumi-presence-panel"');
    expect(shell).toContain("aria-label={shellControlLabel}");
    expect(shell).toContain("onClick={sendOrFocusZumi}");
    expect(shell).toContain('new CustomEvent("zumi:prompt"');
    expect(shell).toContain('new Event("zumi:open")');
    expect(shell).toContain('src="/klinikos-orbital-k-production.png"');
  });

  it("keeps one mounted conversation instance across normal and expanded routes", () => {
    expect(shell).toContain('<ZumiPresence userName={session.name} />');
    expect(shell).not.toContain('!expandedZumiConversation ? <ZumiPresence');
    expect(expandedPage).toContain("return null;");
    expect(expandedPage).not.toContain("ZumiBrowserWorkspace");
    expect(expandedPage).not.toContain("<ZumiPresence");
  });

  it("keeps Zumi context-aware while allowing the same mounted thread to expand", () => {
    expect(presence).toContain("pathname,");
    expect(presence).toContain("pageTitle: document.title");
    expect(presence).toContain("recentConversation");
    expect(presence).not.toContain("Klinikos Intelligence");
    expect(presence).toContain('aria-label="Expand conversation"');
    expect(presence).toContain('aria-label="Start a new conversation"');
    expect(presence).toContain("Your assistant across Klinikos");
  });
});