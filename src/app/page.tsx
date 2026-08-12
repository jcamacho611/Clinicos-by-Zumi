import type { Metadata } from "next";
import { KlinikosHomepage } from "@/components/marketing/klinikos-homepage";

export const metadata: Metadata = {
  title: "Klinikos by Zumi | Clinic continuity, made visible",
  description:
    "Klinikos connects the operational work between a clinic's existing systems, with synthetic demonstrations and human review built in.",
};

export default function LandingPage() {
  return <KlinikosHomepage />;
}
