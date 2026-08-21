import type { Metadata } from "next";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { PublicProductDefinition } from "@/components/marketing/public-product-definition";
import { PublicTrustFooter } from "@/components/marketing/public-trust-footer";

export const metadata: Metadata = {
  title: "Klinikos | AI-native clinic operating system",
  description:
    "Klinikos is an AI-native clinic operating system for scheduling, follow-up, referrals, team workflows, documents, revenue work, and owner visibility, with Zumi intelligence and the Grid healthcare network.",
};

export default function LandingPage() {
  return (
    <>
      <PublicProductDefinition />
      <PublicLivingGateway />
      <PublicTrustFooter />
    </>
  );
}
