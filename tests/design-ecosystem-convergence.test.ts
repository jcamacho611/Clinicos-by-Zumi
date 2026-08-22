import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Klinikos design and ecosystem convergence", () => {
  it("ships a broad governed route registry without fake dead hrefs", () => {
    expect(klinikosPathCatalog.length).toBeGreaterThanOrEqual(16);
    expect(new Set(klinikosPathCatalog.map((path) => path.id)).size).toBe(klinikosPathCatalog.length);
    for (const path of klinikosPathCatalog) {
      expect(path.from.trim().length).toBeGreaterThan(2);
      expect(path.to.trim().length).toBeGreaterThan(2);
      expect(path.governance.trim().length).toBeGreaterThan(20);
      expect(path.nodes.length).toBeGreaterThan(1);
      for (const node of path.nodes) {
        if (node.href) {
          expect(node.href.startsWith("/"), `${path.id}:${node.id}`).toBe(true);
          expect(node.href, `${path.id}:${node.id}`).not.toBe("#");
        }
      }
    }
  });

  it("resolves the four design-reference lifecycle examples deterministically", () => {
    expect(resolveIntentDeterministically("I just graduated nursing school and want to become an injector").candidatePathIds).toContain("become-grid-ready");
    expect(resolveIntentDeterministically("I need a clinical placement and preceptor").candidatePathIds).toContain("student-clinical-placement");
    expect(resolveIntentDeterministically("I want to work independently").candidatePathIds).toContain("clinician-independent-practice");
    expect(resolveIntentDeterministically("We have an empty room and want to monetize capacity").candidatePathIds).toContain("clinic-monetize-capacity");
  });

  it("expands the one mounted Zumi conversation instead of standing up a second product", () => {
    const page = source("src/app/(platform)/zumi/page.tsx");
    const shell = source("src/components/clinic/app-shell.tsx");

    // Zumi is ambient intelligence inside Klinikos, not a separate app with its own
    // browser chrome. `/zumi` changes how the already-mounted conversation is
    // presented; it must not mount a second assistant, which would silently reset
    // the person's in-flight context.
    expect(page).not.toContain("ZumiBrowserWorkspace");
    expect(page).not.toMatch(/Klinikos Browser/i);
    expect(page).toContain("requireClinicSession");
    expect(page).toContain('can(session.role, "ai", "read")');
    expect(page).toContain("notFound()");
    expect(shell).toMatch(/zumi/i);
  });

  it("makes routes, ecosystem, account appearance, and explicit sign out discoverable", () => {
    const navigation = source("src/lib/navigation.ts");
    const shell = source("src/components/clinic/app-shell.tsx");
    const settings = source("src/components/clinic/account-preferences.tsx");
    expect(navigation).toContain('href: "/paths"');
    expect(navigation).toContain('href: "/ecosystem"');
    expect(shell).toContain("Sign out");
    expect(settings).toContain('key: "system"');
    expect(settings).toContain('key: "light"');
    expect(settings).toContain('key: "dark"');
  });

  it("keeps the public Living Home composer as a real responsive textarea plus visible send control", () => {
    const convergence = source("src/app/experience-convergence.css");
    const home = source("src/app/cinematic-home-overrides.css");

    expect(convergence).toContain('#living-composer .reference-composer-shell > textarea');
    expect(convergence).toContain("min-width: 0");
    expect(convergence).toContain('#living-composer .reference-composer-shell > button[type="submit"]');
    expect(convergence).toContain("position: static");
    expect(convergence).not.toContain('button[type="submit"] svg {display:none}');
    expect(convergence).not.toContain("color:transparent");

    // The current component has exactly two grid children in its first-visit composer:
    // textarea + submit. A stale four-track mobile override previously placed the
    // textarea into a 2.5rem track, reproducing the vertical-character collapse seen
    // in production at half-window widths.
    expect(home).toContain("grid-template-columns: minmax(0,1fr) 3rem");
    expect(home).not.toContain("grid-template-columns: 2.5rem minmax(0,1fr) 2.7rem 3rem");
  });
});
