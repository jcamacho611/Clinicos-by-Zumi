"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { KlinikosAtmosphereController } from "@/components/design/klinikos-atmosphere";
import { PublicZumiSiteControl } from "@/components/marketing/public-zumi-site-control";
import { resolvePublicRoutePresentation } from "@/lib/screen-experience-route-presentation";

export function PublicUtilityDock() {
  const pathname = usePathname();
  const [activePanel, setActivePanel] = useState<"zumi" | "appearance" | null>(null);
  const presentation = resolvePublicRoutePresentation(pathname);
  const hasVisibleUtility = presentation?.zumiMode === "floating-public"
    || presentation?.appearanceMode === "adaptive";

  return (
    <div
      className={hasVisibleUtility
        ? "fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] right-3 z-[80] flex items-center gap-2 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-6"
        : "contents"}
      data-public-utility-dock={hasVisibleUtility ? "true" : undefined}
    >
      <PublicZumiSiteControl
        onOpenChange={(open) => setActivePanel(open ? "zumi" : null)}
        open={activePanel === "zumi"}
      />
      <KlinikosAtmosphereController
        onOpenChange={(open) => setActivePanel(open ? "appearance" : null)}
        open={activePanel === "appearance"}
      />
    </div>
  );
}
