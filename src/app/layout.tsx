import type { Metadata } from "next";
import "@fontsource-variable/manrope";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
