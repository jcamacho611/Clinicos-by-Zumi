import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const presence = readFileSync(join(process.cwd(), "src/components/clinic/zumi-presence.tsx"), "utf8");
const shell = readFileSync(join(process.cwd(), "src/components/clinic/app-shell.tsx"), "utf8");
const navigation = readFileSync(join(process.cwd(), "src/lib/navigation.ts"), "utf8");
const surfaceSchema = readFileSync(join(process.cwd(), "src/features/zumi/presence.ts"), "utf8");
const workspacePage = readFileSync(join(process.cwd(), "src/app/(platform)/zumi/page.tsx"), "utf8");
const customerContext = readFileSync(join(process.cwd(), "docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md"), "utf8");
const masterDirective = readFileSync(join(process.cwd(), "src/features/zumi/master-directive.ts"), "utf8");

describe("Zumi conversation experience", () => {
  it("has one explicit full conversation workspace and a persistent shell entry", () => {
    expect(navigation).toContain('zumi: { title: "Conversation", eyebrow: "Zumi" }');
    expect(workspacePage).toContain('can(session.role, "ai", "read")');
    expect(workspacePage).toContain("The persistent Zumi instance lives in AppShell");
    expect(workspacePage).toContain("return null");
    expect(shell).toContain("<ZumiPresence userName={session.name}");
  });

  it("turns the shell composer into a real Zumi entry instead of decorative search state", () => {
    expect(shell).toContain('new CustomEvent("zumi:prompt"');
    // The placeholder follows the surface a person is standing on rather than naming
    // the assistant: "What needs to happen?" on Home, "What do you need or have?" on
    // Grid, "Ask about money that needs attention…" on billing.
    expect(shell).toContain("placeholder={promptPlaceholder}");
    expect(shell).toContain("klinikosPromptForWorkspace");
    // The critical interaction: with text, the control SENDS; empty, it focuses the
    // conversation already mounted in the shell. It never navigates, so it can never
    // surprise someone by throwing them into a different surface mid-sentence. The
    // label follows the behaviour rather than announcing Zumi as a separate app.
    // The label follows the behaviour and never names Zumi as somewhere to be sent:
    // with text the control sends, empty it focuses the mounted conversation.
    expect(shell).toContain('aria-label={zumiPrompt.trim() ? "Send" : "Ask Klinikos"}');
    expect(shell).not.toMatch(/aria-label="(Open|Focus) Zumi/);
    expect(shell).toContain("onClick={sendOrFocusZumi}");
    expect(shell).toContain('new Event("zumi:open")');
    expect(shell).not.toMatch(/aria-label="Open Zumi"/);
    // Visible text says what the button does, not what product it belongs to.
    expect(shell).toContain('{zumiPrompt.trim() ? "Send" : "Ask"}');
  });

  it("keeps trusted path navigation client-side so the active conversation is not destroyed", () => {
    expect(presence).toContain('import Link from "next/link"');
    expect(presence).toContain("Open without losing this conversation");
    expect(presence).toContain("href={action.href!}");
    expect(presence).toContain("onClick={() => setOpen(true)}");
  });

  it("supports an expanded conversation surface and new-chat control without permanent mode chrome", () => {
    expect(presence).toContain('const dedicatedPage = pathname === "/zumi"');
    expect(presence).toContain('aria-label="Start a new conversation"');
    expect(presence).toContain('aria-label="Expand conversation"');
    // The conversation's own invitation is contextual too, so it comes from the shared
    // per-workspace prompt rather than being hard-coded to Home's question.
    expect(presence).toContain("placeholder={conversationPrompt}");
    expect(presence).toContain('aria-label="Conversation preferences"');
    expect(presence).not.toContain('role="tablist"');
    expect(presence).not.toContain("Evidence & capability trace");
    expect(presence).not.toContain("Trusted Klinikos path");
    expect(presence).not.toContain("Understanding, connecting only where needed");
  });

  it("carries bounded recent-turn context for non-research follow-ups through the existing governed context boundary", () => {
    expect(presence).toContain('const recentConversation = mode === "research"');
    expect(presence).toContain("messages.slice(-8)");
    expect(presence).toContain("context: recentConversation?.length ? { recentConversation } : undefined");
    expect(presence).toContain('webResearch: mode === "research" ? true : undefined');
  });

  it("tells the model to converse before routing or exposing internal machinery", () => {
    expect(masterDirective).toContain("Conversation comes before routing");
    // The rule, not one phrasing of it: an ordinary turn may get an ordinary reply
    // rather than being forced into a workflow.
    expect(masterDirective).toMatch(/casual turns[\s\S]{0,80}without inventing workflows/);
    expect(masterDirective).toContain("Answer first.");
    expect(masterDirective).toContain("Do not expose orchestration plans");
    expect(masterDirective).toContain("ask one concise human question at a time");
  });

  it("declares the dedicated intelligence surface in the backend schema", () => {
    expect(surfaceSchema).toContain('"intelligence"');
  });

  it("makes completed voice recognition a conversational turn and requests speech back", () => {
    expect(presence).toContain('void sendQuestion(transcript, { voice: true })');
    expect(presence).toContain('if (speechOutput || options?.voice) speak(answer)');
  });

  it("gives customer-safe Zumi context the practical route and pricing anchors users ask about", () => {
    expect(customerContext).toContain("**Zumi** — `/zumi`");
    expect(customerContext).toContain("**Klinikos Core** — `$995/month`");
    expect(customerContext).toContain("**Klinikos Growth** — `$1,995/month`");
    expect(customerContext).toContain("**Klinikos Scale** — `$3,995/month`");
    expect(customerContext).toContain("**Grid Professional** — `$0` basic profile; `$39/month Pro`");
    expect(customerContext).toContain("MapLibre + OpenFreeMap");
  });
});
