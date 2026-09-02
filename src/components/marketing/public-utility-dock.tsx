"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  KlinikosAtmosphereController,
  KlinikosAtmosphereRouteSync,
} from "@/components/design/klinikos-atmosphere";
import { PublicZumiSiteControl } from "@/components/marketing/public-zumi-site-control";
import { resolvePublicRoutePresentation } from "@/lib/screen-experience-route-presentation";

export function PublicUtilityDock() {
  const pathname = usePathname();
  return <RouteScopedPublicUtilityDock key={pathname} pathname={pathname} />;
}

function RouteScopedPublicUtilityDock({ pathname }: { pathname: string }) {
  const [activePanel, setActivePanel] = useState<"zumi" | "appearance" | null>(null);
  const presentation = resolvePublicRoutePresentation(pathname);
  const hasVisibleUtility = presentation?.zumiMode === "floating-public"
    || presentation?.appearanceMode === "adaptive";

  return (
    <>
      <KlinikosAtmosphereRouteSync pathname={pathname} />
      {hasVisibleUtility ? (
        <div
          className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] right-3 z-[80] flex items-center gap-2 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-6"
          data-public-utility-dock="true"
        >
          {presentation?.zumiMode === "floating-public" ? (
            <PublicZumiSiteControl
              onOpenChange={(open) => setActivePanel(open ? "zumi" : null)}
              open={activePanel === "zumi"}
            />
          ) : null}
          {presentation?.appearanceMode === "adaptive" ? (
            <KlinikosAtmosphereController
              onOpenChange={(open) => setActivePanel(open ? "appearance" : null)}
              open={activePanel === "appearance"}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
