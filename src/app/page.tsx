import type { Metadata } from "next";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { PublicTrustFooter } from "@/components/marketing/public-trust-footer";

export const metadata: Metadata = {
  title: "Klinikos | Healthcare operating infrastructure",
  description:
    "Klinikos connects clinic workflow, follow-up, revenue, healthcare capacity, learning, and care navigation around accountable next actions.",
};

export default function LandingPage() {
  return (
    <>
      <PublicLivingGateway />
      <PublicTrustFooter />
    </>
  );
}
