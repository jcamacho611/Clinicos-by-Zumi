import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import { KlinikosAtmosphereController } from "@/components/design/klinikos-atmosphere";
import { PublicZumiSiteControl } from "@/components/marketing/public-zumi-site-control";
import { KLINIKOS_META } from "@/lib/brand/canonical-messaging";
import { klinikosAtmosphereBootstrap } from "@/lib/design/atmosphere";
import "./globals.css";
import "./cinematic-global.css";
import "./cinematic-legacy-overrides.css";
import "./cinematic-command-overrides.css";
import "./cinematic-home-overrides.css";
import "./experience-convergence.css";
import "./accessibility.css";

const siteUrl = "https://klinikos.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Klinikos",
  title: {
    default: KLINIKOS_META.title,
    template: "%s | Klinikos",
  },
  description: KLINIKOS_META.description,
  category: "healthcare software",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Klinikos",
    title: KLINIKOS_META.title,
    description: KLINIKOS_META.description,
  },
  twitter: {
    card: "summary_large_image",
    title: KLINIKOS_META.title,
    description: KLINIKOS_META.description,
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
        <a className="klinikos-skip-link" href="#klinikos-page-content">Skip to main content</a>
        <div id="klinikos-page-content" className="klinikos-theme-surface" tabIndex={-1}>{children}</div>
        <PublicZumiSiteControl />
        <KlinikosAtmosphereController />
      </body>
    </html>
  );
}
