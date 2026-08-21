"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Marks the element a deep link points at.
 *
 * CSS `:target` only fires for real fragment navigations. The App Router moves
 * between pages with `history.pushState`, which per spec does NOT set the
 * document's target element, so a reviewer arriving from the Action Center
 * would land on the right row with nothing indicating which row it was.
 *
 * This mirrors `:target` onto a data attribute for both arrival paths, so the
 * handoff reads the same whether the link was clicked in-app or pasted cold.
 */
const MARK = "data-klinikos-arrived";

export function DeepTargetMarker() {
  const pathname = usePathname();

  useEffect(() => {
    const apply = () => {
      for (const previous of document.querySelectorAll(`[${MARK}]`)) previous.removeAttribute(MARK);

      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;

      const element = document.getElementById(id);
      if (!element?.classList.contains("klinikos-deep-target")) return;

      element.setAttribute(MARK, "true");
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // The target row may render a frame after the route commits.
    const timer = window.setTimeout(apply, 0);
    window.addEventListener("hashchange", apply);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", apply);
    };
  }, [pathname]);

  return null;
}
