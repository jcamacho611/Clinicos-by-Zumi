import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("persistent Zumi product-control law", () => {
  const shell = read("src/components/clinic/app-shell.tsx");
  const presence = read("src/components/clinic/zumi-presence.tsx");
  const master = read("docs/KLINIKOS_MASTER_CANON.md");
  const canon = read("docs/KLINIKOS_PRODUCT_CONTROL_AND_COMPREHENSION_CANON.md");
  const zumiCanon = read("docs/ZUMI_CANON.md");

  it("keeps one mounted Zumi assistant available from the authenticated shell", () => {
    expect(shell).toContain("<ZumiPresence userName={session.name}");
    expect(shell).toContain('new CustomEvent("zumi:prompt"');
    expect(shell).toContain('new Event("zumi:open")');
    expect(shell).toContain("klinikosPromptForWorkspace");
    expect(shell).toContain('src="/klinikos-orbital-k-production.png"');
    expect(presence).toContain('event.key.toLowerCase() === "j"');
    expect(presence).toContain('const dedicatedPage = pathname === "/zumi"');
  });

  it("makes the shell control the only normal authenticated launcher", () => {
    expect(shell).toContain('aria-controls="zumi-presence-panel"');
    expect(shell).toContain('aria-label="Message Zumi"');
    expect(shell).toContain('"Send message to Zumi" : "Open Zumi assistant"');
    expect(presence).not.toContain('className="fixed bottom-5 right-5 z-40 flex size-14');
    expect(presence).not.toContain('aria-label={open ? "Hide conversation" : "Ask Klinikos. Keyboard shortcut Control or Command J"}');
    expect(presence).toContain('aria-label="Zumi assistant"');
    expect(presence).toContain('aria-label="Send message to Zumi"');
  });

  it("locks the assistant hierarchy into master and specialist law", () => {
    expect(master).toContain("KLINIKOS-ZUMI-001");
    expect(master).toContain("Zumi is Klinikos Intelligence and the semantic navigation/control layer");
    expect(master).toContain("Living Home is the authenticated adaptive command surface");
    expect(canon).toContain("persistent personal operating assistant inside Klinikos");
    expect(canon).toContain("every authenticated application page exposes the same Zumi control");
    expect(canon).toContain("If information must remain confidential, it stays server-side");
    expect(zumiCanon).toContain("one persistent assistant with multiple governed modes");
    expect(zumiCanon).toContain("persistent Zumi control in the Klinikos shell");
  });

  it("keeps app control separate from deterministic authority", () => {
    expect(master).toContain("Zumi is not product authority, clinical authority, payment authority, credential authority, or legal authority");
    expect(canon).toContain('"Controls the app" means Zumi can understand intent');
    expect(canon).toContain("It does **not** mean Zumi may override deterministic authority");
    expect(zumiCanon).toContain("may never override authentication");
  });
});

describe("public comprehension and SEO law", () => {
  const rootLayout = read("src/app/layout.tsx");
  const home = read("src/app/page.tsx");
  const platformLayout = read("src/app/(platform)/layout.tsx");
  const robots = read("src/app/robots.ts");
  const sitemap = read("src/app/sitemap.ts");
  const messaging = read("src/lib/brand/canonical-messaging.ts");
  const canon = read("docs/KLINIKOS_PRODUCT_CONTROL_AND_COMPREHENSION_CANON.md");

  it("uses one canonical plain-language messaging source across site metadata", () => {
    expect(rootLayout).toContain('import { KLINIKOS_META } from "@/lib/brand/canonical-messaging"');
    expect(rootLayout).toContain("default: KLINIKOS_META.title");
    expect(rootLayout).toContain("description: KLINIKOS_META.description");
    expect(home).toContain("title: KLINIKOS_META.title");
    expect(home).toContain("description: KLINIKOS_META.description");
    expect(messaging).toContain('KLINIKOS_ONE_LINE = "Run your clinic from one intelligent operating system."');
  });

  it("keeps the homepage canonical local instead of poisoning every route", () => {
    expect(home).toContain('alternates: { canonical: "/" }');
    expect(rootLayout).not.toContain('alternates: { canonical: "/" }');
  });

  it("keeps authenticated workspaces out of public indexing", () => {
    expect(platformLayout).toContain("index: false");
    expect(platformLayout).toContain("follow: false");
    expect(platformLayout).toContain("nocache: true");
    expect(robots).toContain('"/dashboard"');
    expect(robots).toContain('"/patients"');
    expect(robots).toContain('"/zumi"');
    expect(robots).toContain('"/api"');
  });

  it("keeps the sitemap focused on useful public acquisition paths", () => {
    for (const publicPath of [
      'path: "/"',
      'path: "/how-it-works"',
      'path: "/pricing"',
      'path: "/trust"',
      'path: "/founding-clinic"',
      'path: "/operational-audit"',
      'path: "/grid"',
      'path: "/edu"',
    ]) expect(sitemap).toContain(publicPath);

    expect(sitemap).not.toContain('path: "/dashboard"');
    expect(sitemap).not.toContain('path: "/patients"');
    expect(sitemap).not.toContain('path: "/zumi"');
  });

  it("publishes truthful structured data without fabricated social proof", () => {
    expect(home).toContain('"@type": "SoftwareApplication"');
    expect(home).toContain('"@type": "Organization"');
    expect(home).toContain('applicationCategory: "BusinessApplication"');
    expect(home).not.toContain("aggregateRating");
    expect(home).not.toContain("reviewCount");
    expect(home).not.toContain("ratingValue");
  });

  it("treats comprehension, indexing, and growth truth as merge law", () => {
    expect(canon).toContain("Product comprehension law");
    expect(canon).toContain("SEO and public discovery law");
    expect(canon).toContain("Growth and unicorn execution law");
    expect(canon).toContain("authenticated, patient-private, admin, setup, API, and operational workspaces are `noindex`");
    expect(canon).toContain("Do not optimize vanity feature count");
  });
});
