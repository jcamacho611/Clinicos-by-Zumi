"use client";

import { useState } from "react";
import { KlinikosAtmosphereController } from "@/components/design/klinikos-atmosphere";
import { PublicZumiSiteControl } from "@/components/marketing/public-zumi-site-control";

export function PublicUtilityDock() {
  const [activePanel, setActivePanel] = useState<"zumi" | "appearance" | null>(null);

  return (
    <div
      className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] right-3 z-[80] flex items-center gap-2 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-6"
      data-public-utility-dock="true"
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
