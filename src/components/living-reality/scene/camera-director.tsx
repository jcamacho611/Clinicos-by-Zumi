"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import type { CameraIntent } from "@/lib/living-reality/reality-projection";

export const TRANSITION_MS = 420;

type CameraPreset = {
  position: readonly [number, number, number];
  fov: number;
};

export const CAMERA_PRESETS: Readonly<Record<CameraIntent, CameraPreset>> = Object.freeze({
  ARRIVAL: { position: [0, 0, 8], fov: 42 },
  FOCUS_OBJECT: { position: [0, 0, 6.4], fov: 40 },
  SHOW_RELATIONSHIPS: { position: [0, 0, 8.8], fov: 44 },
  INSPECT: { position: [0.4, 0.15, 5.8], fov: 38 },
  MISSION: { position: [0, 0.2, 7.4], fov: 40 },
  OUTCOME: { position: [0, 0, 8.2], fov: 42 },
  NETWORK_OVERVIEW: { position: [0, 0.3, 10.4], fov: 46 },
  TIME_COMPARE: { position: [0, 0.1, 9.4], fov: 45 },
  PRECISION_LOCK: { position: [0, 0, 8], fov: 42 },
});

type CameraDirectorProps = {
  cameraIntent: CameraIntent | null;
};

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function CameraDirector({ cameraIntent }: CameraDirectorProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraIntent ?? "ARRIVAL"];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const perspectiveCamera = camera instanceof PerspectiveCamera ? camera : null;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const applyTarget = () => {
      camera.position.set(...preset.position);
      if (perspectiveCamera) perspectiveCamera.fov = preset.fov;
      camera.updateProjectionMatrix();
      invalidate();
    };

    if (reducedMotion || cameraIntent === "PRECISION_LOCK") {
      applyTarget();
      return undefined;
    }

    const startPosition = camera.position.clone();
    const startFov = perspectiveCamera?.fov ?? null;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / TRANSITION_MS);
      const eased = easeInOutCubic(progress);

      camera.position.set(
        startPosition.x + (preset.position[0] - startPosition.x) * eased,
        startPosition.y + (preset.position[1] - startPosition.y) * eased,
        startPosition.z + (preset.position[2] - startPosition.z) * eased,
      );
      if (perspectiveCamera && startFov !== null) {
        perspectiveCamera.fov = startFov + (preset.fov - startFov) * eased;
      }
      camera.updateProjectionMatrix();
      invalidate();

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [camera, cameraIntent, invalidate]);

  return null;
}
