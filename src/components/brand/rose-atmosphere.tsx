"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The rose, as an environmental layer rather than an image attached to one section.
 *
 * The behaviour the design contract asks for is depth: the page should feel like it
 * moves *through* the rose, so the background travels slower than the content in front
 * of it and changes scale slightly as it goes. That is one mechanism with four
 * intensities, not four separate decorations — which is why the variants below differ
 * only in how much they move, how large they are, and how hard their edges fade.
 *
 * Three rules this component exists to keep:
 *
 *  - It is decorative. `aria-hidden` and `role="presentation"` are not optional: a
 *    screen reader announcing a background flower on every surface is noise, and there
 *    is no information here that is not also in the text.
 *  - `prefers-reduced-motion` removes the parallax and keeps the atmosphere. The
 *    reduced-motion answer to "moving background" is a still background, not a blank
 *    one — people who get motion sick should not also lose the brand.
 *  - It never intercepts a click. `pointer-events: none` throughout, and it sits
 *    behind content on its own z-index.
 *
 * Scroll work happens inside one `requestAnimationFrame`, reading `scrollY` once per
 * frame and writing a single transform, so it cannot cause layout thrash on the
 * operational surfaces where it runs alongside real work.
 */

export type RoseVariant = "living-home" | "public-funnel" | "transition" | "workspace";

interface VariantSpec {
  /** Fraction of scroll distance the layer travels. 0 is pinned, 1 moves with content. */
  readonly drift: number;
  /** How much the layer scales across a full viewport of scrolling. */
  readonly scaleTravel: number;
  readonly image: string;
  /** Width of the rose relative to the viewport, and its ceiling in pixels. */
  readonly size: string;
  readonly position: string;
  readonly opacity: number;
  /** Radial mask that fades the edges into the page ground. */
  readonly mask: string;
  readonly height: string;
}

const variants: Record<RoseVariant, VariantSpec> = {
  /** Large and cinematic, drifting slowly enough to read as depth rather than motion. */
  "living-home": {
    drift: 0.14,
    scaleTravel: 0.06,
    image: "/klinikos-rose-hero-production.png",
    size: "min(85vw, 1280px)",
    position: "center 52px",
    opacity: 1,
    mask: "radial-gradient(closest-side at 50% 46%, #000 42%, rgba(0,0,0,.5) 72%, transparent 100%)",
    height: "760px",
  },
  /**
   * Follows the composition through the funnel's sections at roughly a third of scroll
   * velocity, so it reads as one continuous object the page travels past rather than a
   * separate image per section.
   */
  "public-funnel": {
    drift: 0.3,
    scaleTravel: 0.1,
    image: "/klinikos-rose-wide-production.png",
    size: "min(105vw, 1600px)",
    position: "center 12%",
    opacity: 0.72,
    mask: "radial-gradient(closest-side at 50% 40%, #000 38%, rgba(0,0,0,.42) 70%, transparent 100%)",
    height: "1100px",
  },
  /** A smaller partial rose for the moments between one surface and the next. */
  transition: {
    drift: 0.2,
    scaleTravel: 0.05,
    image: "/klinikos-rose-hero-production.png",
    size: "min(52vw, 620px)",
    position: "72% 20%",
    opacity: 0.4,
    mask: "radial-gradient(closest-side at 62% 40%, #000 30%, rgba(0,0,0,.34) 64%, transparent 100%)",
    height: "540px",
  },
  /**
   * Operational surfaces get atmosphere, not a giant flower. A table of money that
   * needs attention should not have a rose behind it competing for the eye, so this
   * variant is mostly gradient with a cropped suggestion of petal geometry.
   */
  workspace: {
    drift: 0.08,
    scaleTravel: 0.02,
    image: "/klinikos-rose-bg.svg",
    size: "min(70vw, 900px)",
    position: "88% -18%",
    opacity: 0.14,
    mask: "radial-gradient(closest-side at 78% 26%, #000 24%, rgba(0,0,0,.26) 58%, transparent 100%)",
    height: "620px",
  },
};

export function RoseAtmosphere({ variant = "workspace", className }: { variant?: RoseVariant; className?: string }) {
  const spec = variants[variant];
  const layerRef = useRef<HTMLDivElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionAllowed(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!motionAllowed) {
      // Reduced motion: clear any transform left from a previous state so the layer
      // rests wherever the stylesheet puts it, still visible, simply still.
      if (layerRef.current) layerRef.current.style.transform = "";
      return;
    }

    let frame = 0;
    const draw = () => {
      frame = 0;
      const layer = layerRef.current;
      if (!layer) return;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / Math.max(window.innerHeight, 1), 3);
      const offset = scrolled * spec.drift;
      const scale = 1 + progress * spec.scaleTravel;
      layer.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    };

    const onScroll = () => {
      // Coalesce to one write per frame: several scroll events can land between paints.
      if (!frame) frame = window.requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [motionAllowed, spec.drift, spec.scaleTravel]);

  return (
    <div
      aria-hidden="true"
      className={className}
      data-rose-variant={variant}
      role="presentation"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div
        ref={layerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: spec.height,
          backgroundImage: `url('${spec.image}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: spec.position,
          backgroundSize: `${spec.size} auto`,
          opacity: spec.opacity,
          maskImage: spec.mask,
          WebkitMaskImage: spec.mask,
          transformOrigin: "50% 36%",
          willChange: motionAllowed ? "transform" : undefined,
        }}
      />
    </div>
  );
}
