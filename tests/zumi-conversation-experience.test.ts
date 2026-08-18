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
  it("has one explicit full conversation workspace and primary navigation entry", () => {
    expect(navigation).toContain('{ href: "/zumi", label: "Zumi"');
    expect(navigation).toContain('zumi: { title: "Zumi", eyebrow: "Klinikos Intelligence" }');
    expect(workspacePage).toContain('can(session.role, "ai", "read")');
    expect(workspacePage).toContain("data-zumi-workspace-anchor");
  });

  it("turns the shell composer into a real Zumi entry instead of decorative search state", () => {
    expect(shell).toContain('new CustomEvent("zumi:prompt"');
    expect(shell).toContain('placeholder="Ask Zumi or search Klinikos…"');
    expect(shell).toContain('aria-label="Open Zumi"');
    expect(shell).toContain("<span className=\"hidden text-xs font-semibold sm:inline\">Zumi</span>");
  });

  it("keeps trusted path navigation client-side so the active conversation is not destroyed", () => {
    expect(presence).toContain('import Link from "next/link"');
    expect(presence).toContain("Open path without losing this conversation");
    expect(presence).toContain("href={action.href!}");
    expect(presence).toContain("onClick={() => setOpen(true)}");
  });

  it("supports an expanded conversation surface and new-chat control without permanent mode chrome", () => {
    expect(presence).toContain('const dedicatedPage = pathname === "/zumi"');
    expect(presence).toContain("Start a new Zumi conversation");
    expect(presence).toContain("Open full Zumi conversation");
    expect(presence).toContain("What needs to happen?");
    expect(presence).toContain('aria-label="Zumi preferences"');
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
    expect(masterDirective).toContain("A conversational answer is allowed to simply answer");
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
