import type { Metadata } from "next";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";

export const metadata: Metadata = {
  title: "Klinikos | What needs to happen?",
  description:
    "Start with the outcome. Klinikos brings the relevant healthcare operating, network, learning, or care experience forward.",
};

export default function LandingPage() {
  return <PublicLivingGateway />;
}
