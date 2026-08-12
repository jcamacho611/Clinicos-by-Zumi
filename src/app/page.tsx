import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KlinikosHomepage } from "@/components/marketing/klinikos-homepage";

export const metadata: Metadata = {
  title: "Klinikos by Zumi | Clinic continuity, made visible",
  description:
    "Klinikos connects the operational work between a clinic's existing systems, with synthetic demonstrations and human review built in.",
};

export default function LandingPage() {
  return <>
    <KlinikosHomepage />
    <Link
      aria-label="Read the Klinikos mission and company story"
      className="fixed bottom-5 left-5 z-[70] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-[#070b13]/90 px-4 text-[10px] font-extrabold uppercase tracking-[.14em] text-white/70 shadow-2xl backdrop-blur-xl transition hover:border-cyan-300/30 hover:text-white"
      href="/about"
    >
      Our mission <ArrowRight className="size-3.5" />
    </Link>
  </>;
}
