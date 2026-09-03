"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/living-reality/living-reality.module.css";
import type { RealityPalette } from "@/components/living-reality/living-reality-scene";
import type { RealityPerformanceMode, RealityProjection } from "@/lib/living-reality/reality-projection";
import { degradeRealityMode, selectInitialRealityMode } from "@/lib/living-reality/runtime-mode";

const LivingRealityCanvas = dynamic(
  () => import("@/components/living-reality/living-reality-canvas").then((module) => module.LivingRealityCanvas),
  { ssr: false },
);

const defaultPalette: RealityPalette = {
  environment: "#050303",
  surface: "#4e292c",
  edge: "#7d4a4f",
  active: "#efaaa1",
  attention: "#e6817b",
  blocked: "#ef6d68",
  success: "#d68f87",
  livingEdge: "#b9575b",
};

function presentationPreference(): RealityPerformanceMode | null {
  try {
    const stored = window.localStorage.getItem("klinikos.reality.mode");
    if (stored === "PRECISION_MODE" || stored === "BALANCED_REALITY" || stored === "FULL_REALITY") {
      return stored;
    }
  } catch {
    // Storage availability is presentation-only. Failure must never block the application.
  }
  return null;
}

function browserSupportsWebgl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function readPalette(): RealityPalette {
  const computed = window.getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => computed.getPropertyValue(name).trim() || fallback;
  return {
    environment: token("--k-reality-environment", defaultPalette.environment),
    surface: token("--k-reality-surface", defaultPalette.surface),
    edge: token("--k-reality-edge", defaultPalette.edge),
    active: token("--k-reality-active", defaultPalette.active),
    attention: token("--k-reality-attention", defaultPalette.attention),
    blocked: token("--k-reality-blocked", defaultPalette.blocked),
    success: token("--k-reality-success", defaultPalette.success),
    livingEdge: token("--k-reality-living-edge", defaultPalette.livingEdge),
  };
}

function capWithProjectionHint(
  selected: RealityPerformanceMode,
  hint: RealityPerformanceMode,
): RealityPerformanceMode {
  if (selected === "PRECISION_MODE" || hint === "PRECISION_MODE") return "PRECISION_MODE";
  if (selected === "BALANCED_REALITY" || hint === "BALANCED_REALITY") return "BALANCED_REALITY";
  return "FULL_REALITY";
}

export function LivingRealityLayer({
  projection,
  className,
}: {
  projection: RealityProjection;
  className?: string;
}) {
  const [mode, setMode] = useState<RealityPerformanceMode>("PRECISION_MODE");
  const [status, setStatus] = useState<"probing" | "ready" | "degraded" | "precision">("probing");
  const [palette, setPalette] = useState<RealityPalette>(defaultPalette);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const memoryNavigator = navigator as Navigator & { deviceMemory?: number };
    const deviceMemoryGb = Number(memoryNavigator.deviceMemory ?? 8);
    const selected = selectInitialRealityMode({
      webgl: browserSupportsWebgl(),
      reducedMotion,
      userPreference: presentationPreference(),
      deviceMemoryGb,
    });
    const nextMode = capWithProjectionHint(selected, projection.modeHint);
    setPalette(readPalette());
    setMode(nextMode);
    setStatus(nextMode === "PRECISION_MODE" ? "precision" : "ready");
  }, [projection.modeHint]);

  const onRuntimeFailure = useCallback(() => {
    setMode((current) => {
      const next = degradeRealityMode(current);
      setStatus(next === "PRECISION_MODE" ? "precision" : "degraded");
      return next;
    });
  }, []);

  return (
    <div
      className={`${styles.layer}${className ? ` ${className}` : ""}`}
      data-living-reality-mode={mode}
      data-living-reality-status={status}
    >
      {mode === "PRECISION_MODE" ? (
        <p aria-live="polite" className={styles.precisionStatus}>
          Full interface available without 3D.
        </p>
      ) : (
        <div aria-hidden="true" className={styles.canvas}>
          <LivingRealityCanvas
            mode={mode}
            onRuntimeFailure={onRuntimeFailure}
            palette={palette}
            projection={projection}
          />
        </div>
      )}
    </div>
  );
}
