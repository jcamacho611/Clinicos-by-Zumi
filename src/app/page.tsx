import type { Metadata } from "next";
import { PublicConversionBridge } from "@/components/marketing/public-conversion-bridge";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";

export const metadata: Metadata = {
  title: "Klinikos | What needs to happen?",
  description:
    "Start with the outcome. Klinikos brings the relevant healthcare operating, network, learning, route, care, or commercial experience forward.",
};

export default function LandingPage() {
  return (
    <>
      <PublicLivingGateway />
      <PublicConversionBridge />
    </>
  );
}
