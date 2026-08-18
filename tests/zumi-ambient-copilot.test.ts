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

  it("makes the global Zumi control send a typed prompt or focus the mounted conversation", () => {
    expect(shell).toContain("function sendOrFocusZumi()");
    // The label follows the behaviour and never names Zumi as a destination: with text
    // the control sends, empty it focuses the conversation already mounted in the shell.
    expect(shell).toContain('aria-label={zumiPrompt.trim() ? "Send" : "Ask Klinikos"}');
    expect(shell).not.toMatch(/aria-label="(Open|Focus) Zumi/);
    expect(shell).toContain("onClick={sendOrFocusZumi}");
    expect(shell).toContain('new CustomEvent("zumi:prompt"');
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
    // Zumi is ambient, so the controls are named for what they do rather than for a
    // product the person is being sent to.
    expect(presence).toContain('aria-label="Expand conversation"');
    expect(presence).toContain('aria-label="Start a new conversation"');
    expect(presence).not.toMatch(/aria-label="[^"]*Zumi/);
    expect(presence).toContain("With you across Klinikos");
  });
});
