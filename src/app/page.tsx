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
  { title: "Clinic", detail: "Run daily operations, patient workflows, follow-up, referrals, results, tasks, and revenue continuity.", href: "/login", action: "Enter Klinikos", icon: BriefcaseMedical },
  { title: "Grid", detail: "Find or offer healthcare work, services, capacity, space, and other eligible resources.", href: "/grid", action: "Explore Grid", icon: Grid3X3 },
  { title: "Education", detail: "Learn, practice, build verified skills, and move from education toward healthcare opportunity.", href: "/edu", action: "Explore Education", icon: GraduationCap },
  { title: "Private demo", detail: "See how Klinikos maps operational gaps using a synthetic, no-PHI demonstration.", href: "/private-demo", action: "See the demo", icon: Sparkles },
  { title: "Founding clinics", detail: "Explore the evaluation and early implementation pathway for clinics building with Klinikos.", href: "/founding-clinic", action: "View the program", icon: BookOpen },
] as const;

export default function LandingPage() {
  return (
    <>
      <PublicLivingGateway />

      <div id="klinikos-story">
        <KlinikosHomepage />
      </div>

      <section aria-labelledby="pathways-title" className="relative z-20 border-t border-white/10 bg-[#070b13] px-5 py-20 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/70">Explore Klinikos</p>
            <h2 id="pathways-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Direct access when you already know where you want to go.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">The Living Gateway is the default doorway. These direct paths remain available for experienced users and people who prefer traditional navigation.</p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pathways.map(({ title, detail, href, action, icon: Icon }) => (
              <Link key={title} href={href} className="group flex min-h-52 flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                <div><div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100"><Icon className="size-5" aria-hidden="true" /></div><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{detail}</p></div>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">{action} <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/55">
            <Link className="inline-flex items-center gap-2 hover:text-white" href="/login"><LogIn className="size-4" /> Sign in</Link>
            <Link className="hover:text-white" href="/about">About Klinikos</Link>
            <span>Complex infrastructure stays behind the experience. The path in front of you stays simple.</span>
          </div>
        </div>
      </section>

      <GridLaunchDock />
      <Link aria-label="Read the Klinikos mission and company story" className="fixed bottom-20 left-4 z-[66] inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-[#070b13]/90 px-3.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-white/70 shadow-2xl backdrop-blur-xl transition hover:border-cyan-300/30 hover:text-white sm:bottom-5 sm:left-5 sm:min-h-11 sm:px-4 sm:text-[10px]" href="/about">Our mission <ArrowRight className="size-3.5" /></Link>
    </>
  );
}
