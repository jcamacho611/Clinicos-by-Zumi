import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseMedical, GraduationCap, Grid3X3, LogIn, Sparkles } from "lucide-react";
import { GridLaunchDock } from "@/components/marketing/grid-launch-dock";
import { KlinikosHomepage } from "@/components/marketing/klinikos-homepage";
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";

export const metadata: Metadata = {
  title: "Klinikos | Healthcare, organized around what needs to happen",
  description:
    "Start with the outcome. Klinikos organizes clinic operations, healthcare opportunities, learning, care pathways, and the work between existing systems into one clear experience.",
};

const pathways = [
  { title: "Clinic OS", detail: "Run daily operations, patient workflows, follow-up, referrals, results, tasks, and revenue continuity.", href: "/start", action: "Run a clinic", icon: BriefcaseMedical },
  { title: "Grid", detail: "Find or offer healthcare work, services, capacity, rooms, equipment, organizations, and other reviewed resources.", href: "/grid", action: "Explore Grid", icon: Grid3X3 },
  { title: "Klinikos EDU", detail: "Learn through courses and scenarios, build readiness, and connect education to future healthcare opportunity.", href: "/edu", action: "Explore EDU", icon: GraduationCap },
  { title: "Clinic Operating Analysis", detail: "Map operational gaps with a synthetic, no-PHI review and continue into the exact next step you select.", href: "/private-demo", action: "Start the analysis", icon: Sparkles },
  { title: "Founding clinics", detail: "Explore the evaluation and implementation pathway for clinics that want Klinikos configured around their real operations.", href: "/founding-clinic", action: "View the program", icon: BookOpen },
] as const;

export default function LandingPage() {
  return (
    <>
      <PublicLivingGateway />

      <div id="klinikos-story">
        <KlinikosHomepage />
      </div>

      <section aria-labelledby="pathways-title" className="relative z-20 border-t border-white/10 bg-[#070b13] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/70">Explore Klinikos</p>
            <h2 id="pathways-title" className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Different doors. One healthcare operating ecosystem.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">Start with the part that matters to you. The deeper system stays available without forcing every person to see every capability at once.</p>
          </div>

          <div className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2">
            {pathways.map(({ title, detail, href, action, icon: Icon }) => (
              <Link key={title} href={href} className="group border-t border-white/12 pt-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                <div className="flex items-start gap-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-100"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-semibold">{title}</span>
                    <span className="mt-4 block max-w-xl text-sm leading-7 text-white/52">{detail}</span>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/78 transition group-hover:text-white">{action} <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-20 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/10 pt-8 text-sm text-white/50">
            <Link className="font-semibold text-white/75 hover:text-white" href="/access">Get verified free access</Link>
            <Link className="inline-flex items-center gap-2 hover:text-white" href="/login"><LogIn className="size-4" /> Sign in</Link>
            <Link className="hover:text-white" href="/pricing">Pricing</Link>
            <Link className="hover:text-white" href="/about">About Klinikos</Link>
            <span>Complex infrastructure stays behind the experience.</span>
          </div>
        </div>
      </section>

      <GridLaunchDock />
      <Link aria-label="Read the Klinikos mission and company story" className="fixed bottom-20 left-4 z-[66] inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-[#070b13]/90 px-3.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-white/70 shadow-2xl backdrop-blur-xl transition hover:border-cyan-300/30 hover:text-white sm:bottom-5 sm:left-5 sm:min-h-11 sm:px-4 sm:text-[10px]" href="/about">Our mission <ArrowRight className="size-3.5" /></Link>
    </>
  );
}
