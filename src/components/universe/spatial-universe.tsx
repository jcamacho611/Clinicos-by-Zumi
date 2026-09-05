"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SpatialUniverse, SpatialNode } from "@/lib/universe/spatial-projection";

/**
 * The Klinikos Spatial Universe.
 *
 * One architectural decision governs this file: the spatial view and the
 * accessible view are the SAME DOM. Planes are real <section>s, nodes are real
 * <button>s in a real list, and depth is a CSS transform applied over them. A
 * screen reader, a keyboard, and a search engine all traverse the same tree the
 * eye does. There is no mirrored 2D tree kept in sync by a store, because a
 * second tree is a second source of truth, and a second source of truth drifts.
 *
 * Everything visual resolves through `--k-*`, so Marble and Obsidian are two
 * genuine materials rather than one scene wearing a skin. Motion is real but
 * yields entirely to `prefers-reduced-motion`.
 */

const PLANE_GAP = 340;

/** Honest state chips. Intent and reality are shown side by side, never merged. */
const IMPLEMENTATION_LABEL: Record<string, string> = {
  LIVE_VERIFIED: "Live",
  BUILT_NEEDS_VERIFICATION: "Built · needs checking",
  PARTIAL: "Partly built",
  DESIGNED: "Designed",
  PLANNED: "Planned",
  EXTERNAL_CONNECTION_REQUIRED: "Needs an outside connection",
  LEGAL_REVIEW_REQUIRED: "Waiting on legal review",
  NOT_BUILT: "Not built yet",
};

const STRATEGY_LABEL: Record<string, string> = {
  NOW: "Now",
  NEXT: "Next",
  LATER: "Later",
  PARTNER: "With a partner",
  CONNECT: "Connect, don't rebuild",
  INTERNALIZE: "Bring in-house",
  NEVER_BUILD: "Never build",
};

/** Nodes that are genuinely running read bright; everything else reads quiet. */
function isRealizedNow(node: SpatialNode) {
  return node.implementationState === "LIVE_VERIFIED";
}

export function SpatialUniverse({ universe }: { universe: SpatialUniverse }) {
  const [activePlane, setActivePlane] = useState(0);
  const [selected, setSelected] = useState<SpatialNode | null>(null);
  const [calm, setCalm] = useState(false);
  const stageId = useId();
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setCalm(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const planeCount = universe.planes.length;

  const move = useCallback(
    (delta: number) => {
      setActivePlane((current) => Math.min(planeCount - 1, Math.max(0, current + delta)));
      setSelected(null);
    },
    [planeCount],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Arrow keys inside a text field belong to the text field.
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowDown" || event.key === "]") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowUp" || event.key === "[") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const current = universe.planes[activePlane];

  // Announce depth changes so a screen-reader user experiences the same
  // navigation a sighted user does, rather than a silently reordered page.
  useEffect(() => {
    if (liveRef.current && current) {
      liveRef.current.textContent = `${current.label}. ${current.meaning} ${current.nodes.length} things on this layer.`;
    }
  }, [current]);

  const transition = calm ? "none" : "transform 900ms cubic-bezier(.16,1,.3,1)";

  const planeStyles = useMemo(
    () =>
      universe.planes.map((plane) => {
        const offset = plane.depth - activePlane;
        const distance = Math.abs(offset);
        return {
          transform: `translate(-50%,-50%) translateZ(${offset * -PLANE_GAP}px) rotateX(58deg)`,
          opacity: distance > 2 ? 0 : 1 - distance * 0.28,
          pointerEvents: offset === 0 ? ("auto" as const) : ("none" as const),
          zIndex: planeCount - distance,
        };
      }),
    [universe.planes, activePlane, planeCount],
  );

  return (
    <div
      className="relative isolate w-full overflow-hidden rounded-[28px] border border-[color:var(--k-line)] bg-[image:var(--k-ambient)]"
      style={{ minHeight: "min(78vh,760px)" }}
    >
      <AmbientField calm={calm} />

      {/* The stage. Depth is presentation; the list below is the truth. */}
      <div
        className="absolute inset-0"
        style={{ perspective: "1500px", perspectiveOrigin: "50% 42%" }}
        aria-hidden="true"
      >
        {universe.planes.map((plane, index) => (
          <div
            key={plane.id}
            className="absolute left-1/2 top-1/2 h-[560px] w-[min(88%,940px)] rounded-[36px] border border-[color:var(--k-plane-edge)] bg-[color:var(--k-plane-surface)] backdrop-blur-[2px]"
            style={{ ...planeStyles[index], transition, transformStyle: "preserve-3d" }}
          >
            {plane.nodes.map((node) => {
              const x = 50 + Math.cos(node.angle) * node.radius * 0.46;
              const y = 50 + Math.sin(node.angle) * node.radius * 0.46;
              const live = isRealizedNow(node);
              return (
                <span
                  key={node.id}
                  className="absolute block rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    height: live ? 10 : 7,
                    width: live ? 10 : 7,
                    background: live ? "var(--k-node-core)" : "var(--k-node-quiet)",
                    boxShadow: live ? "var(--k-node-glow)" : "none",
                    transform: "translate(-50%,-50%)",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ backgroundImage: "var(--k-depth-veil)" }}
        aria-hidden="true"
      />

      {/* Real content. This is what assistive technology reads. */}
      <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-10">
        <header className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[color:var(--k-plane-label)]">
            The Klinikos universe
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-[-.04em] text-[color:var(--k-text)] sm:text-4xl">
            {current?.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--k-muted)]">{current?.meaning}</p>
          <p aria-live="polite" className="sr-only" ref={liveRef} />
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Universe layers" className="flex flex-col gap-1">
            <ol className="flex flex-wrap gap-2">
              {universe.planes.map((plane, index) => {
                const isActive = index === activePlane;
                return (
                  <li key={plane.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePlane(index);
                        setSelected(null);
                      }}
                      aria-current={isActive ? "true" : undefined}
                      aria-controls={`${stageId}-layer`}
                      className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors"
                      style={{
                        borderColor: isActive ? "var(--k-accent)" : "var(--k-line)",
                        color: isActive ? "var(--k-text)" : "var(--k-muted)",
                        background: isActive ? "var(--k-plane-surface)" : "transparent",
                      }}
                    >
                      {plane.label}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-1 text-[11px] text-[color:var(--k-muted)]">
              Use ↑ and ↓ to move between layers.
            </p>
          </nav>

          <p className="text-[11px] text-[color:var(--k-muted)] lg:text-right">
            {universe.nodeCount} things across {planeCount} layers.
            <br />
            Nothing here is a patient or a person&rsquo;s record.
          </p>
        </div>

        <section
          id={`${stageId}-layer`}
          aria-label={`Things on ${current?.label}`}
          className="max-h-[38vh] overflow-y-auto rounded-2xl border border-[color:var(--k-line)] bg-[color:var(--k-plane-surface)] p-4 backdrop-blur-md"
        >
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {current?.nodes.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => setSelected(node)}
                  aria-pressed={selected?.id === node.id}
                  className="flex w-full items-start gap-2 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:border-[color:var(--k-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--k-accent)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: isRealizedNow(node) ? "var(--k-node-core)" : "var(--k-node-quiet)",
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-[color:var(--k-text)]">
                      {node.label}
                    </span>
                    <span className="block text-[11px] text-[color:var(--k-muted)]">
                      {IMPLEMENTATION_LABEL[node.implementationState] ?? node.implementationState}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {selected ? (
        <aside
          aria-label={`About ${selected.label}`}
          className="absolute inset-x-4 bottom-4 rounded-2xl border border-[color:var(--k-accent)] bg-[color:var(--k-public-raised)] p-4 shadow-[var(--k-shadow)] sm:inset-x-auto sm:right-6 sm:w-[min(360px,90%)]"
        >
          <p className="text-[15px] text-[color:var(--k-text)]">{selected.label}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <dt className="text-[color:var(--k-muted)]">What we intend</dt>
              <dd className="mt-0.5 text-[color:var(--k-text)]">
                {STRATEGY_LABEL[selected.strategyState] ?? selected.strategyState}
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--k-muted)]">Where it actually is</dt>
              <dd className="mt-0.5 text-[color:var(--k-text)]">
                {IMPLEMENTATION_LABEL[selected.implementationState] ?? selected.implementationState}
              </dd>
            </div>
          </dl>
          {selected.boundaries.length > 0 ? (
            <p className="mt-3 border-t border-[color:var(--k-line)] pt-3 text-[11px] leading-5 text-[color:var(--k-muted)]">
              {selected.boundaries.join(" · ")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-3 text-[11px] text-[color:var(--k-accent)] underline underline-offset-2"
          >
            Close
          </button>
        </aside>
      ) : null}
    </div>
  );
}

/**
 * Ambient field.
 *
 * Deliberately CSS, not a canvas. The approved Spatial Living Universe design
 * rules out a continuous render loop, and it is right to: a rAF loop keeps the
 * main thread and the GPU awake for the whole time a page is open, which on a
 * shared clinical workstation is a real cost for decoration. These are plain
 * elements drifting on a compositor-driven keyframe, so the work happens off
 * the main thread and stops when the tab is not visible without us asking.
 *
 * Positions are a deterministic function of the index, never Math.random, so
 * the field is the same field on every visit rather than a new one each time.
 */
const MOTES = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 97) % 100,
  top: (i * 61) % 100,
  size: 0.6 + ((i % 5) * 0.35),
  duration: 14 + ((i % 7) * 3),
  delay: -((i * 13) % 20),
}));

function AmbientField({ calm }: { calm: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {MOTES.map((mote, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${mote.left}%`,
            top: `${mote.top}%`,
            height: `${mote.size * 2}px`,
            width: `${mote.size * 2}px`,
            background: "var(--k-field)",
            // When someone asks for less motion, the field simply holds still.
            animation: calm
              ? undefined
              : `k-mote-drift ${mote.duration}s ${mote.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
