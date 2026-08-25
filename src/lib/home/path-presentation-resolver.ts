import "server-only";

import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { getKlinikosPath } from "@/lib/paths/catalog";
import type { PathPresentation } from "@/lib/home/path-presentation";

/**
 * Reduce a stored Path to the few facts the interface renders.
 *
 * This is the only place the path catalog and the path runtime engine are consulted on
 * behalf of Living Home. Everything the browser receives about a Path comes through
 * here, which is what keeps the catalog and the sequencing rules out of the bundle.
 *
 * `server-only` makes the boundary a build error rather than a review comment: importing
 * this from a Client Component fails the build instead of quietly shipping the engines
 * again.
 */
export function presentPath(snapshot: PersistedPathSnapshot): PathPresentation | null {
  const definition = getKlinikosPath(snapshot.pathId);
  if (!definition) return null;

  const runtime = resolvePathRuntime({ pathId: snapshot.pathId, snapshot });

  return {
    instanceId: snapshot.instanceId,
    pathId: snapshot.pathId,
    definitionId: definition.id,
    title: definition.title,
    // A Path whose definition resolves but whose runtime does not is still worth showing
    // by name. Reporting 0% is honest here: no step has been observed complete.
    progressPercent: runtime ? Math.round(runtime.progress * 100) : 0,
  };
}

export function presentPaths(
  snapshots: readonly PersistedPathSnapshot[],
): PathPresentation[] {
  const presentations: PathPresentation[] = [];
  for (const snapshot of snapshots) {
    const presentation = presentPath(snapshot);
    // A snapshot naming a path the catalog no longer defines is dropped rather than
    // rendered as an untitled row. It is a real state — a Path can outlive a catalog
    // entry — and an unnamed card would tell the user nothing they could act on.
    if (presentation) presentations.push(presentation);
  }
  return presentations;
}
