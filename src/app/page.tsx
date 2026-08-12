import type { Metadata } from "next";
import { GridLaunchDock } from "@/components/marketing/grid-launch-dock";
import { KlinikosHomepage } from "@/components/marketing/klinikos-homepage";

export const metadata: Metadata = {
  title: "Klinikos | Clinic continuity, made visible",
  description:
    "Klinikos connects the operational work between a clinic's existing systems. Zumi is the operating intelligence inside Klinikos, with synthetic demonstrations and human review built in.",
};

export default function LandingPage() {
  return (
    <>
      <KlinikosHomepage />
      <GridLaunchDock />
    </>
  );
}
