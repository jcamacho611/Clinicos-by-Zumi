import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import { KlinikosAtmosphereController } from "@/components/design/klinikos-atmosphere";
import { klinikosAtmosphereBootstrap } from "@/lib/design/atmosphere";
import "./globals.css";
import "./cinematic-global.css";
import "./cinematic-legacy-overrides.css";
import "./cinematic-command-overrides.css";
import "./cinematic-home-overrides.css";
import "./experience-convergence.css";

const siteUrl = "https://klinikos.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Klinikos — The Healthcare Operating Ecosystem",
    template: "%s | Klinikos",
  },
  description: "A healthcare operating ecosystem for clinical workflow, office operations, patient follow-through, provider networks, education, capacity, and revenue intelligence.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Klinikos",
    title: "Klinikos — The Healthcare Operating Ecosystem",
    description: "One coherent operating layer for healthcare workflow, network capacity, care coordination, education, and revenue intelligence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klinikos — The Healthcare Operating Ecosystem",
    description: "One coherent operating layer for healthcare workflow, network capacity, care coordination, education, and revenue intelligence.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-klinikos-ds
      data-klinikos-atmosphere="night"
      data-klinikos-atmosphere-preference="auto"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: klinikosAtmosphereBootstrap }} />
      </head>
      <body className="klinikos-cinematic-root">
        {children}
        <KlinikosAtmosphereController />
      </body>
    </html>
  );
}
