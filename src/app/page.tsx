import type { Metadata } from "next";
import { KlinikosHomepage } from "@/components/marketing/klinikos-homepage";

export const metadata: Metadata = {
  title: "Klinikos | Clinic continuity, made visible",
  description:
    "Klinikos connects the operational work between a clinic's existing systems, with Zumi intelligence, synthetic demonstrations, and human review built in.",
};

export default function LandingPage() {
  return <KlinikosHomepage />;
}
