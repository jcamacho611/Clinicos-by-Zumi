import { describe, expect, it } from "vitest";
import { klinikosPathCatalog, type KlinikosPathDefinition } from "@/lib/paths/catalog";
import { createRouteResolver, internalPath } from "./helpers/route-existence";

describe("Klinikos governed route registry", () => {
  // Shared with the feature-registry route guard so both agree on what "exists" means.
  const routeExists = createRouteResolver();

  it("only links route steps to real Next.js pages or whitelisted generic workspaces", () => {
    const missing = klinikosPathCatalog.flatMap((path: KlinikosPathDefinition) => path.nodes.flatMap((node) => {
      if (!node.href?.startsWith("/")) return [];
      const target = internalPath(node.href);
      return routeExists(target) ? [] : [`${path.id}:${node.id} -> ${node.href}`];
    }));

    expect(missing, `Dead governed route destinations:\n${missing.join("\n")}`).toEqual([]);
  });

  it("keeps the clinic capacity readiness step on a real governance surface", () => {
    const path = klinikosPathCatalog.find((candidate) => candidate.id === "clinic-monetize-capacity");
    const readiness = path?.nodes.find((node) => node.id === "readiness");
    expect(readiness?.href).toBe("/grid/trust");
    expect(routeExists("/grid/trust")).toBe(true);
  });

  it("does not let the generic workspace route legitimize arbitrary slugs", () => {
    expect(routeExists("/patient-navigation")).toBe(true);
    expect(routeExists("/claim-readiness")).toBe(true);
    expect(routeExists("/provider-network")).toBe(true);
    expect(routeExists("/totally-made-up-page")).toBe(false);
  });
});
