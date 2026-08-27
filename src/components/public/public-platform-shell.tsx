"use client";

import { ReactNode, useEffect, useState } from "react";
import { PublicAccessGate } from "@/components/public/public-access-gate";
import {
  PUBLIC_ACCESS_STORAGE_KEY,
  PUBLIC_ACCESS_TERMS_VERSION,
} from "@/lib/legal/public-access-contract";

type AccessState = "checking" | "locked" | "accepted";

export function PublicPlatformShell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessState>("checking");

  useEffect(() => {
    try {
      const recordedVersion = window.localStorage.getItem(PUBLIC_ACCESS_STORAGE_KEY);
      setState(recordedVersion === PUBLIC_ACCESS_TERMS_VERSION ? "accepted" : "locked");
    } catch {
      setState("locked");
    }
  }, []);

  if (state === "checking") {
    return <div className="min-h-[100svh] bg-[#030202]" aria-label="Preparing Klinikos" />;
  }

  if (state === "locked") {
    return <PublicAccessGate onAccepted={(version) => setState(version === PUBLIC_ACCESS_TERMS_VERSION ? "accepted" : "locked")} />;
  }

  return <>{children}</>;
}
