import type { Metadata } from "next";
import { KLINIKOS_META } from "@/lib/brand/canonical-messaging";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { EcosystemHierarchy } from "@/components/marketing/ecosystem-hierarchy";
import { ProductEvidenceSection } from "@/components/marketing/product-evidence-section";
import { PublicTrustFooter } from "@/components/marketing/public-trust-footer";

export const metadata: Metadata = {
  title: KLINIKOS_META.title,
  description: KLINIKOS_META.description,
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://klinikos.io/#organization",
      name: "Klinikos",
      url: "https://klinikos.io/",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://klinikos.io/#software",
      name: "Klinikos",
      url: "https://klinikos.io/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: KLINIKOS_META.description,
      publisher: { "@id": "https://klinikos.io/#organization" },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <PublicLivingGateway />
      <ProductEvidenceSection />
      <EcosystemHierarchy />
      <PublicTrustFooter />
    </>
  );
}