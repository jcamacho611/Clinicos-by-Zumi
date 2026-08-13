import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { KlinikosHomepage } from "@/components/marketing/klinikos-homepage";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";

export const metadata: Metadata = {
  title: "Klinikos | Healthcare, organized around what needs to happen",
  description:
    "Start with the outcome. Klinikos organizes clinic operations, healthcare opportunities, learning, care pathways, and the work between existing systems into one clear experience.",
};

export default function LandingPage() {
  return (
    <main className="k-page">
      <PublicLivingGateway />

      <div id="klinikos-story">
        <KlinikosHomepage />
      </div>

      <footer className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-col gap-9 border-t pt-9 k-rule lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-extrabold tracking-[.18em]">KLINIKOS</p>
            <p className="k-muted mt-3 max-w-lg text-xs leading-6">Healthcare operations, opportunity, learning, and connected work organized around what needs to happen next.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold">
            <Link className="inline-flex items-center gap-2" href="/login"><LogIn className="size-4" /> Sign in</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/grid">Grid</Link>
            <Link href="/edu">EDU</Link>
            <Link href="/about">About</Link>
            <Link className="inline-flex items-center gap-2 text-[var(--k-accent)]" href="/start">Start <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
