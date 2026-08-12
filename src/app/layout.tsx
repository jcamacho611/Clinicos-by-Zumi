import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import { KlinikosAtmosphereController } from "@/components/design/klinikos-atmosphere";
import { klinikosAtmosphereBootstrap } from "@/lib/design/atmosphere";
import "./globals.css";

const siteUrl = "https://klinikos.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Klinikos — The Clinic Operating System",
    template: "%s | Klinikos",
  },
  description: "One operating layer for clinical workflow, office operations, patient follow-through, provider networks, and revenue intelligence.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Klinikos",
    title: "Klinikos — The Clinic Operating System",
    description: "One operating layer for clinical workflow, office operations, patient follow-through, provider networks, and revenue intelligence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klinikos — The Clinic Operating System",
    description: "One operating layer for clinical workflow, office operations, patient follow-through, provider networks, and revenue intelligence.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-klinikos-atmosphere="day" data-klinikos-atmosphere-preference="auto">
      <head>
        <script dangerouslySetInnerHTML={{ __html: klinikosAtmosphereBootstrap }} />
      </head>
      <body>
        {children}
        <KlinikosAtmosphereController />
      </body>
    </html>
  );
}
