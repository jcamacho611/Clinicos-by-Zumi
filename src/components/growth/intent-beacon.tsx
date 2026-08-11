"use client";

import { useEffect, useRef } from "react";
import type { IntentEventType } from "@/lib/growth/intent";

/**
 * Records that a visitor reached a page.
 *
 * Fires once per mount, never blocks render, and never surfaces a failure — a person
 * reading a marketing page should not be shown an error because telemetry did not
 * write.
 *
 * This is the entire tracking mechanism on the Klinikos public site. There is no
 * third-party script, no advertising pixel, and no cross-site identifier; the
 * endpoint it posts to accepts only a closed set of event types.
 */
export function IntentBeacon({ event, subject, path }: { event: IntentEventType; subject?: string; path?: string }) {
  const fired = useRef(false);

  useEffect(() => {
    // React runs effects twice in development. Without this the same page view is
    // recorded twice and every local score is quietly double-counted.
    if (fired.current) return;
    fired.current = true;

    const controller = new AbortController();
    void fetch("/api/growth/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: event, subject: subject ?? null, path: path ?? window.location.pathname }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [event, subject, path]);

  return null;
}

/**
 * Records an event on an intentional action rather than on arrival.
 *
 * Used for the moments that actually mean something — starting the demo, clicking
 * through to checkout — where a page view would understate what happened.
 */
export function recordIntent(event: IntentEventType, subject?: string) {
  void fetch("/api/growth/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: event, subject: subject ?? null, path: window.location.pathname }),
    keepalive: true,
  }).catch(() => undefined);
}
