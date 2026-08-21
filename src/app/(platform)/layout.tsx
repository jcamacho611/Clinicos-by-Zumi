import type { Metadata } from "next";
import { AppShell } from "@/components/clinic/app-shell";
import { DeepTargetMarker } from "@/components/clinic/deep-target-marker";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClinicSession();
  return <AppShell session={session}><DeepTargetMarker />{children}</AppShell>;
}
