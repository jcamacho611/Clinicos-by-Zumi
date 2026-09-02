import type { Metadata } from "next";
import { KLINIKOS_PUBLIC_META } from "@/lib/brand/canonical-messaging";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { PublicTrustFooter } from "@/components/marketing/public-trust-footer";
import responsiveStyles from "@/components/marketing/public-living-universe-responsive.module.css";
import { getMemberSignupReleaseState } from "@/lib/auth/member-signup-release";

export const metadata: Metadata = {
  title: KLINIKOS_PUBLIC_META.title,
  description: KLINIKOS_PUBLIC_META.description,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    type: "website",
    siteName: "Klinikos",
    title: KLINIKOS_PUBLIC_META.title,
    description: KLINIKOS_PUBLIC_META.description,
  },
  twitter: {
    card: "summary_large_image",
    title: KLINIKOS_PUBLIC_META.title,
    description: KLINIKOS_PUBLIC_META.description,
  },
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
      description: KLINIKOS_PUBLIC_META.description,
      applicationSubCategory: "Healthcare operating network",
      publisher: { "@id": "https://klinikos.io/#organization" },
    },
  ],
};

export default function LandingPage() {
  const memberSignup = getMemberSignupReleaseState();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <div className={responsiveStyles.releaseSurface}>
        <PublicLivingGateway signupEnabled={memberSignup.enabled} />
      </div>
      <PublicTrustFooter />
    </>
  );
}
