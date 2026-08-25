import { describe, expect, it } from "vitest";
import { clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";
import { createRouteResolver, internalPath } from "./helpers/route-existence";

/**
 * Does every domain the registry claims actually have somewhere to stand?
 *
 * The registry gives each of its 62 sections an `interfaceRoute`, and until now nothing
 * checked that the route resolves — `feature-registry.test.ts` only asserts it starts
 * with a slash. A section could name `/urgent-bridge` forever and the canon would look
 * complete.
 *
 * Checking this by looking for directories under `src/app` is worse than not checking:
 * most clinic surfaces are served by one dynamic `[workspace]` page from a whitelist, so
 * a filesystem check reports dozens of working routes as missing. That mistake is easy
 * to make and was made once already. The shared resolver understands both.
 */
describe("registry interface routes", () => {
  const routeExists = createRouteResolver();

  /**
   * Sections whose declared route does not exist yet.
   *
   * Recorded rather than tolerated. The assertion below requires this list to match
   * reality exactly, so adding a section with an unbuilt route fails, and building one
   * of these also fails until it is removed from the list. Either way somebody looks.
   */
  const KNOWN_UNBUILT_ROUTES: ReadonlyArray<{ section: number; route: string }> = [
    { section: 59, route: "/urgent-bridge" },
    { section: 62, route: "/design-system" },
  ];

  it("resolves every declared interface route, except the ones recorded as unbuilt", () => {
    const unresolved = clinicOsDayOneRegistry
      .filter((section) => !routeExists(internalPath(section.interfaceRoute)))
      .map((section) => ({ section: section.number, route: section.interfaceRoute }));

    expect(
      unresolved,
      `Registry sections whose interface route does not resolve:\n${unresolved
        .map((entry) => `  section ${entry.section} -> ${entry.route}`)
        .join("\n")}`,
    ).toEqual(KNOWN_UNBUILT_ROUTES);
  });

  it("counts the sections that do have a surface, so the number cannot drift unnoticed", () => {
    const resolved = clinicOsDayOneRegistry.filter((section) =>
      routeExists(internalPath(section.interfaceRoute)),
    );

    expect(resolved).toHaveLength(clinicOsDayOneRegistry.length - KNOWN_UNBUILT_ROUTES.length);
  });

  it("recognizes a surface served by the dynamic workspace route, not only a directory", () => {
    // The mistake this guards against: `/telemedicine` has no folder under src/app and
    // is nonetheless a real, reachable page.
    expect(routeExists("/telemedicine")).toBe(true);
    expect(routeExists("/claim-readiness")).toBe(true);
  });

  it("does not treat an arbitrary slug as a governed surface", () => {
    expect(routeExists("/not-a-real-klinikos-surface")).toBe(false);
  });
});
