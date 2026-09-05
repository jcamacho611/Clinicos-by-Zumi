import type { Metadata } from "next";
import Link from "next/link";
import { SpatialUniverse } from "@/components/universe/spatial-universe";
import { projectSpatialUniverse } from "@/lib/universe/spatial-projection";

export const metadata: Metadata = {
  title: "The Klinikos universe | Klinikos",
  description:
    "Move through the five layers of Klinikos — the people, the things that get exchanged, how work gets done, the machinery underneath, and how it all compounds.",
};

/**
 * Server component on purpose.
 *
 * `projectSpatialUniverse()` reads the canonical ecosystem graph, which carries
 * internal source paths and vendor dependencies on every node. Running the
 * projection here means the browser is handed the projected shape and never the
 * graph — the disclosure boundary is the module import, not a runtime check.
 */
export default function KlinikosUniversePage() {
  const universe = projectSpatialUniverse();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-light tracking-[-.05em] text-[color:var(--k-text)] sm:text-6xl">
          One system, five layers.
        </h1>
        <p className="mt-5 text-base leading-7 text-[color:var(--k-muted)] sm:text-lg">
          Klinikos is not one product. It is a set of businesses that share the
          same people, the same evidence and the same rails. This is what that
          actually looks like — {universe.nodeCount} working parts, arranged by
          the layer they belong to. Move down through the layers to see how the
          surface you use sits on top of the machinery that makes it true.
        </p>
      </header>

      <div className="mt-12">
        <SpatialUniverse universe={universe} />
      </div>

      <p className="mt-8 max-w-2xl text-sm leading-6 text-[color:var(--k-muted)]">
        Some of these parts are live today and some are still intended. Each one
        says which it is, because an intention should never read like a working
        capability. For how the layers fit together as a business, see the{" "}
        <Link
          className="underline decoration-[color:var(--k-line)] underline-offset-4 transition-colors hover:text-[color:var(--k-text)]"
          href="/ecosystem"
        >
          ecosystem overview
        </Link>
        .
      </p>
    </main>
  );
}
