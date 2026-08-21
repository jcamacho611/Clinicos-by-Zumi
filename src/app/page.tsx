import type { Metadata } from "next";
import { KLINIKOS_META } from "@/lib/brand/canonical-messaging";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { PublicTrustFooter } from "@/components/marketing/public-trust-footer";

/* Read from the canonical source. The previous title, "Healthcare operating
   infrastructure", is the register that lost us an evaluator: it is accurate and it
   tells a stranger nothing. A search result has to answer "what is this company" on
   its own, because for most people it is the only sentence they will read. */
export const metadata: Metadata = {
  title: KLINIKOS_META.title,
  description: KLINIKOS_META.description,
};

export default function LandingPage() {
  return (
    <>
      <PublicLivingGateway />
      <PublicTrustFooter />
    </>
  );
}
