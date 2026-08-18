import type { Metadata } from "next";
import { AppShell } from "@/components/clinic/app-shell";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClinicSession();
  return <AppShell session={session}>{children}</AppShell>;
}
