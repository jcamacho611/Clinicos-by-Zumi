"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { KlinikosAtmosphereController } from "@/components/design/klinikos-atmosphere";
import { PublicZumiSiteControl } from "@/components/marketing/public-zumi-site-control";
import { routePresentationPolicy } from "@/lib/design/route-presentation-policy";

export function PublicUtilityDock() {
  const pathname = usePathname();
  const presentation = routePresentationPolicy(pathname);
  const [activePanel, setActivePanel] = useState<"zumi" | "appearance" | null>(null);

  if (!presentation.utilityDockVisible) return null;

  return (
    <div
      className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] right-3 z-[80] flex items-center gap-2 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-6"
      data-public-utility-dock="true"
    >
      {presentation.publicZumiVisible ? (
        <PublicZumiSiteControl
          onOpenChange={(open) => setActivePanel(open ? "zumi" : null)}
          open={activePanel === "zumi"}
        />
      ) : null}
      {presentation.appearanceControllerVisible ? (
        <KlinikosAtmosphereController
          onOpenChange={(open) => setActivePanel(open ? "appearance" : null)}
          open={activePanel === "appearance"}
        />
      ) : null}
    </div>
  );
}
