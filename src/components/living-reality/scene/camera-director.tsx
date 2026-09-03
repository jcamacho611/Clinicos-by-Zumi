"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { CameraIntent } from "@/lib/living-reality/reality-projection";

export type CameraDirectorProps = {
  intent: CameraIntent | null;
  activePosition: [number, number, number] | null;
};

export function CameraDirector({ intent, activePosition }: CameraDirectorProps) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    if (activePosition && (intent === "FOCUS_OBJECT" || intent === "INSPECT" || intent === "MISSION" || intent === "OUTCOME")) {
      const [x, y, z] = activePosition;
      camera.position.set(x + 1.35, y + 0.85, z + 3.1);
      camera.lookAt(x, y, z);
      invalidate();
      return;
    }

    camera.position.set(0, 0.45, intent === "NETWORK_OVERVIEW" ? 7.2 : 6);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [activePosition, camera, intent, invalidate]);

  return null;
}
